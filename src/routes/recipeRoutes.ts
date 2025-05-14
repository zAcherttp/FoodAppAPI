import express, { Request, Response } from 'express';
import * as recipeController from '../controllers/recipeController';
import * as authMiddleware from '../middleware/authMiddleware';
import supabase from '../config/supabase';
import { RequestWithUser } from '../types';

const router = express.Router();

router.post('/add-recipe', authMiddleware.protect, recipeController.addRecipe);
router.get('/get-recipe-title', authMiddleware.protect, recipeController.getRecipesByTitle);
router.get('/get-recipe-lasted', authMiddleware.protect, recipeController.getLatestRecipes);

export default router;
