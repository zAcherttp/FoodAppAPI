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
const transformers_1 = require("@huggingface/transformers");
class RecipeAssistant {
    constructor() {
        this.retryDelay = 2000;
        this.maxRetries = 5;
    }
    // Generate embedding with retry logic
    generateEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let retries = 0;
            let delay = this.retryDelay;
            while (retries <= this.maxRetries) {
                try {
                    yield new Promise((resolve) => setTimeout(resolve, delay));
                    const extractor = yield (0, transformers_1.pipeline)("feature-extraction", "Snowflake/snowflake-arctic-embed-m-v2.0", {
                        dtype: "q8",
                        revision: "main",
                    });
                    const response = yield extractor(text, {
                        normalize: true,
                        pooling: "cls",
                    });
                    if (response.ort_tensor.data && response.ort_tensor.data.length > 0) {
                        // Convert object to array if needed
                        const tensorData = response.ort_tensor.data;
                        if (Array.isArray(tensorData)) {
                            return tensorData;
                        }
                        else {
                            // Convert object with numeric keys to array
                            return Object.values(tensorData);
                        }
                    }
                    throw new Error("No embedding values returned");
                }
                catch (error) {
                    if (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("429")) ||
                        ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("RESOURCE_EXHAUSTED"))) {
                        retries++;
                        if (retries > this.maxRetries) {
                            throw new Error(`Failed to generate embedding after ${this.maxRetries} retries`);
                        }
                        delay = delay * 2 + Math.floor(Math.random() * 1000);
                        console.log(`Rate limit hit. Retrying in ${delay / 1000}s... (${retries}/${this.maxRetries})`);
                    }
                    else {
                        throw error;
                    }
                }
            }
            throw new Error("Failed to generate embedding");
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
                const queryEmbedding = yield this.generateEmbedding(this.buildQuery(userQuery));
                // 2. Perform vector similarity search
                const { data: searchResults, error } = yield supabase_1.default.rpc("vector_search", {
                    query_embedding: queryEmbedding,
                    similarity_threshold: options.similarity_threshold || 0.5,
                    match_limit: options.match_limit || 10,
                });
                if (error) {
                    throw new Error(`Search failed: ${error.message}`);
                }
                console.log("found " + searchResults.length + " results");
                const searchTime = Date.now() - startTime;
                // 3. Format recipes and filter out non-dietary-compatible ones
                const compatibleRecipes = searchResults.map((result) => ({
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
}
exports.RecipeAssistant = RecipeAssistant;
