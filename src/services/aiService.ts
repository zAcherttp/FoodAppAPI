import { Type } from "@google/genai";
import { gemini } from "../config/gemini";
import supabase from "../config/supabase";
import {
  Recipe,
  SearchOptions,
  RAGResponse,
  SearchQuery,
  ImageExtractionResult,
} from "../types";
import sharp from "sharp";

import { pipeline } from "@huggingface/transformers";

export class RecipeAssistant {
  private static embeddingPipeline: any = null;

  async initializeEmbedding() {
    if (!RecipeAssistant.embeddingPipeline) {
      RecipeAssistant.embeddingPipeline = await pipeline(
        "feature-extraction",
        "Snowflake/snowflake-arctic-embed-m-v2.0",
        {
          dtype: "q8",
          revision: "main",
        }
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Remove the delay on first call
    if (!RecipeAssistant.embeddingPipeline) {
      await this.initializeEmbedding();
    }

    const response = await RecipeAssistant.embeddingPipeline(text, {
      normalize: true,
      pooling: "cls",
    });

    // Direct array conversion
    return Array.from(response.ort_tensor.data);
  }

  // Build searchable text from recipe data
  buildSearchableText(recipe: Recipe): string {
    const parts = [
      "Title: " + recipe.title,
      "Author: " + recipe.author,
      "Tags: " + (recipe.tags?.join(", ") || ""),
      "Ingredients: " + (recipe.ingredients?.join(", ") || ""),
      "Instructions: " + (recipe.instructions?.join(" ") || ""),
      "Time: " + recipe.time,
    ].filter(Boolean);

    return parts.join(" ");
  }

  buildQuery(query: SearchQuery): string {
    const parts = [
      "Title: " + query.title,
      "Author: " + query.author,
      "Tags: " + (query.tags?.join(", ") || ""),
      "Ingredients: " + (query.ingredients?.join(", ") || ""),
      "Instructions: " + (query.instructions?.join(" ") || ""),
      "Time: " + query.time,
    ].filter(Boolean);

    return parts.join(" ");
  }

  // Generate embeddings for existing recipes and update database
  async processRecipes(): Promise<void> {
    try {
      // Fetch all recipes without embeddings
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("*")
        .is("embedding", null);

      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      if (!recipes || recipes.length === 0) {
        console.log("No recipes found without embeddings");
        return;
      }

      console.log(`Processing ${recipes.length} recipes...`);

      for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];

        try {
          let R: Recipe = {
            id: recipe.id,
            title: recipe.title,
            author: recipe.author,
            tags: recipe.tags as string[],
            ingredients: recipe.ingredients as string[],
            instructions: recipe.instructions as string[],
            time: recipe.time,
          }; // Generate embedding
          const embedding: number[] = await this.generateEmbedding(
            this.buildSearchableText(R)
          );

          // Log embedding info for debugging
          console.log(`Embedding dimensions: ${embedding.length}`);

          // Update recipe with embedding (store as vector directly)
          const { error: updateError } = await supabase
            .from("recipes")
            .update({ embedding: embedding })
            .eq("id", recipe.id);
          if (updateError) {
            console.error(
              `Failed to update recipe ${recipe.id}:`,
              updateError.message
            );
            console.error(updateError.message);
            // Show preview of embedding instead of full vector
            const preview =
              embedding.length > 5
                ? `[${embedding.slice(0, 3).join(", ")}, ...${
                    embedding.length - 3
                  } more floats]`
                : `[${embedding.join(", ")}]`;

            console.error(`Embedding preview: ${preview}`);
          } else {
            console.log(
              `Processed recipe ${i + 1}/${recipes.length}: ${recipe.title}`
            );
          }
        } catch (error: any) {
          console.error(`Error processing recipe ${recipe.id}:`, error.message);
        }
      }

      console.log("Finished processing recipes");
    } catch (error: any) {
      console.error("Error in processExistingRecipes:", error.message);
      throw error;
    }
  }

  async generateRecipeEmbedding(recipe: Recipe): Promise<number[]> {
    try {
      const text = this.buildSearchableText(recipe);
      return await this.generateEmbedding(text);
    } catch (error: any) {
      console.error(
        `Error generating embedding for recipe ${recipe.id}:`,
        error.message
      );
      throw error;
    }
  }

