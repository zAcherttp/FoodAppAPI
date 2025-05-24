import express, { Request, Response } from 'express';
import * as recipeController from '../controllers/recipeController';
import * as recipeControllerBridge from '../controllers/recipeControllerBridge';
import * as authMiddleware from '../middleware/authMiddleware';
import supabase from '../config/supabase';
import { RequestWithUser } from '../types';
import { handleRecipeCreationImage, handleRecipeImageErrors } from '../middleware/fileUpload';

const router = express.Router();

router.post('/add-recipe', authMiddleware.protect, handleRecipeCreationImage ,recipeController.addRecipe);
router.get('/get-recipe-title', authMiddleware.protect, recipeController.getRecipesByTitle);
router.get('/get-recipe-latest', authMiddleware.protect, recipeController.getLatestRecipes);
router.get('/get-recipe-id', authMiddleware.protect, recipeController.getRecipeById);
router.get('/get-recipe-author', authMiddleware.protect, recipeController.getRecipesByAuthor);
router.get('/get-random-recipe', authMiddleware.protect, recipeController.getRandomRecipes);
router.patch('/comment-recipe', authMiddleware.protect, recipeControllerBridge.commentRecipe);
router.get('/get-recipe-comments', authMiddleware.protect, recipeControllerBridge.getCommentsRecipe);
router.patch('/rating-recipe', authMiddleware.protect, recipeControllerBridge.ratingRecipe);
router.get('/get-recipe-rating', authMiddleware.protect, recipeControllerBridge.getRatingRecipe);
router.patch('/like-comment', authMiddleware.protect, recipeControllerBridge.likeComment);
router.patch('/dislike-comment', authMiddleware.protect, recipeControllerBridge.dislikeComment);
router.post('/upload-image', authMiddleware.protect, handleRecipeImageErrors ,recipeController.uploadRecipeImage);

export default router;
