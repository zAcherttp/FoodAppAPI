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
exports.enrichRecipeWithMetadata = exports.enrichRecipesWithMetadata = void 0;
// Helper function for recipe controller to get comment count and average rating
const supabase_1 = __importDefault(require("../config/supabase"));
/**
 * Enriches recipes with data from comments and ratings tables
 * @param recipes Array of recipes to enrich
 * @returns Enriched recipes with comments_count and average_rating
 */
const enrichRecipesWithMetadata = (recipes) => __awaiter(void 0, void 0, void 0, function* () {
    if (!recipes || recipes.length === 0) {
        return recipes;
    }
    const recipeIds = recipes.map(recipe => recipe.id);
    // Get comment counts for all recipes in one query
    const { data: commentCounts, error: commentError } = yield supabase_1.default
        .from('comments')
        .select('recipe_id', { count: 'exact', head: false })
        .in('recipe_id', recipeIds);
    // Get average ratings for all recipes in one query
    const { data: ratingData, error: ratingError } = yield supabase_1.default
        .from('ratings')
        .select('recipe_id, rating')
        .in('recipe_id', recipeIds);
    // Process the ratings to get averages by recipe
    const ratingsByRecipe = {};
    if (!ratingError && ratingData) {
        ratingData.forEach(item => {
            if (!ratingsByRecipe[item.recipe_id]) {
                ratingsByRecipe[item.recipe_id] = [];
            }
            ratingsByRecipe[item.recipe_id].push(item.rating);
        });
    }
    // Create a map for quick lookups
    const metadataByRecipeId = {};
    // Initialize with zeros
    recipeIds.forEach(id => {
        metadataByRecipeId[id] = {
            comments_count: 0,
            average_rating: null,
            ratings_count: 0
        };
    });
    // Add comment counts
    if (!commentError && commentCounts) {
        // Count comments per recipe_id
        const counts = {};
        commentCounts.forEach(item => {
            if (!counts[item.recipe_id])
                counts[item.recipe_id] = 0;
            counts[item.recipe_id] += 1;
        });
        Object.entries(counts).forEach(([recipeId, count]) => {
            metadataByRecipeId[recipeId].comments_count = count;
        });
    }
    // Calculate average ratings
    Object.entries(ratingsByRecipe).forEach(([recipeId, ratings]) => {
        if (ratings.length > 0) {
            const sum = ratings.reduce((acc, rating) => acc + rating, 0);
            metadataByRecipeId[recipeId].average_rating = sum / ratings.length;
            metadataByRecipeId[recipeId].ratings_count = ratings.length;
        }
    });
    // Enrich recipes with the metadata
    return recipes.map(recipe => {
        var _a, _b, _c, _d;
        return (Object.assign(Object.assign({}, recipe), { comments_count: ((_a = metadataByRecipeId[recipe.id]) === null || _a === void 0 ? void 0 : _a.comments_count) || 0, average_rating: typeof ((_b = metadataByRecipeId[recipe.id]) === null || _b === void 0 ? void 0 : _b.average_rating) === 'number'
                ? (_c = metadataByRecipeId[recipe.id]) === null || _c === void 0 ? void 0 : _c.average_rating
                : undefined, ratings_count: ((_d = metadataByRecipeId[recipe.id]) === null || _d === void 0 ? void 0 : _d.ratings_count) || 0 }));
    }).map(recipe => (Object.assign(Object.assign({}, recipe), { average_rating: recipe.average_rating === null ? undefined : recipe.average_rating })));
});
exports.enrichRecipesWithMetadata = enrichRecipesWithMetadata;
/**
 * Enriches a single recipe with data from comments and ratings tables
 * @param recipe Recipe to enrich
 * @returns Enriched recipe with comments_count and average_rating
 */
const enrichRecipeWithMetadata = (recipe) => __awaiter(void 0, void 0, void 0, function* () {
    const enriched = yield (0, exports.enrichRecipesWithMetadata)([recipe]);
    return enriched[0];
});
exports.enrichRecipeWithMetadata = enrichRecipeWithMetadata;
