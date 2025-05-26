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
exports.RecipeVectorDB = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const transformers_1 = require("@huggingface/transformers");
class RecipeVectorDB {
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
                    yield new Promise(resolve => setTimeout(resolve, delay));
                    const extractor = yield (0, transformers_1.pipeline)('feature-extraction', 'Snowflake/snowflake-arctic-embed-m-v2.0', {
                        dtype: 'q8',
                        revision: 'main',
                    });
                    const response = yield extractor(text, { normalize: true, pooling: 'cls' });
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
                    throw new Error('No embedding values returned');
                }
                catch (error) {
                    if (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("429")) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("RESOURCE_EXHAUSTED"))) {
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
            throw new Error('Failed to generate embedding');
        });
    }
    // Build searchable text from recipe data
    buildSearchableText(recipe) {
        var _a, _b, _c;
        const parts = [
            recipe.title,
            recipe.author,
            ((_a = recipe.tags) === null || _a === void 0 ? void 0 : _a.join(', ')) || '',
            ((_b = recipe.ingredients) === null || _b === void 0 ? void 0 : _b.join(', ')) || '',
            ((_c = recipe.instructions) === null || _c === void 0 ? void 0 : _c.join(' ')) || '',
            recipe.time,
        ].filter(Boolean);
        return parts.join(' ');
    }
    // Generate embeddings for existing recipes and update database
    processRecipes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch all recipes without embeddings
                const { data: recipes, error } = yield supabase_1.default
                    .from('recipes')
                    .select('*')
                    .is('embedding', null);
                if (error) {
                    throw new Error(`Failed to fetch recipes: ${error.message}`);
                }
                if (!recipes || recipes.length === 0) {
                    console.log('No recipes found without embeddings');
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
                            time: recipe.time
                        }; // Generate embedding
                        const embedding = yield this.generateEmbedding(this.buildSearchableText(R));
                        // Log embedding info for debugging
                        console.log(`Embedding dimensions: ${embedding.length}`);
                        // Update recipe with embedding (store as vector directly)
                        const { error: updateError } = yield supabase_1.default
                            .from('recipes')
                            .update({ embedding: embedding })
                            .eq('id', recipe.id);
                        if (updateError) {
                            console.error(`Failed to update recipe ${recipe.id}:`, updateError.message);
                            console.error(updateError.message);
                            // Show preview of embedding instead of full vector
                            const preview = embedding.length > 5
                                ? `[${embedding.slice(0, 3).join(', ')}, ...${embedding.length - 3} more floats]`
                                : `[${embedding.join(', ')}]`;
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
                console.log('Finished processing recipes');
            }
            catch (error) {
                console.error('Error in processExistingRecipes:', error.message);
                throw error;
            }
        });
    }
}
exports.RecipeVectorDB = RecipeVectorDB;
