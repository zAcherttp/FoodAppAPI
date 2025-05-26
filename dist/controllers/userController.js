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
exports.deleteUser = exports.invalidateSession = exports.getUserSessions = exports.removeSavedRecipe = exports.getSavedRecipes = exports.saveRecipe = exports.uploadAvatar = exports.getMe = exports.getUserById = exports.updatePassword = exports.updateProfile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const path_1 = __importDefault(require("path"));
const supabase_1 = __importDefault(require("../config/supabase"));
// Update user profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, date_of_birth, country, url_avatar } = req.body;
        // 1) Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to update your profile.',
            });
            return;
        }
        // 2) Check if email is provided and if it already exists for another user
        if (email) {
            const { data: existingUser } = yield supabase_1.default
                .from('users')
                .select('id')
                .eq('email', email)
                .neq('id', req.user.id)
                .single();
            if (existingUser) {
                res.status(400).json({
                    status: 'fail',
                    message: 'This email is already used by another account.',
                });
                return;
            }
        }
        // 3) Update user in Supabase
        const { data, error } = yield supabase_1.default
            .from('users')
            .update({
            name,
            email,
            date_of_birth,
            country,
            url_avatar,
            updated_at: new Date().toISOString(),
        })
            .eq('id', req.user.id)
            .select();
        if (error || !data || data.length === 0) {
            res.status(400).json({
                status: 'fail',
                message: (error === null || error === void 0 ? void 0 : error.message) || 'An error occurred while updating the user information.',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: data[0],
            },
            message: 'Profile updated successfully.'
        });
    }
    catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while updating the profile.',
        });
    }
});
exports.updateProfile = updateProfile;
// Change password
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        // 1) Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to change your password.',
            });
            return;
        }
        // 2) Check if current password is provided
        if (!currentPassword) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide your current password.',
            });
            return;
        }
        // 3) Check if new password and confirm password match
        if (newPassword !== confirmNewPassword) {
            res.status(400).json({
                status: 'fail',
                message: 'New passwords do not match.',
            });
            return;
        }
        // 4) Get user from Supabase
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error || !user) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
            return;
        }
        // 5) Check if current password is correct
        const isCorrect = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isCorrect) {
            res.status(401).json({
                status: 'fail',
                message: 'Your current password is incorrect. Please try again.',
            });
            return;
        }
        // 6) Hash the new password
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 12);
        // 7) Update the password in Supabase
        const { error: updateError } = yield supabase_1.default
            .from('users')
            .update({
            password: hashedNewPassword,
            updated_at: new Date().toISOString(),
        })
            .eq('id', req.user.id);
        if (updateError) {
            res.status(500).json({
                status: 'error',
                message: 'Error updating password',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully.',
        });
    }
    catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while changing the password.',
        });
    }
});
exports.updatePassword = updatePassword;
// Get user by id
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if userId is provided
        if (!id) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a user ID.',
            });
            return;
        }
        // Get user from Supabase
        const { data: user, error } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !user) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found.',
            });
            return;
        }
        // Remove password from output
        delete user.password;
        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    }
    catch (err) {
        console.error('Error getting user by ID:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while fetching the user.',
        });
    }
});
exports.getUserById = getUserById;
// Get current user profile
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in.',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: req.user,
            },
        });
    }
    catch (err) {
        console.error('Error getting user profile:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while fetching the user profile.',
        });
    }
});
exports.getMe = getMe;
// Upload user avatar to Supabase Storage and update profile
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to upload an avatar.',
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
        // 3) Generate a unique filename
        const fileName = `avatar-${req.user.id}-${Date.now()}${path_1.default.extname(req.file.originalname)}`;
        const filePath = `avatars/${fileName}`;
        // 4) Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = yield supabase_1.default
            .storage
            .from('avatars')
            .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true // Replace if file exists
        });
        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading avatar to storage'
            });
            return;
        }
        // 5) Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase_1.default
            .storage
            .from('avatars')
            .getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;
        // 6) Update user's url_avatar field in database
        const { data: userData, error: updateError } = yield supabase_1.default
            .from('users')
            .update({
            url_avatar: publicUrl,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.user.id)
            .select();
        if (updateError || !userData || userData.length === 0) {
            console.error('Error updating user avatar URL:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating user profile with avatar URL'
            });
            return;
        }
        // 7) Return success with updated user data
        res.status(200).json({
            status: 'success',
            data: {
                user: userData[0]
            },
            message: 'Avatar uploaded successfully'
        });
    }
    catch (err) {
        console.error('Error in avatar upload:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while uploading the avatar',
        });
    }
});
exports.uploadAvatar = uploadAvatar;
// Save recipe to saved recipes
const saveRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipeId } = req.body;
        // Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to save a recipe.',
            });
            return;
        }
        // Check if recipeId is provided
        if (!recipeId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a recipe ID.',
            });
            return;
        }
        // Get the current user with their saved recipes
        const { data: userData, error: userError } = yield supabase_1.default
            .from('users')
            .select('saved_recipes')
            .eq('id', req.user.id)
            .single();
        if (userError) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found',
            });
            return;
        }
        // Initialize saved_recipes array if it doesn't exist
        const savedRecipes = userData.saved_recipes || [];
        // Check if recipe is already saved
        if (savedRecipes.includes(recipeId)) {
            res.status(400).json({
                status: 'fail',
                message: 'Recipe already saved',
            });
            return;
        }
        // Add the new recipe ID to the saved_recipes array
        savedRecipes.push(recipeId);
        // Update the user with the new saved_recipes array
        const { data, error } = yield supabase_1.default
            .from('users')
            .update({
            saved_recipes: savedRecipes,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.user.id)
            .select();
        if (error || !data || data.length === 0) {
            res.status(400).json({
                status: 'fail',
                message: (error === null || error === void 0 ? void 0 : error.message) || 'Error saving recipe',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                savedRecipe: recipeId,
                totalSavedRecipes: savedRecipes.length
            },
            message: 'Recipe saved successfully'
        });
    }
    catch (err) {
        console.error('Error saving recipe:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while saving the recipe',
        });
    }
});
exports.saveRecipe = saveRecipe;
// Get all saved recipes for a user
const getSavedRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to view saved recipes.',
            });
            return;
        }
        // Get user with saved recipes
        const { data: userData, error: userError } = yield supabase_1.default
            .from('users')
            .select('saved_recipes')
            .eq('id', req.user.id)
            .single();
        if (userError) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found',
            });
            return;
        }
        // Check if user has any saved recipes
        const savedRecipeIds = userData.saved_recipes || [];
        if (savedRecipeIds.length === 0) {
            res.status(200).json({
                status: 'success',
                results: 0,
                data: {
                    savedRecipes: [],
                },
            });
            return;
        }
        // Get recipe details for all saved recipe IDs
        const { data: recipes, error: recipesError } = yield supabase_1.default
            .from('recipes')
            .select('*')
            .in('id', savedRecipeIds);
        if (recipesError) {
            res.status(400).json({
                status: 'fail',
                message: recipesError.message || 'Error fetching recipe details',
            });
            return;
        }
        // Sort recipes to match the order in saved_recipes array
        const sortedRecipes = savedRecipeIds
            .map((id) => recipes.find((recipe) => recipe.id === id))
            .filter((recipe) => recipe !== undefined);
        // Return recipes
        res.status(200).json({
            status: 'success',
            results: sortedRecipes.length,
            data: {
                recipes: sortedRecipes,
            },
        });
    }
    catch (err) {
        console.error('Error fetching saved recipes:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while fetching saved recipes',
        });
    }
});
exports.getSavedRecipes = getSavedRecipes;
// Remove a recipe from saved recipes
const removeSavedRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipeId } = req.params;
        // Check if user is logged in
        if (!req.user || !req.user.id) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to remove a saved recipe.',
            });
            return;
        }
        // Check if recipeId is provided
        if (!recipeId) {
            res.status(400).json({
                status: 'fail',
                message: 'Please provide a recipe ID.',
            });
            return;
        }
        // Get the current user with their saved recipes
        const { data: userData, error: userError } = yield supabase_1.default
            .from('users')
            .select('saved_recipes')
            .eq('id', req.user.id)
            .single();
        if (userError) {
            res.status(404).json({
                status: 'fail',
                message: 'User not found',
            });
            return;
        }
        // Initialize saved_recipes array if it doesn't exist
        const savedRecipes = userData.saved_recipes || [];
        // Check if recipe exists in saved recipes
        if (!savedRecipes.includes(recipeId)) {
            res.status(404).json({
                status: 'fail',
                message: 'Recipe not found in saved recipes',
            });
            return;
        }
        // Remove the recipe ID from the saved_recipes array
        const updatedRecipes = savedRecipes.filter((id) => id !== recipeId);
        // Update the user with the modified saved_recipes array
        const { error } = yield supabase_1.default
            .from('users')
            .update({
            saved_recipes: updatedRecipes,
            updated_at: new Date().toISOString()
        })
            .eq('id', req.user.id);
        if (error) {
            res.status(400).json({
                status: 'fail',
                message: error.message || 'Error removing saved recipe',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Recipe removed from saved recipes'
        });
    }
    catch (err) {
        console.error('Error removing saved recipe:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while removing the saved recipe',
        });
    }
});
exports.removeSavedRecipe = removeSavedRecipe;
// Get active sessions for current user
const getUserSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({
                status: 'fail',
                message: 'Not authenticated',
            });
            return;
        }
        const { data: sessions, error } = yield supabase_1.default
            .from('sessions')
            .select('id, user_agent, ip_address, created_at, expires_at')
            .eq('user_id', req.user.id)
            .eq('is_valid', true)
            .order('created_at', { ascending: false });
        if (error) {
            res.status(500).json({
                status: 'error',
                message: 'Could not retrieve sessions',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                sessions,
                current_session_id: (_b = req.session) === null || _b === void 0 ? void 0 : _b.id
            },
        });
    }
    catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching sessions',
        });
    }
});
exports.getUserSessions = getUserSessions;
// Invalidate a specific session (logout from a specific device)
const invalidateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sessionId = req.params.sessionId;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({
                status: 'fail',
                message: 'Not authenticated',
            });
            return;
        }
        // Verify the session belongs to the current user
        const { data: session, error: fetchError } = yield supabase_1.default
            .from('sessions')
            .select('user_id')
            .eq('id', sessionId)
            .single();
        if (fetchError || !session) {
            res.status(404).json({
                status: 'fail',
                message: 'Session not found',
            });
            return;
        }
        if (session.user_id !== req.user.id) {
            res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to invalidate this session',
            });
            return;
        }
        // Don't allow invalidating the current session through this endpoint
        if (req.session && sessionId === req.session.id) {
            res.status(400).json({
                status: 'fail',
                message: 'Cannot invalidate your current session. Use the logout endpoint instead.',
            });
            return;
        }
        // Invalidate the session
        const { error } = yield supabase_1.default
            .from('sessions')
            .update({ is_valid: false })
            .eq('id', sessionId);
        if (error) {
            res.status(500).json({
                status: 'error',
                message: 'Could not invalidate session',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Session invalidated successfully',
        });
    }
    catch (err) {
        console.error('Error invalidating session:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while invalidating the session',
        });
    }
});
exports.invalidateSession = invalidateSession;
// Delete user account
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1) Check if user is logged in
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to delete your account.',
            });
            return;
        }
        // Token validation is already handled by authMiddleware.protect
        // No password check needed as per updated requirements
        // 5) Delete user-related data from various tables
        // Note: Some tables have ON DELETE CASCADE in their foreign key constraints,
        // so those records will be automatically deleted
        // 5a) Delete user's recipes
        const { data: userRecipes, error: recipesQueryError } = yield supabase_1.default
            .from('recipes')
            .select('id')
            .eq('author', userId);
        if (recipesQueryError) {
            console.error('Error fetching user recipes:', recipesQueryError);
            // Continue anyway as we want to delete the user
        }
        else if (userRecipes && userRecipes.length > 0) {
            // For each recipe, delete related data that might not have CASCADE
            for (const recipe of userRecipes) {
                // Delete notifications related to this recipe
                const { error: notificationsError } = yield supabase_1.default
                    .from('notifications')
                    .delete()
                    .eq('reference_id', recipe.id)
                    .eq('reference_type', 'RECIPE');
                if (notificationsError) {
                    console.error(`Error deleting notifications for recipe ${recipe.id}:`, notificationsError);
                    // Continue anyway
                }
            }
            // Delete the recipes
            const { error: recipesDeleteError } = yield supabase_1.default
                .from('recipes')
                .delete()
                .eq('author', userId);
            if (recipesDeleteError) {
                console.error('Error deleting user recipes:', recipesDeleteError);
                // Continue anyway as we want to delete the user
            }
        }
        // 5b) Delete notifications where user is the recipient
        const { error: recipientNotificationsError } = yield supabase_1.default
            .from('notifications')
            .delete()
            .eq('recipient_id', userId);
        if (recipientNotificationsError) {
            console.error('Error deleting notifications where user is recipient:', recipientNotificationsError);
            // Continue anyway as we want to delete the user
        }
        // 5c) Delete or update notifications where user is the sender
        // We have two options here: Delete those notifications or set sender_id to NULL
        // Option 1: Delete notifications where user is sender
        const { error: senderNotificationsDeleteError } = yield supabase_1.default
            .from('notifications')
            .delete()
            .eq('sender_id', userId);
        if (senderNotificationsDeleteError) {
            console.error('Error deleting notifications where user is sender:', senderNotificationsDeleteError);
            // Option 2: If deletion fails, try to set sender_id to NULL (which is allowed by the foreign key constraint)
            const { error: senderNotificationsUpdateError } = yield supabase_1.default
                .from('notifications')
                .update({ sender_id: null })
                .eq('sender_id', userId);
            if (senderNotificationsUpdateError) {
                console.error('Error updating sender_id to NULL in notifications:', senderNotificationsUpdateError);
                // Continue anyway as we want to delete the user
            }
        }
        // 6) Delete the user account itself
        const { error: deleteError } = yield supabase_1.default
            .from('users')
            .delete()
            .eq('id', userId);
        if (deleteError) {
            console.error('Error deleting user account:', deleteError);
            res.status(500).json({
                status: 'error',
                message: 'Error deleting user account',
            });
            return;
        }
        // 7) Return success (without a token since the user is now deleted)
        res.status(200).json({
            status: 'success',
            message: 'Account deleted successfully',
        });
    }
    catch (err) {
        console.error('Error deleting user account:', err);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while deleting the account.',
        });
    }
});
exports.deleteUser = deleteUser;
