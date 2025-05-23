// Helper function for recipe controller to get comment count and average rating
import supabase from '../config/supabase';
import { Recipe } from '../types';

interface RecipeEnrichmentData {
  comments_count: number;
  average_rating: number | null;
  ratings_count: number;
}

/**
 * Enriches recipes with data from comments and ratings tables
 * @param recipes Array of recipes to enrich
 * @returns Enriched recipes with comments_count and average_rating
 */
export const enrichRecipesWithMetadata = async (recipes: Recipe[]): Promise<Recipe[]> => {
  if (!recipes || recipes.length === 0) {
    return recipes;
  }

  const recipeIds = recipes.map(recipe => recipe.id);
  
  // Get comment counts for all recipes in one query
  const { data: commentCounts, error: commentError } = await supabase
    .from('comments')
    .select('recipe_id', { count: 'exact', head: false })
    .in('recipe_id', recipeIds);

  // Get average ratings for all recipes in one query
  const { data: ratingData, error: ratingError } = await supabase
    .from('ratings')
    .select('recipe_id, rating')
    .in('recipe_id', recipeIds);

  // Process the ratings to get averages by recipe
  const ratingsByRecipe: Record<string, number[]> = {};
  
  if (!ratingError && ratingData) {
    ratingData.forEach(item => {
      if (!ratingsByRecipe[item.recipe_id]) {
        ratingsByRecipe[item.recipe_id] = [];
      }
      ratingsByRecipe[item.recipe_id].push(item.rating);
    });
  }

  // Create a map for quick lookups
  const metadataByRecipeId: Record<string, RecipeEnrichmentData> = {};
  
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
    const counts: Record<string, number> = {};
    commentCounts.forEach(item => {
      if (!counts[item.recipe_id]) counts[item.recipe_id] = 0;
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
  return recipes.map(recipe => ({
    ...recipe,
    comments_count: metadataByRecipeId[recipe.id]?.comments_count || 0,
    average_rating: typeof metadataByRecipeId[recipe.id]?.average_rating === 'number'
      ? metadataByRecipeId[recipe.id]?.average_rating
      : undefined,
    ratings_count: metadataByRecipeId[recipe.id]?.ratings_count || 0
  })).map(recipe => ({
    ...recipe,
    average_rating: recipe.average_rating === null ? undefined : recipe.average_rating
  }));
};

/**
 * Enriches a single recipe with data from comments and ratings tables
 * @param recipe Recipe to enrich
 * @returns Enriched recipe with comments_count and average_rating
 */
export const enrichRecipeWithMetadata = async (recipe: Recipe): Promise<Recipe> => {
  const enriched = await enrichRecipesWithMetadata([recipe]);
  return enriched[0];
};