  async vectorSearchRecipes(
    userQuery: SearchQuery,
    options: SearchOptions = {}
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // 1. Generate embedding for user query
      const [queryEmbedding] = await Promise.all([
        this.generateEmbedding(this.buildQuery(userQuery)),
        // Pre-warm any other resources if needed
      ]);

      // 2. Perform vector similarity search
      const [searchResults] = await Promise.all([
        supabase.rpc("vector_search", {
          query_embedding: queryEmbedding,
          similarity_threshold: options.similarity_threshold || 0.5,
          match_limit: options.match_limit || 10,
        }),
        // Could pre-process other data here
      ]);

      if (searchResults.error) {
        throw new Error(`Search failed: ${searchResults.error.message}`);
      }

      console.log("found " + searchResults.data.length + " results");

      const searchTime = Date.now() - startTime;

      // 3. Format recipes and filter out non-dietary-compatible ones
      const compatibleRecipes = searchResults.data.map((result: any) => ({
        id: result.id,
        title: result.title,
        author: result.author,
        image_url: result.image_url,
        ingredients: result.ingredients,
        instructions: result.instructions,
        created_at: result.created_at,
        updated_at: result.updated_at,
        comments: result.comments,
        rating: result.rating,
        tags: result.tags,
        duration: result.duration,
        similarity: result.similarity,
      })) as (Recipe & { similarity: number })[];

      // 4. Generate refined answer using Gemini
      const refinedAnswer = await this.generateRefinedAnswer(
        userQuery,
        options,
        compatibleRecipes
      );

      // 5. Calculate metadata
      const avgSimilarity =
        compatibleRecipes.length > 0
          ? compatibleRecipes.reduce((sum, r) => sum + r.similarity, 0) /
            compatibleRecipes.length
          : 0;

      // if refined asnwer can be parsed to recipe id's, remap compatibleRecipes with those ids, title, and image_url
      try {
        const parsedAnswer = JSON.parse(refinedAnswer);
        if (parsedAnswer.id && Array.isArray(parsedAnswer.id)) {
          const filteredRecipes = compatibleRecipes.filter((recipe) =>
            parsedAnswer.id.includes(recipe.id)
          );
          // Reorder recipes based on the order in refined answer
          const orderedRecipes = parsedAnswer.id
            .map((id: string) =>
              filteredRecipes.find((recipe) => recipe.id === id)
            )
            .filter(Boolean);

          if (orderedRecipes.length > 0) {
            compatibleRecipes.length = 0; // Clear array
            compatibleRecipes.push(...orderedRecipes);
          }
        }
      } catch (parseError) {
        console.log(
          "Could not parse refined answer as JSON, using original recipes"
        );
      }

      return {
        recipes: compatibleRecipes,
        search_metadata: {
          total_found: compatibleRecipes.length,
          avg_similarity: Math.round(avgSimilarity * 1000) / 1000,
          search_time_ms: searchTime,
        },
      };
    } catch (error: any) {
      console.error("RAG search error:", error.message);
      throw error;
    }
  }

  private async generateRefinedAnswer(
    userQuery: SearchQuery,
    options: SearchOptions,
    recipes: Recipe[]
  ): Promise<string> {
    if (recipes.length === 0) {
      return "";
    }

    // Build context from top recipes
    const context = recipes.slice(0, options.match_limit).map((recipe) => ({
      id: recipe.id,
      name: recipe.title,
      author: recipe.author,
      tags: recipe.tags || [],
      ingredients: recipe.ingredients || [],
      time: recipe.time || "",
    }));

    const query = {
      title: userQuery.title || "",
      author: userQuery.author || "",
      tags: userQuery.tags || [],
      ingredients: userQuery.ingredients || [],
      instructions: userQuery.instructions || [],
      time: userQuery.time || "",
    };

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["id"],
        properties: {
          id: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
      },
      systemInstruction: [
        {
          text: `Bạn là một trợ lý nấu ăn thông minh. Hãy dùng "query" và "context" được cấp để nhận diện những công thức thực sự phù hợp.

Hướng dẫn cho từng mục
          "Title": Hãy nhận diện nếu từ khoá này có trong công thức
          "Author": Tên tác giả của công thức,
          "Tags": Các thẻ mô tả công thức, ví dụ: "dễ làm", "ăn chay", "không gluten", "không sữa", "không đậu phộng", "không hạt cây", "không trứng", "không cá", "không hải sản", "không đậu nành",
          "Ingredients": Danh sách các nguyên liệu cần thiết, ví dụ: "thịt gà", "cà chua", "hành tây", nếu query chỉ có duy nhất mục nguyên liệu thì hãy nhận diện nếu công thức có nguyên liệu đó,
          "Instructions": Các bước thực hiện công thức, ví dụ: "Nấu thịt gà trong 30 phút", "Thêm cà chua và hành tây",
          "Time": Thời gian thực hiện công thức, ví dụ: "30 phút", "1 giờ", "2 giờ", Hãy loại bỏ các công thức có thời gian nấu dài hơn mục này nếu được định nghĩa.
Nội dung trả về là mảng id của công thức`,
        },
      ],
    };
    const model = "gemini-2.0-flash-lite";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `query: ${JSON.stringify(query, null, 2)}
            context: ${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ];

    try {
      const response = await gemini.models.generateContent({
        model,
        config,
        contents,
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.text!;
    } catch (error: any) {
      console.error("Gemini refinement error:", error.message);
      return "";
    }
  }

  async extractIngredientsFromImage(
    base64Image: string,
    mimeType: string
  ): Promise<ImageExtractionResult> {
    const optimizedImage = await this.optimizeImageForProcessing(base64Image);

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["ingredients", "suggested_dishes"],
        properties: {
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          suggested_dishes: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
      },
      systemInstruction: [
        {
          text: `Bạn là một đầu bếp chuyên nhận diện nguyên liệu nấu ăn từ hình ảnh và gợi ý ít nhất 01 công thức dựa trên nguyên liệu đó. 
          
          Hãy phân tích hình ảnh và trả về danh sách các nguyên liệu có thể nhận diện được.

          Quy tắc:
          - Chỉ nhận diện những nguyên liệu rõ ràng, có thể sử dụng để nấu ăn
          - Trả về tên tiếng Việt của nguyên liệu
          - Không bao gồm các vật dụng, đồ dùng nhà bếp
          - Nếu không nhận diện được nguyên liệu nào, trả về mảng rỗng
          - Ưu tiên các nguyên liệu tươi sống như rau củ, thịt cá, gia vị

          Ví dụ: ["cà chua", "hành tây", "thịt bò", "rau xà lách", "ớt"]`,
        },
      ],
    };

    const model = "gemini-2.0-flash-lite";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: "Hãy nhận diện các nguyên liệu nấu ăn trong hình ảnh này:",
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: optimizedImage,
            },
          },
        ],
      },
    ];

    try {
      const response = await gemini.models.generateContent({
        model,
        config,
        contents,
      });

      const result = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (result) {
        const parsed = JSON.parse(result) as ImageExtractionResult;
        return parsed || [];
      }
      return {
        ingredients: [],
        suggested_dishes: [],
      };
    } catch (error: any) {
      console.error("Ingredient extraction error:", error.message);
      throw new Error(`Failed to extract ingredients: ${error.message}`);
    }
  }

  private async optimizeImageForProcessing(
    base64Image: string
  ): Promise<string> {
    const inputBuffer = Buffer.from(base64Image, "base64");
    let quality = 80;
    let width = 1920;
    let optimizedImage: Buffer;

    do {
      optimizedImage = await sharp(inputBuffer)
        .resize({
          width: width,
          height: undefined,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: quality })
        .toBuffer();

      if (optimizedImage.length > 2 * 1024 * 1024) {
        if (quality > 50) {
          quality -= 10;
        } else {
          width = Math.floor(width * 0.8);
          quality = 80;
        }
      }
    } while (
      optimizedImage.length > 2 * 1024 * 1024 &&
      (quality >= 30 || width >= 480)
    );

    return optimizedImage.toString("base64");
  }

  async getSuggestedRecipes(ingredients: string[]): Promise<Recipe[]> {
    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["recipes"],
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["title", "ingredients", "instructions", "time"],
              properties: {
                title: {
                  type: Type.STRING,
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                instructions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                time: {
                  type: Type.STRING,
                },
              },
            },
          },
        },
      },
      systemInstruction: [
        {
          text: `Bạn là một đầu bếp chuyên nghiệp với nhiều năm kinh nghiệm. Hãy tạo ra 2-3 công thức nấu ăn dựa trên danh sách nguyên liệu được cung cấp.

