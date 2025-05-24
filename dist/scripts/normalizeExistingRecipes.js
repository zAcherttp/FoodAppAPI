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
/**
 * This script normalizes existing recipes by removing the comments and ratings
 * arrays after they have been migrated to their dedicated tables.
 * Run this AFTER running the migrateCommentsAndRatings.ts script.
 */
function normalizeExistingRecipes() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting normalization of existing recipes...');
        // 1. Get all recipes
        const { data: recipes, error: recipesError } = yield supabase_1.default
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
            const { error: updateError } = yield supabase_1.default
                .from('recipes')
                .update({
                comments: null, // Remove comments array
                rating: null, // Remove rating array
                updated_at: new Date().toISOString()
            })
                .eq('id', recipe.id);
            if (updateError) {
                console.error(`Error normalizing recipe ${recipe.id}:`, updateError);
            }
            else {
                normalizedCount++;
            }
        }
        console.log(`Normalization completed: ${normalizedCount} recipes normalized`);
    });
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
