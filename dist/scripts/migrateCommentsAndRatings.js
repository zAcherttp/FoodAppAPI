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
const supabase_1 = __importDefault(require("../config/supabase"));
const dataNormalization_1 = require("../utils/dataNormalization");
/**
 * This script migrates comments and ratings from the recipes table
 * to the new dedicated tables
 */
function migrateCommentsAndRatings() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting migration of comments and ratings...');
        // 1. Get all recipes with comments and ratings
        const { data: recipes, error: recipesError } = yield supabase_1.default
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
            const comments = (0, dataNormalization_1.extractCommentsFromRecipe)(recipe);
            if (comments.length > 0) {
                const { error: commentsError } = yield supabase_1.default
                    .from('comments')
                    .insert(comments);
                if (commentsError) {
                    console.error(`Error migrating comments for recipe ${recipe.id}:`, commentsError);
                }
                else {
                    commentsMigrated += comments.length;
                }
                // Extract and migrate comment interactions
                const interactions = (0, dataNormalization_1.extractCommentInteractions)(recipe);
                if (interactions.length > 0) {
                    const { error: interactionsError } = yield supabase_1.default
                        .from('comment_interactions')
                        .insert(interactions);
                    if (interactionsError) {
                        console.error(`Error migrating comment interactions for recipe ${recipe.id}:`, interactionsError);
                    }
                    else {
                        commentInteractionsMigrated += interactions.length;
                    }
                }
            }
            // Extract and migrate ratings
            const ratings = (0, dataNormalization_1.extractRatingsFromRecipe)(recipe);
            if (ratings.length > 0) {
                const { error: ratingsError } = yield supabase_1.default
                    .from('ratings')
                    .insert(ratings);
                if (ratingsError) {
                    console.error(`Error migrating ratings for recipe ${recipe.id}:`, ratingsError);
                }
                else {
                    ratingsMigrated += ratings.length;
                }
            }
        }
        console.log('Migration completed:');
        console.log(`- Comments migrated: ${commentsMigrated}`);
        console.log(`- Comment interactions migrated: ${commentInteractionsMigrated}`);
        console.log(`- Ratings migrated: ${ratingsMigrated}`);
    });
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
