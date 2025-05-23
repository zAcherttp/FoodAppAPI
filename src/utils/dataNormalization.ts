// src/utils/dataNormalization.ts
import { Recipe, Comment, Rating, CommentInteraction } from '../types';

/**
 * Normalizes recipe data for consistent storage and retrieval
 */
export const normalizeRecipe = (recipe: Recipe): Recipe => {
  return {
    ...recipe,
    title: normalizeTitle(recipe.title),
    ingredients: normalizeIngredients(recipe.ingredients),
    instructions: normalizeInstructions(recipe.instructions),
    tags: normalizeTags(recipe.tags ?? []),
  };
};

/**
 * Converts old recipe format to new format without embedded comments and ratings
 */
export const convertToNewRecipeFormat = (oldRecipe: any): Recipe => {
  // Create a new recipe object without comments and ratings arrays
  const newRecipe: Recipe = {
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

/**
 * Extract comments from old recipe format into separate Comment objects
 */
export const extractCommentsFromRecipe = (recipe: any): Comment[] => {
  if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
    return [];
  }
  
  return recipe.comments.map((comment: any) => ({
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

/**
 * Extract ratings from old recipe format into separate Rating objects
 */
export const extractRatingsFromRecipe = (recipe: any): Rating[] => {
  if (!recipe.rating || !Array.isArray(recipe.rating) || recipe.rating.length === 0) {
    return [];
  }
  
  return recipe.rating.map((rating: any) => ({
    id: rating.id,
    recipe_id: recipe.id,
    user_id: rating.user_id,
    rating: rating.rating,
    created_at: rating.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

/**
 * Extract comment interactions (likes/dislikes) from old recipe format
 */
export const extractCommentInteractions = (recipe: any): CommentInteraction[] => {
  if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
    return [];
  }
  
  const interactions: CommentInteraction[] = [];
  
  recipe.comments.forEach((comment: any) => {
    // Extract likes
    if (comment.likedBy && Array.isArray(comment.likedBy)) {
      comment.likedBy.forEach((userId: string) => {
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
      comment.dislikedBy.forEach((userId: string) => {
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

/**
 * Normalizes recipe title
 */
const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '');
};

/**
 * Normalizes ingredients list
 */
const normalizeIngredients = (ingredients: string[]): string[] => {
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
const normalizeInstructions = (instructions: string[]): string[] => {
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

const normalizeTags = (tags: string[]): string[] => {
  return tags.map(cat => {
    // Standardize category names
    return cat.toLowerCase().trim();
  });
};