Quy tắc:
- Sử dụng tối đa các nguyên liệu có sẵn trong danh sách
- Có thể thêm các nguyên liệu cơ bản khác như muối, tiêu, dầu ăn, nước
- Tạo các món ăn đa dạng (có thể là món chính, món phụ, món canh)
- Thời gian nấu phải thực tế và chính xác
- Hướng dẫn phải chi tiết, dễ hiểu
- Tên món ăn phải hấp dẫn và phù hợp với văn hóa Việt Nam

Format trả về:
- title: Tên món ăn (tiếng Việt)
- ingredients: Danh sách nguyên liệu với định lượng cụ thể
- instructions: Các bước thực hiện chi tiết
- time: Thời gian nấu (ví dụ: "30 phút", "1 giờ 15 phút")`,
        },
      ],
    };

    const model = "gemini-2.0-flash-lite";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Hãy tạo công thức nấu ăn từ các nguyên liệu sau: ${ingredients.join(
              ", "
            )}`,
          },
        ],
      },
    ];

    try {
      const response = await gemini.models.generateContent({
        model,
        config,
        contents,
      });

      const result = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (result) {
        const parsed = JSON.parse(result);

        // Convert to Recipe format and add required fields
        const recipes: Recipe[] = parsed.recipes.map(
          (recipe: any, index: number) => ({
            id: `gemini-${Date.now()}-${index}`, // Generate unique ID
            title: recipe.title,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            time: recipe.time,
            author: "Gemini",
            created_at: new Date().toISOString(),
            tags: ["AI-generated", "custom"],
          })
        );

        return recipes;
      }

      return [];
    } catch (error: any) {
      console.error("Recipe generation error:", error.message);
      throw new Error(`Failed to generate recipes: ${error.message}`);
    }
  }
}
