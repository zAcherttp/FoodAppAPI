"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCommentInteractions = exports.extractRatingsFromRecipe = exports.extractCommentsFromRecipe = exports.convertToNewRecipeFormat = exports.normalizeRecipe = void 0;
/**
 * Normalizes recipe data for consistent storage and retrieval
 */
const normalizeRecipe = (recipe) => {
    var _a;
    return Object.assign(Object.assign({}, recipe), { title: normalizeTitle(recipe.title), ingredients: normalizeIngredients(recipe.ingredients), instructions: normalizeInstructions(recipe.instructions), tags: normalizeTags((_a = recipe.tags) !== null && _a !== void 0 ? _a : []) });
};
exports.normalizeRecipe = normalizeRecipe;
/**
 * Converts old recipe format to new format without embedded comments and ratings
 */
const convertToNewRecipeFormat = (oldRecipe) => {
    // Create a new recipe object without comments and ratings arrays
    const newRecipe = {
        id: oldRecipe.id,
        title: oldRecipe.title,
        ingredients: oldRecipe.ingredients,
        instructions: oldRecipe.instructions,
        image_url: oldRecipe.image_url,
        author: oldRecipe.author,
        created_at: oldRecipe.created_at,
        updated_at: new Date().toISOString(),
        tags: oldRecipe.tags,
        time: oldRecipe.time,
    };
    return newRecipe;
};
exports.convertToNewRecipeFormat = convertToNewRecipeFormat;
/**
 * Extract comments from old recipe format into separate Comment objects
 */
const extractCommentsFromRecipe = (recipe) => {
    if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
        return [];
    }
    return recipe.comments.map((comment) => ({
        id: comment.id,
        recipe_id: recipe.id,
        user_id: comment.author_id || recipe.author, // Fallback to recipe author if no author_id
        content: comment.content,
        created_at: comment.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0
    }));
};
exports.extractCommentsFromRecipe = extractCommentsFromRecipe;
/**
 * Extract ratings from old recipe format into separate Rating objects
 */
const extractRatingsFromRecipe = (recipe) => {
    if (!recipe.rating || !Array.isArray(recipe.rating) || recipe.rating.length === 0) {
        return [];
    }
    return recipe.rating.map((rating) => ({
        id: rating.id,
        recipe_id: recipe.id,
        user_id: rating.user_id,
        rating: rating.rating,
        created_at: rating.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));
};
exports.extractRatingsFromRecipe = extractRatingsFromRecipe;
/**
 * Extract comment interactions (likes/dislikes) from old recipe format
 */
const extractCommentInteractions = (recipe) => {
    if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
        return [];
    }
    const interactions = [];
    recipe.comments.forEach((comment) => {
        // Extract likes
        if (comment.likedBy && Array.isArray(comment.likedBy)) {
            comment.likedBy.forEach((userId) => {
                interactions.push({
                    id: crypto.randomUUID(),
                    comment_id: comment.id,
                    user_id: userId,
                    interaction_type: 'like',
                    created_at: new Date().toISOString()
                });
            });
        }
        // Extract dislikes
        if (comment.dislikedBy && Array.isArray(comment.dislikedBy)) {
            comment.dislikedBy.forEach((userId) => {
                interactions.push({
                    id: crypto.randomUUID(),
                    comment_id: comment.id,
                    user_id: userId,
                    interaction_type: 'dislike',
                    created_at: new Date().toISOString()
                });
            });
        }
    });
    return interactions;
};
exports.extractCommentInteractions = extractCommentInteractions;
/**
 * Normalizes recipe title
 */
const normalizeTitle = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '');
};
/**
 * Normalizes ingredients list
 */
const normalizeIngredients = (ingredients) => {
    // Implement normalization logic
    return ingredients.map(ing => {
        // Parse ingredient into quantity, unit, name
        // Standardize units
        // Return normalized format
        return ing.toLowerCase().trim();
    });
};
/**
 * Normalizes instructions
 */
const normalizeInstructions = (instructions) => {
    // Implement normalization logic
    return instructions.map(inst => {
        // Parse instruction into steps
        // Standardize format
        // Return normalized format
        return inst.toLowerCase().trim();
    });
};
/**
 * Normalizes categories/tags
 */
const normalizeTags = (tags) => {
    return tags.map(cat => {
        // Standardize category names
        return cat.toLowerCase().trim();
    });
};
