import express from 'express';
import * as userController from '../controllers/userController';
import * as authMiddleware from '../middleware/authMiddleware';
import { upload, handleMulterErrors } from '../middleware/fileUpload';

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// User profile routes
router.get('/me', userController.getMe);
router.patch('/update-profile', userController.updateProfile);
router.patch('/update-password', userController.updatePassword);
router.get('/user/:id', userController.getUserById);
router.post('/upload-avatar', handleMulterErrors, userController.uploadAvatar);
router.delete('/delete-account', userController.deleteUser);

// Saved recipes routes
router.post('/save-recipe', userController.saveRecipe);
router.get('/saved-recipes', userController.getSavedRecipes);
router.delete('/saved-recipes/:recipeId', userController.removeSavedRecipe);

// Session management routes
router.get('/sessions', userController.getUserSessions);
router.delete('/sessions/:sessionId', userController.invalidateSession);

export default router;
