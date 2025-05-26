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
exports.getAllRecipes = exports.deleteRecipe = exports.addRecipe = exports.uploadRecipeImage = exports.dislikeComment = exports.likeComment = exports.getRatingRecipe = exports.ratingRecipe = exports.getCommentsRecipe = exports.commentRecipe = exports.updateRecipe = exports.getRandomRecipes = exports.getLatestRecipes = exports.getRecipesByAuthor = exports.getRecipeById = exports.getRecipesByTitle = void 0;
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = __importDefault(require("../config/supabase"));
const path_1 = __importDefault(require("path"));
// Add a new recipe
// export const addRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
//     try {
//         const { title, ingredients, instructions, image_url, tags, time } = req.body;
//         // 1) Validate input
//         if (!title || !ingredients || !instructions) {
//         res.status(400).json({
//             status: 'fail',
//             message: 'Please provide all required fields: title, ingredients, instructions'
//         });
//         return;
//         }
//         // 2) Create a new recipe object
//         const newRecipe: Recipe = {
//         id: crypto.randomUUID(),
//         title,
//         ingredients,
//         instructions,
//         image_url,
//         author: req.user?.name, 
//         tags,
//         time,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//         };
//         // 3) Insert the recipe into Supabase
//         const { data, error } = await supabase
//         .from('recipes')
//         .insert([newRecipe])
//         .select();
//         // 4) Check for errors
//         if (error || !data || data.length === 0) {
//             console.error('Error adding recipe:', error);
//             res.status(500).json({
//                 status: 'error',
//                 message: 'Error adding recipe'
//             });
//             return;
//         }
//         // 5) Return the added recipe
//         res.status(201).json({
//         status: 'success',
//         data: {
//             recipe: data[0]
//         }
//         });
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).json({
//         status: 'error',
//         message: 'Something went wrong'
//         });
//     }
// }
// Get recipes with title
const getRecipesByTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.query;
        // 1) Validate title
        if (!title || typeof title !== 'string') {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid title to search for'
            });
            return;
        }
        // 2) Fetch recipes from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .ilike('title', `%${title}%`); // 3) Check for errors
        if (error || !data) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipes'
            });
            return;
        }
        // 4) Check if recipes were found
        if (data.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipes found with that title'
            });
            return;
        }
        // 5) Return the recipes
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                recipes: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getRecipesByTitle = getRecipesByTitle;
// Get recipe by id
const getRecipeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        // 1) Validate id
        if (!id || typeof id !== 'string') {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid recipe ID'
            });
            return;
        }
        // 2) Fetch recipe from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single(); // 3) Check for errors
        if (error || !data) {
            console.error('Error fetching recipe:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Check if recipe was found
        if (!data) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipe found with that ID'
            });
            return;
        }
        // 5) Return the recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getRecipeById = getRecipeById;
