"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeAssistant = void 0;
const genai_1 = require("@google/genai");
const gemini_1 = require("../config/gemini");
const supabase_1 = __importDefault(require("../config/supabase"));
const sharp_1 = __importDefault(require("sharp"));
const transformers_1 = require("@huggingface/transformers");
class RecipeAssistant {
    initializeEmbedding() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!RecipeAssistant.embeddingPipeline) {
                RecipeAssistant.embeddingPipeline = yield (0, transformers_1.pipeline)("feature-extraction", "Snowflake/snowflake-arctic-embed-m-v2.0", {
                    dtype: "q8",
                    revision: "main",
                });
            }
        });
    }
    generateEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove the delay on first call
            if (!RecipeAssistant.embeddingPipeline) {
                yield this.initializeEmbedding();
            }
            const response = yield RecipeAssistant.embeddingPipeline(text, {
                normalize: true,
                pooling: "cls",
            });
            // Direct array conversion
            return Array.from(response.ort_tensor.data);
        });
    }
    // Build searchable text from recipe data
    buildSearchableText(recipe) {
        var _a, _b, _c;
        const parts = [
            "Title: " + recipe.title,
            "Author: " + recipe.author,
            "Tags: " + (((_a = recipe.tags) === null || _a === void 0 ? void 0 : _a.join(", ")) || ""),
            "Ingredients: " + (((_b = recipe.ingredients) === null || _b === void 0 ? void 0 : _b.join(", ")) || ""),
            "Instructions: " + (((_c = recipe.instructions) === null || _c === void 0 ? void 0 : _c.join(" ")) || ""),
            "Time: " + recipe.time,
        ].filter(Boolean);
        return parts.join(" ");
    }
    buildQuery(query) {
        var _a, _b, _c;
        const parts = [
            "Title: " + query.title,
            "Author: " + query.author,
            "Tags: " + (((_a = query.tags) === null || _a === void 0 ? void 0 : _a.join(", ")) || ""),
            "Ingredients: " + (((_b = query.ingredients) === null || _b === void 0 ? void 0 : _b.join(", ")) || ""),
            "Instructions: " + (((_c = query.instructions) === null || _c === void 0 ? void 0 : _c.join(" ")) || ""),
            "Time: " + query.time,
        ].filter(Boolean);
        return parts.join(" ");
    }
    // Generate embeddings for existing recipes and update database
    processRecipes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch all recipes without embeddings
                const { data: recipes, error } = yield supabase_1.default
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
                        let R = {
                            id: recipe.id,
                            title: recipe.title,
                            author: recipe.author,
                            tags: recipe.tags,
                            ingredients: recipe.ingredients,
                            instructions: recipe.instructions,
                            time: recipe.time,
                        }; // Generate embedding
                        const embedding = yield this.generateEmbedding(this.buildSearchableText(R));
                        // Log embedding info for debugging
                        console.log(`Embedding dimensions: ${embedding.length}`);
                        // Update recipe with embedding (store as vector directly)
                        const { error: updateError } = yield supabase_1.default
                            .from("recipes")
                            .update({ embedding: embedding })
                            .eq("id", recipe.id);
                        if (updateError) {
                            console.error(`Failed to update recipe ${recipe.id}:`, updateError.message);
                            console.error(updateError.message);
                            // Show preview of embedding instead of full vector
                            const preview = embedding.length > 5
                                ? `[${embedding.slice(0, 3).join(", ")}, ...${embedding.length - 3} more floats]`
                                : `[${embedding.join(", ")}]`;
                            console.error(`Embedding preview: ${preview}`);
                        }
                        else {
                            console.log(`Processed recipe ${i + 1}/${recipes.length}: ${recipe.title}`);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing recipe ${recipe.id}:`, error.message);
                    }
                }
                console.log("Finished processing recipes");
            }
            catch (error) {
                console.error("Error in processExistingRecipes:", error.message);
                throw error;
            }
        });
    }
    generateRecipeEmbedding(recipe) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const text = this.buildSearchableText(recipe);
                return yield this.generateEmbedding(text);
            }
            catch (error) {
                console.error(`Error generating embedding for recipe ${recipe.id}:`, error.message);
                throw error;
            }
        });
    }
    vectorSearchRecipes(userQuery_1) {
        return __awaiter(this, arguments, void 0, function* (userQuery, options = {}) {
            const startTime = Date.now();
            try {
                // 1. Generate embedding for user query
                const [queryEmbedding] = yield Promise.all([
                    this.generateEmbedding(this.buildQuery(userQuery)),
                    // Pre-warm any other resources if needed
                ]);
                // 2. Perform vector similarity search
                const [searchResults] = yield Promise.all([
                    supabase_1.default.rpc("vector_search", {
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
                const compatibleRecipes = searchResults.data.map((result) => ({
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
                }));
                // 4. Generate refined answer using Gemini
                const refinedAnswer = yield this.generateRefinedAnswer(userQuery, options, compatibleRecipes);
                // 5. Calculate metadata
                const avgSimilarity = compatibleRecipes.length > 0
                    ? compatibleRecipes.reduce((sum, r) => sum + r.similarity, 0) /
                        compatibleRecipes.length
                    : 0;
                // if refined asnwer can be parsed to recipe id's, remap compatibleRecipes with those ids, title, and image_url
                try {
                    const parsedAnswer = JSON.parse(refinedAnswer);
                    if (parsedAnswer.id && Array.isArray(parsedAnswer.id)) {
                        const filteredRecipes = compatibleRecipes.filter((recipe) => parsedAnswer.id.includes(recipe.id));
                        // Reorder recipes based on the order in refined answer
                        const orderedRecipes = parsedAnswer.id
                            .map((id) => filteredRecipes.find((recipe) => recipe.id === id))
                            .filter(Boolean);
                        if (orderedRecipes.length > 0) {
                            compatibleRecipes.length = 0; // Clear array
                            compatibleRecipes.push(...orderedRecipes);
                        }
                    }
                }
                catch (parseError) {
                    console.log("Could not parse refined answer as JSON, using original recipes");
                }
                return {
                    recipes: compatibleRecipes,
                    search_metadata: {
                        total_found: compatibleRecipes.length,
                        avg_similarity: Math.round(avgSimilarity * 1000) / 1000,
                        search_time_ms: searchTime,
                    },
                };
            }
            catch (error) {
                console.error("RAG search error:", error.message);
                throw error;
            }
        });
    }
    generateRefinedAnswer(userQuery, options, recipes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
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
                    type: genai_1.Type.OBJECT,
                    required: ["id"],
                    properties: {
                        id: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.STRING,
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
                const response = yield gemini_1.gemini.models.generateContent({
                    model,
                    config,
                    contents,
                });
                return (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
            }
            catch (error) {
                console.error("Gemini refinement error:", error.message);
                return "";
            }
        });
    }
    extractIngredientsFromImage(base64Image, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const optimizedImage = yield this.optimizeImageForProcessing(base64Image);
            const config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    required: ["ingredients", "suggested_dishes"],
                    properties: {
                        ingredients: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.STRING,
                            },
                        },
                        suggested_dishes: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.STRING,
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
                const response = yield gemini_1.gemini.models.generateContent({
                    model,
                    config,
                    contents,
                });
                const result = (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
                if (result) {
                    const parsed = JSON.parse(result);
                    return parsed || [];
                }
                return {
                    ingredients: [],
                    suggested_dishes: [],
                };
            }
            catch (error) {
                console.error("Ingredient extraction error:", error.message);
                throw new Error(`Failed to extract ingredients: ${error.message}`);
            }
        });
    }
    optimizeImageForProcessing(base64Image) {
        return __awaiter(this, void 0, void 0, function* () {
            const inputBuffer = Buffer.from(base64Image, "base64");
            let quality = 80;
            let width = 1920;
            let optimizedImage;
            do {
                optimizedImage = yield (0, sharp_1.default)(inputBuffer)
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
                    }
                    else {
                        width = Math.floor(width * 0.8);
                        quality = 80;
                    }
                }
            } while (optimizedImage.length > 2 * 1024 * 1024 &&
                (quality >= 30 || width >= 480));
            return optimizedImage.toString("base64");
        });
    }
    getSuggestedRecipes(ingredients) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    required: ["recipes"],
                    properties: {
                        recipes: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                required: ["title", "ingredients", "instructions", "time"],
                                properties: {
                                    title: {
                                        type: genai_1.Type.STRING,
                                    },
                                    ingredients: {
                                        type: genai_1.Type.ARRAY,
                                        items: {
                                            type: genai_1.Type.STRING,
                                        },
                                    },
                                    instructions: {
                                        type: genai_1.Type.ARRAY,
                                        items: {
                                            type: genai_1.Type.STRING,
                                        },
                                    },
                                    time: {
                                        type: genai_1.Type.STRING,
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
                            text: `Hãy tạo công thức nấu ăn từ các nguyên liệu sau: ${ingredients.join(", ")}`,
                        },
                    ],
                },
            ];
            try {
                const response = yield gemini_1.gemini.models.generateContent({
                    model,
                    config,
                    contents,
                });
                const result = (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
                if (result) {
                    const parsed = JSON.parse(result);
                    // Convert to Recipe format and add required fields
                    const recipes = parsed.recipes.map((recipe, index) => ({
                        id: `gemini-${Date.now()}-${index}`, // Generate unique ID
                        title: recipe.title,
                        ingredients: recipe.ingredients,
                        instructions: recipe.instructions,
                        time: recipe.time,
                        author: "Gemini",
                        created_at: new Date().toISOString(),
                        tags: ["AI-generated", "custom"],
                    }));
                    return recipes;
                }
                return [];
            }
            catch (error) {
                console.error("Recipe generation error:", error.message);
                throw new Error(`Failed to generate recipes: ${error.message}`);
            }
        });
    }
    getSearchQueryByPrompt(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const config = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    required: ["recipes"],
                    properties: {
                        recipes: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                required: ["title", "ingredients", "instructions", "time"],
                                properties: {
                                    title: {
                                        type: genai_1.Type.STRING,
                                    },
                                    ingredients: {
                                        type: genai_1.Type.ARRAY,
                                        items: {
                                            type: genai_1.Type.STRING,
                                        },
                                    },
                                    instructions: {
                                        type: genai_1.Type.ARRAY,
                                        items: {
                                            type: genai_1.Type.STRING,
                                        },
                                    },
                                    time: {
                                        type: genai_1.Type.STRING,
                                    },
                                },
                            },
                        },
                    },
                },
                systemInstruction: [
                    {
                        text: `Bạn là một đầu bếp chuyên nghiệp với nhiều năm kinh nghiệm. Hãy tạo ra câu truy xuất công thức nấu ăn dựa trên mô tả được cung cấp.
                Quy tắc:
                - Sử dụng tối đa các nguyên liệu có thể suy ra từ mô tả
                - Có thể thêm các nguyên liệu cơ bản khác như muối, tiêu, dầu ăn, nước
                - Tạo món ăn phù hợp với bữa ăn nếu có được thông tin từ prompt (có thể là món chính, món phụ, món canh)

                Format trả về:
                - title: Tên món ăn (tiếng Việt)
                - ingredients: Danh sách nguyên liệu không bao gồm định lượng
                - instructions: Các bước thực hiện chỉ bao gồm các từ khoá như chiên, hầm, nướng, hấp, ...
                - time: Thời gian nấu (ví dụ: "30 phút", "1 giờ 15 phút") nếu có, mặc định là "999 phút" nếu không xác định.`,
                    },
                ],
            };
            const model = "gemini-2.0-flash-lite";
            const contents = [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Hãy tạo câu truy xuất công thức nấu ăn từ mô tả sau: ${prompt}`,
                        },
                    ],
                },
            ];
            try {
                const response = yield gemini_1.gemini.models.generateContent({
                    model,
                    config,
                    contents,
                });
                const result = (_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
                if (result) {
                    const parsed = JSON.parse(result);
                    // Convert to Recipe format and add required fields
                    const query = {
                        title: ((_f = parsed.recipes[0]) === null || _f === void 0 ? void 0 : _f.title) || "",
                        ingredients: ((_g = parsed.recipes[0]) === null || _g === void 0 ? void 0 : _g.ingredients) || [],
                        instructions: ((_h = parsed.recipes[0]) === null || _h === void 0 ? void 0 : _h.instructions) || [],
                    };
                    return query;
                }
                return {
                    title: "",
                    ingredients: [],
                    instructions: [],
                };
            }
            catch (error) {
                console.error("Recipe generation error:", error.message);
                throw new Error(`Failed to generate recipes: ${error.message}`);
            }
        });
    }
}
exports.RecipeAssistant = RecipeAssistant;
RecipeAssistant.embeddingPipeline = null;
