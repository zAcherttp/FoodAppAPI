import supabase from '../config/supabase';
import crypto from 'crypto';
import { 
  extractCommentsFromRecipe, 
  extractRatingsFromRecipe, 
  extractCommentInteractions 
} from '../utils/dataNormalization';

/**
 * This script migrates comments and ratings from the recipes table
 * to the new dedicated tables
 */
async function migrateCommentsAndRatings() {
  console.log('Starting migration of comments and ratings...');

  // 1. Get all recipes with comments and ratings
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, comments, rating, author');

  if (recipesError) {
    console.error('Error fetching recipes:', recipesError);
    return;
  }

  console.log(`Found ${recipes.length} recipes to process`);

  // Migration statistics
  let commentsMigrated = 0;
  let ratingsMigrated = 0;
  let commentInteractionsMigrated = 0;

  // 2. Process each recipe
  for (const recipe of recipes) {
    // Extract and migrate comments
    const comments = extractCommentsFromRecipe(recipe);
    
    if (comments.length > 0) {
      const { error: commentsError } = await supabase
        .from('comments')
        .insert(comments);
        
      if (commentsError) {
        console.error(`Error migrating comments for recipe ${recipe.id}:`, commentsError);
      } else {
        commentsMigrated += comments.length;
      }
      
      // Extract and migrate comment interactions
      const interactions = extractCommentInteractions(recipe);
      
      if (interactions.length > 0) {
        const { error: interactionsError } = await supabase
          .from('comment_interactions')
          .insert(interactions);
          
        if (interactionsError) {
          console.error(`Error migrating comment interactions for recipe ${recipe.id}:`, interactionsError);
        } else {
          commentInteractionsMigrated += interactions.length;
        }
      }
    }
    
    // Extract and migrate ratings
    const ratings = extractRatingsFromRecipe(recipe);
    
    if (ratings.length > 0) {
      const { error: ratingsError } = await supabase
        .from('ratings')
        .insert(ratings);
        
      if (ratingsError) {
        console.error(`Error migrating ratings for recipe ${recipe.id}:`, ratingsError);
      } else {
        ratingsMigrated += ratings.length;
      }
    }
  }

  console.log('Migration completed:');
  console.log(`- Comments migrated: ${commentsMigrated}`);
  console.log(`- Comment interactions migrated: ${commentInteractionsMigrated}`);
  console.log(`- Ratings migrated: ${ratingsMigrated}`);
}

// Run the migration function
migrateCommentsAndRatings()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running migration:', error);
    process.exit(1);
  });
