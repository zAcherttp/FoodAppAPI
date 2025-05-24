import supabase from '../config/supabase';
import { Recipe } from '../types';

/**
 * This script normalizes existing recipes by removing the comments and ratings
 * arrays after they have been migrated to their dedicated tables.
 * Run this AFTER running the migrateCommentsAndRatings.ts script.
 */
async function normalizeExistingRecipes() {
  console.log('Starting normalization of existing recipes...');

  // 1. Get all recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, comments, rating');

  if (recipesError) {
    console.error('Error fetching recipes:', recipesError);
    return;
  }

  console.log(`Found ${recipes.length} recipes to normalize`);

  let normalizedCount = 0;

  // 2. Process each recipe
  for (const recipe of recipes) {
    // Skip if recipe doesn't have comments or ratings
    if ((!recipe.comments || recipe.comments.length === 0) && 
        (!recipe.rating || recipe.rating.length === 0)) {
      continue;
    }

    // 3. Update recipe by removing comments and rating arrays
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        comments: null, // Remove comments array
        rating: null,   // Remove rating array
        updated_at: new Date().toISOString()
      })
      .eq('id', recipe.id);

    if (updateError) {
      console.error(`Error normalizing recipe ${recipe.id}:`, updateError);
    } else {
      normalizedCount++;
    }
  }

  console.log(`Normalization completed: ${normalizedCount} recipes normalized`);
}

// Run the normalization function
normalizeExistingRecipes()
  .then(() => {
    console.log('Normalization script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running normalization:', error);
    process.exit(1);
  });