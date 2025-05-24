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
exports.deleteRating = exports.getRecipeRating = exports.rateRecipe = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const crypto_1 = __importDefault(require("crypto"));
const notificationController_1 = require("./notificationController");
// Rate a recipe
const rateRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { recipeId, rating } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1) Validate input
        if (!recipeId || rating === undefined || rating === null) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: recipeId, rating'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to rate a recipe'
            });
            return;
        }
        // Convert rating to number if it's a string
        const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        // 2) Validate rating value
        if (typeof numericRating !== 'number' || isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
            res.status(400).json({
                status: 'fail',
                message: 'Rating must be a number between 0 and 5'
            });
            return;
        }
        // 3) Check if recipe exists
        const { data: recipeData, error: recipeError } = yield supabase_1.default
            .from('recipes')
            .select('id')
            .eq('id', recipeId)
            .single();
        if (recipeError || !recipeData) {
            res.status(404).json({
                status: 'fail',
                message: 'Recipe not found'
            });
            return;
        }
        // 4) Check if user already rated this recipe
        const { data: existingRating, error: existingRatingError } = yield supabase_1.default
            .from('ratings')
            .select('*')
            .eq('recipe_id', recipeId)
            .eq('user_id', userId)
            .single();
        let newRating;
        if (existingRating) {
            // 5a) Update existing rating
            const { data: updatedRating, error: updateError } = yield supabase_1.default
                .from('ratings')
                .update({
                rating: numericRating,
                updated_at: new Date().toISOString()
            })
                .eq('id', existingRating.id)
                .select()
                .single();
            if (updateError) {
                console.error('Error updating rating:', updateError);
                res.status(500).json({
                    status: 'error',
                    message: 'Error updating rating'
                });
                return;
            }
            newRating = updatedRating;
        }
        else {
            // 5b) Create new rating
            const ratingObj = {
                id: crypto_1.default.randomUUID(),
                recipe_id: recipeId,
                user_id: userId,
                rating: numericRating,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: insertedRating, error: insertError } = yield supabase_1.default
                .from('ratings')
                .insert([ratingObj])
                .select()
                .single();
            if (insertError) {
                console.error('Error adding rating:', insertError);
                res.status(500).json({
                    status: 'error',
                    message: 'Error adding rating'
                });
                return;
            }
            newRating = insertedRating;
        }
        // 6) Calculate the new average rating
        const { data: allRatings, error: ratingsError } = yield supabase_1.default
            .from('ratings')
            .select('rating')
            .eq('recipe_id', recipeId);
        if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError);
            res.status(500).json({
                status: 'error',
                message: 'Error calculating average rating'
            });
            return;
        }
        const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = allRatings.length > 0 ? totalRating / allRatings.length : 0;
        // 6a) Get recipe details to create notification
        const { data: recipe, error: recipeDetailError } = yield supabase_1.default
            .from('recipes')
            .select('title, author')
            .eq('id', recipeId)
            .single();
        if (!recipeDetailError && recipe && recipe.author && recipe.author !== userId) {
            // Get user name for notification content
            const { data: userData } = yield supabase_1.default
                .from('users')
                .select('name')
                .eq('id', userId)
                .single();
            const userName = (userData === null || userData === void 0 ? void 0 : userData.name) || 'Someone';
            const ratingText = existingRating ? 'updated their rating on' : 'rated';
            // Create notification for recipe author
            yield (0, notificationController_1.createNotification)(recipe.author, userId, 'RATING', `${userName} ${ratingText} your recipe "${recipe.title}" with ${numericRating} stars`, recipeId, 'RECIPE');
        }
        // 7) Return the rating and average
        res.status(200).json({
            status: 'success',
            data: {
                rating: newRating,
                averageRating: averageRating,
                totalRatings: allRatings.length
            }
        });
    }
    catch (err) {
        console.error('Error rating recipe:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while rating the recipe'
        });
    }
});
exports.rateRecipe = rateRecipe;
// Get the average rating for a recipe
const getRecipeRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { recipeId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1) Validate input
        if (!recipeId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a recipe ID'
            });
            return;
        }
        // 2) Get all ratings for this recipe
        const { data: ratings, error: ratingsError } = yield supabase_1.default
            .from('ratings')
            .select('*')
            .eq('recipe_id', recipeId);
        if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching ratings'
            });
            return;
        }
        // 3) Calculate average rating
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
        // 4) Get user's rating if they're logged in
        let userRating = null;
        if (userId) {
            userRating = ratings.find(rating => rating.user_id === userId) || null;
        }
        // 5) Return the ratings data
        res.status(200).json({
            status: 'success',
            data: {
                averageRating,
                totalRatings: ratings.length,
                userRating: userRating
            }
        });
    }
    catch (err) {
        console.error('Error fetching recipe rating:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching the recipe rating'
        });
    }
});
exports.getRecipeRating = getRecipeRating;
// Delete a rating
const deleteRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { recipeId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1) Validate input
        if (!recipeId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a recipe ID'
            });
            return;
        }
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to delete a rating'
            });
            return;
        }
        // 2) Check if user has rated this recipe
        const { data: existingRating, error: existingRatingError } = yield supabase_1.default
            .from('ratings')
            .select('id')
            .eq('recipe_id', recipeId)
            .eq('user_id', userId)
            .single();
        if (existingRatingError || !existingRating) {
            res.status(404).json({
                status: 'fail',
                message: 'You have not rated this recipe'
            });
            return;
        }
        // 3) Delete the rating
        const { error: deleteError } = yield supabase_1.default
            .from('ratings')
            .delete()
            .eq('id', existingRating.id);
        if (deleteError) {
            console.error('Error deleting rating:', deleteError);
            res.status(500).json({
                status: 'error',
                message: 'Error deleting rating'
            });
            return;
        }
        // 4) Recalculate average rating
        const { data: remainingRatings, error: ratingsError } = yield supabase_1.default
            .from('ratings')
            .select('rating')
            .eq('recipe_id', recipeId);
        if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError);
            // Continue anyway, we already deleted the rating
        }
        const totalRating = (remainingRatings || []).reduce((sum, r) => sum + r.rating, 0);
        const averageRating = remainingRatings && remainingRatings.length > 0
            ? totalRating / remainingRatings.length
            : 0;
        // 5) Return success
        res.status(200).json({
            status: 'success',
            data: {
                averageRating,
                totalRatings: remainingRatings ? remainingRatings.length : 0
            },
            message: 'Rating deleted successfully'
        });
    }
    catch (err) {
        console.error('Error deleting rating:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the rating'
        });
    }
});
exports.deleteRating = deleteRating;