// Get recipes by author
const getRecipesByAuthor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { author } = req.query;
        // 1) Validate author
        if (!author || typeof author !== 'string') {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid author name'
            });
            return;
        }
        // 2) Fetch recipes from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('author', author); // 3) Check for errors
        if (error || !data) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipes'
            });
            return;
        }
        // 4) Check if recipes were found
        if (data.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipes found by that author'
            });
            return;
        }
        // 5) Return the recipes
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                recipes: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getRecipesByAuthor = getRecipesByAuthor;
// Get 10 recipes latest
const getLatestRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Fetch latest 10 recipes from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10); // 2) Check for errors
        if (error || !data) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipes'
            });
            return;
        }
        // 3) Check if recipes were found
        if (data.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipes found'
            });
            return;
        }
        // 4) Return the recipes
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                recipes: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getLatestRecipes = getLatestRecipes;
// Get 10 random recipe
const getRandomRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Fetch 10 random recipes from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);
        // 2) Check for errors
        if (error || !data) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipes'
            });
            return;
        }
        // 3) Check if recipes were found
        if (data.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipes found'
            });
            return;
        }
        // 4) Return the recipes
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                recipes: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getRandomRecipes = getRandomRecipes;
// Update a recipe
const updateRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, title, ingredients, instructions, image_url } = req.body;
        // 1) Validate input
        if (!id || !title || !ingredients || !instructions) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: id, title, ingredients, instructions'
            });
            return;
        }
        // 2) Fetch the existing recipe from Supabase
        const { data: existingRecipe, error: fetchError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
        // 3) Check for errors
        if (fetchError || !existingRecipe) {
            console.error('Error fetching recipe:', fetchError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Update the recipe object
        const updatedRecipe = Object.assign(Object.assign({}, existingRecipe), { title,
            ingredients,
            instructions,
            image_url, updated_at: new Date().toISOString() });
        // 5) Update the recipe in Supabase
        const { data, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update(updatedRecipe)
            .eq('id', id)
            .select();
        // 6) Check for errors
        if (updateError || !data || data.length === 0) {
            console.error('Error updating recipe:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe'
            });
            return;
        }
        // 7) Return the updated recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.updateRecipe = updateRecipe;
// Comment on a recipe (comment is a part of the recipe)
const commentRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, comment } = req.body;
        // 1) Validate input
        if (!id || !comment) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: id, comment'
            });
            return;
        }
        // 2) Fetch the existing recipe from Supabase
        const { data: existingRecipe, error: fetchError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
        // 3) Check for errors
        if (fetchError || !existingRecipe) {
            console.error('Error fetching recipe:', fetchError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        } // 4) Update the recipe object with the new comment
        const newComment = {
            id: crypto_1.default.randomUUID(),
            content: comment,
            author_id: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'Anonymous',
            created_at: new Date().toISOString()
        };
        const updatedRecipe = Object.assign(Object.assign({}, existingRecipe), { comments: existingRecipe.comments ? [...existingRecipe.comments, newComment] : [newComment], updated_at: new Date().toISOString() });
        // 5) Update the recipe in Supabase
        const { data, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update(updatedRecipe)
            .eq('id', id)
            .select();
        // 6) Check for errors
        if (updateError || !data || data.length === 0) {
            console.error('Error updating recipe:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe'
            });
            return;
        }
        // 7) Return the updated recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.commentRecipe = commentRecipe;
// Get all comments of a recipe
const getCommentsRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        // 1) Validate input
        if (!id) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid recipe ID'
            });
            return;
        }
        // 2) Fetch recipe from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('comments')
            .eq('id', id)
            .single();
        // 3) Check for errors
        if (error || !data) {
            console.error('Error fetching recipe:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Check if comments were found
        if (!data.comments || data.comments.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No comments found for that recipe'
            });
            return;
        }
        // 5) Return the comments
        res.status(200).json({
            status: 'success',
            results: data.comments.length,
            data: {
                comments: data.comments
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getCommentsRecipe = getCommentsRecipe;
// Rating on a recipe (rating is a part of the recipe)
const ratingRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, rating } = req.body;
        // 1) Validate input
        if (!id || rating === undefined || rating === null) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: id, rating'
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
        // 3) Fetch the existing recipe from Supabase
        const { data: existingRecipe, error: fetchError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
        // 4) Check for errors
        if (fetchError || !existingRecipe) {
            console.error('Error fetching recipe:', fetchError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // Ensure ratings is an array
        const updatedRatings = Array.isArray(existingRecipe.rating) ? [...existingRecipe.rating] : [];
        // Check if the user has already rated
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous';
        const existingRatingIndex = updatedRatings.findIndex((r) => r.user_id === userId);
        if (existingRatingIndex !== -1) {
            // Update the existing rating
            updatedRatings[existingRatingIndex].rating = numericRating;
            updatedRatings[existingRatingIndex].created_at = new Date().toISOString();
        }
        else {
            // Add a new Rating object
            const newRating = {
                id: crypto_1.default.randomUUID(),
                recipe_id: id,
                user_id: userId,
                rating: numericRating,
                created_at: new Date().toISOString()
            };
            updatedRatings.push(newRating);
        }
        // 5) Update the recipe object with the updated ratings
        const updatedRecipe = Object.assign(Object.assign({}, existingRecipe), { rating: updatedRatings, updated_at: new Date().toISOString() });
        // 6) Update the recipe in Supabase
        const { data, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update(updatedRecipe)
            .eq('id', id)
            .select();
        // 7) Check for errors
        if (updateError || !data || data.length === 0) {
            console.error('Error updating recipe:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe'
            });
            return;
        }
        // 8) Return the updated recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.ratingRecipe = ratingRecipe;
// Get rating of a recipe
const getRatingRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        // 1) Validate input
        if (!id) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid recipe ID'
            });
            return;
        }
        // 2) Fetch recipe from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('rating')
            .eq('id', id)
            .single();
        // 3) Check for errors
        if (error || !data) {
            console.error('Error fetching recipe:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Check if rating was found
        if (!data.rating || !Array.isArray(data.rating) || data.rating.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No rating found for that recipe'
            });
            return;
        }
        // Calculate the average rating
        const totalRating = data.rating.reduce((sum, value) => sum + (value.rating || 0), 0);
        const averageRating = totalRating / data.rating.length;
        // 5) Return the average rating
        res.status(200).json({
            status: 'success',
            data: {
                averageRating
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getRatingRecipe = getRatingRecipe;
// Like a comment of a recipe
const likeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { recipeId, commentId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1) Validate input
        if (!recipeId || !commentId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: recipeId, commentId'
            });
            return;
        }
        // 2) Fetch the existing recipe from Supabase
        const { data: existingRecipe, error: fetchError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', recipeId)
            .single();
        // 3) Check for errors
        if (fetchError || !existingRecipe) {
            console.error('Error fetching recipe:', fetchError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Find the comment to like
        const commentToUpdate = (_b = existingRecipe.comments) === null || _b === void 0 ? void 0 : _b.find((comment) => comment.id === commentId);
        if (!commentToUpdate) {
            res.status(404).json({
                status: 'fail',
                message: 'Comment not found'
            });
            return;
        }
        // Initialize arrays if they don't exist
        if (!commentToUpdate.likedBy)
            commentToUpdate.likedBy = [];
        if (!commentToUpdate.dislikedBy)
            commentToUpdate.dislikedBy = [];
        // Check if user already liked this comment
        const alreadyLiked = commentToUpdate.likedBy.includes(userId);
        // Check if user already disliked this comment
        const alreadyDisliked = commentToUpdate.dislikedBy.includes(userId);
        // 5) Handle the like action
        if (alreadyLiked) {
            // User is unliking - remove from likedBy and decrease count
            commentToUpdate.likedBy = commentToUpdate.likedBy.filter((id) => id !== userId);
            commentToUpdate.likes = Math.max(0, (commentToUpdate.likes || 1) - 1);
        }
        else {
            // User is liking - first remove any dislike if it exists
            if (alreadyDisliked) {
                commentToUpdate.dislikedBy = commentToUpdate.dislikedBy.filter((id) => id !== userId);
                commentToUpdate.dislikes = Math.max(0, (commentToUpdate.dislikes || 1) - 1);
            }
            // Then add the like
            commentToUpdate.likedBy.push(userId);
            commentToUpdate.likes = (commentToUpdate.likes || 0) + 1;
        }
        // 6) Update the recipe in Supabase
        const { data, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update(existingRecipe)
            .eq('id', recipeId)
            .select();
        // 7) Check for errors
        if (updateError || !data || data.length === 0) {
            console.error('Error updating recipe:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe'
            });
            return;
        }
        // 8) Set the userLiked/userDisliked flags for this user's response
        const updatedComment = (_c = data[0].comments) === null || _c === void 0 ? void 0 : _c.find((comment) => comment.id === commentId);
        if (updatedComment) {
            updatedComment.userLiked = ((_d = updatedComment.likedBy) === null || _d === void 0 ? void 0 : _d.includes(userId)) || false;
            updatedComment.userDisliked = ((_e = updatedComment.dislikedBy) === null || _e === void 0 ? void 0 : _e.includes(userId)) || false;
        }
        // 9) Return the updated recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.likeComment = likeComment;
// Dislike a comment of a recipe
const dislikeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { recipeId, commentId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get the current user's ID
        // 1) Validate input
        if (!recipeId || !commentId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: recipeId, commentId'
            });
            return;
        }
        // 2) Fetch the existing recipe from Supabase
        const { data: existingRecipe, error: fetchError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .eq('id', recipeId)
            .single();
        // 3) Check for errors
        if (fetchError || !existingRecipe) {
            console.error('Error fetching recipe:', fetchError);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipe'
            });
            return;
        }
        // 4) Find the comment to dislike
        const commentToUpdate = (_b = existingRecipe.comments) === null || _b === void 0 ? void 0 : _b.find((comment) => comment.id === commentId);
        if (!commentToUpdate) {
            res.status(404).json({
                status: 'fail',
                message: 'Comment not found'
            });
            return;
        }
        // Initialize arrays if they don't exist
        if (!commentToUpdate.likedBy)
            commentToUpdate.likedBy = [];
        if (!commentToUpdate.dislikedBy)
            commentToUpdate.dislikedBy = [];
        // Check if user already disliked this comment
        const alreadyDisliked = commentToUpdate.dislikedBy.includes(userId);
        // Check if user already liked this comment
        const alreadyLiked = commentToUpdate.likedBy.includes(userId);
        // 5) Handle the dislike action
        if (alreadyDisliked) {
            // User is un-disliking - remove from dislikedBy and decrease count
            commentToUpdate.dislikedBy = commentToUpdate.dislikedBy.filter((id) => id !== userId);
            commentToUpdate.dislikes = Math.max(0, (commentToUpdate.dislikes || 1) - 1);
        }
        else {
            // User is disliking - first remove any like if it exists
            if (alreadyLiked) {
                commentToUpdate.likedBy = commentToUpdate.likedBy.filter((id) => id !== userId);
                commentToUpdate.likes = Math.max(0, (commentToUpdate.likes || 1) - 1);
            }
            // Then add the dislike
            commentToUpdate.dislikedBy.push(userId);
            commentToUpdate.dislikes = (commentToUpdate.dislikes || 0) + 1;
        }
        // 6) Update the recipe in Supabase
        const { data, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update(existingRecipe)
            .eq('id', recipeId)
            .select();
        // 7) Check for errors
        if (updateError || !data || data.length === 0) {
            console.error('Error updating recipe:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe'
            });
            return;
        }
        // 8) Set the userLiked/userDisliked flags for this user's response
        const updatedComment = (_c = data[0].comments) === null || _c === void 0 ? void 0 : _c.find((comment) => comment.id === commentId);
        if (updatedComment) {
            updatedComment.userLiked = ((_d = updatedComment.likedBy) === null || _d === void 0 ? void 0 : _d.includes(userId)) || false;
            updatedComment.userDisliked = ((_e = updatedComment.dislikedBy) === null || _e === void 0 ? void 0 : _e.includes(userId)) || false;
        }
        // 9) Return the updated recipe
        res.status(200).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.dislikeComment = dislikeComment;
// Upload recipe image to Supabase Storage and update recipe
const uploadRecipeImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to upload a recipe image.',
            });
            return;
        }
        // 2) Check if file is provided
        if (!req.file) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide an image file.',
            });
            return;
        }
        // 3) Check if recipe ID is provided
        const recipeId = req.query.id;
        if (!recipeId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a recipe ID.',
            });
            return;
        }
        // 4) Verify the recipe exists
        const { data: recipeData, error: recipeError } = yield supabase_1.default
            .from('recipes')
            .select('id')
            .eq('id', recipeId)
            .single();
        if (recipeError || !recipeData) {
            res.status(404).json({
                status: 'fail',
                message: 'Recipe not found.',
            });
            return;
        }
        // 5) Check permission: if the author of the recipe is the same as the logged in user
        const { data: authorData, error: authorError } = yield supabase_1.default
            .from('recipes')
            .select('author')
            .eq('id', recipeId)
            .single();
        // Check for errors or missing author
        if (authorError || !authorData) {
            res.status(404).json({
                status: 'fail',
                message: 'Recipe author not found.',
            });
            return;
        }
        // Check if author of recipe is the same as logged in user
        if (authorData.author !== req.user.name) {
            res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to upload an image for this recipe.',
            });
            return;
        }
        // 6) Generate a unique filename
        const fileName = `recipe-${recipeId}-${Date.now()}${path_1.default.extname(req.file.originalname)}`;
        const filePath = `Image Recipe/${fileName}`;
        // 7) Upload to Supabase Storage (using existing avatars bucket)
        const { data: uploadData, error: uploadError } = yield supabase_1.default
            .storage
            .from('avatars')
            .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true // Replace if file exists
        });
        if (uploadError) {
            console.error('Error uploading recipe image:', uploadError);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading recipe image to storage'
            });
            return;
        }
        // 8) Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase_1.default
            .storage
            .from('avatars')
            .getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;
        // 9) Update recipe's image_url field in database
        const { data: updatedRecipe, error: updateError } = yield supabase_1.default
            .from('recipes')
            .update({
            image_url: publicUrl,
            updated_at: new Date().toISOString()
        })
            .eq('id', recipeId)
            .select();
        if (updateError || !updatedRecipe || updatedRecipe.length === 0) {
            console.error('Error updating recipe image URL:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating recipe with image URL'
            });
            return;
        }
        // 10) Return success with updated recipe data
        res.status(200).json({
            status: 'success',
            data: {
                recipe: updatedRecipe[0]
            },
            message: 'Recipe image uploaded successfully'
        });
    }
    catch (err) {
        console.error('Error in recipe image upload:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while uploading the recipe image',
        });
    }
});
exports.uploadRecipeImage = uploadRecipeImage;
// Add a new recipe with image upload
const addRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, tags, time } = req.body;
        let ingredients = req.body.ingredients;
        let instructions = req.body.instructions;
        // Parse the JSON strings into actual arrays
        if (typeof ingredients === 'string') {
            ingredients = JSON.parse(ingredients);
        }
        if (typeof instructions === 'string') {
            instructions = JSON.parse(instructions);
        }
        // 1) Validate input
        if (!title || !ingredients || !instructions) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: title, ingredients, instructions'
            });
            return;
        }
        // 2) Generate a new recipe ID
        const recipeId = crypto_1.default.randomUUID();
        let image_url = undefined;
        // 3) If there's an image file, upload it first
        if (req.file) {
            // Generate a unique filename
            const fileName = `recipe-${recipeId}-${Date.now()}${path_1.default.extname(req.file.originalname)}`;
            const filePath = `Image Recipe/${fileName}`;
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = yield supabase_1.default
                .storage
                .from('avatars')
                .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true // Replace if file exists
            });
            if (uploadError) {
                console.error('Error uploading recipe image:', uploadError);
                res.status(500).json({
                    status: 'error',
                    message: 'Error uploading recipe image to storage'
                });
                return;
            }
            // Get the public URL for the uploaded file
            const { data: publicUrlData } = supabase_1.default
                .storage
                .from('avatars')
                .getPublicUrl(filePath);
            image_url = publicUrlData.publicUrl;
        }
        // 4) Create a new recipe object
        const newRecipe = {
            id: recipeId,
            title,
            ingredients,
            instructions,
            image_url, // Use the uploaded image URL or null
            author: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            tags,
            time,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        // 5) Insert the recipe into Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .insert([newRecipe])
            .select();
        // 6) Check for errors
        if (error || !data || data.length === 0) {
            console.error('Error adding recipe:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error adding recipe'
            });
            return;
        }
        // 7) Return the added recipe
        res.status(201).json({
            status: 'success',
            data: {
                recipe: data[0]
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.addRecipe = addRecipe;
// Delete a recipe (only author can delete)
const deleteRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                message: 'You must be logged in to delete a recipe'
            });
            return;
        }
        // 2) Check if recipe exists
        const { data: recipe, error: recipeError } = yield supabase_1.default
            .from('recipes')
            .select('id, author')
            .eq('id', recipeId)
            .single();
        if (recipeError || !recipe) {
            res.status(404).json({
                status: 'fail',
                message: 'Recipe not found'
            });
            return;
        }
        // 3) Check if user is the author of the recipe
        if (recipe.author !== userId) {
            res.status(403).json({
                status: 'fail',
                message: 'You can only delete your own recipes'
            });
            return;
        }
        // 4) Delete any comments associated with the recipe
        const { error: commentsError } = yield supabase_1.default
            .from('comments')
            .delete()
            .eq('recipe_id', recipeId);
        if (commentsError) {
            console.error('Error deleting comments:', commentsError);
            // Continue anyway, since we want to delete the recipe
        }
        // 5) Delete any ratings associated with the recipe
        const { error: ratingsError } = yield supabase_1.default
            .from('ratings')
            .delete()
            .eq('recipe_id', recipeId);
        if (ratingsError) {
            console.error('Error deleting ratings:', ratingsError);
            // Continue anyway, since we want to delete the recipe
        }
        // 6) Delete any notifications associated with the recipe
        const { error: notificationsError } = yield supabase_1.default
            .from('notifications')
            .delete()
            .eq('reference_id', recipeId)
            .eq('reference_type', 'RECIPE');
        if (notificationsError) {
            console.error('Error deleting notifications:', notificationsError);
            // Continue anyway, since we want to delete the recipe
        }
        // 7) Delete the recipe itself
        const { error: deleteError } = yield supabase_1.default
            .from('recipes')
            .delete()
            .eq('id', recipeId);
        if (deleteError) {
            console.error('Error deleting recipe:', deleteError);
            res.status(500).json({
                status: 'error',
                message: 'Error deleting recipe'
            });
            return;
        }
        // 8) Return success
        res.status(200).json({
            status: 'success',
            message: 'Recipe deleted successfully'
        });
    }
    catch (err) {
        console.error('Error deleting recipe:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the recipe'
        });
    }
});
exports.deleteRecipe = deleteRecipe;
// Get all recipes
const getAllRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Fetch all recipes from Supabase
        const { data, error } = yield supabase_1.default
            .from('recipes')
            .select('*');
        // 2) Check for errors
        if (error || !data) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching recipes'
            });
            return;
        }
        // 3) Check if recipes were found
        if (data.length === 0) {
            res.status(404).json({
                status: 'fail',
                message: 'No recipes found'
            });
            return;
        }
        // 4) Return the recipes
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                recipes: data
            }
        });
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
});
exports.getAllRecipes = getAllRecipes;
