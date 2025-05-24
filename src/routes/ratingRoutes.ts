import express from 'express';
import * as ratingController from '../controllers/ratingController';
import * as authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Rating routes
router.post('/rate', authMiddleware.protect, ratingController.rateRecipe);
router.get('/recipe/:recipeId', authMiddleware.protect,ratingController.getRecipeRating);
router.delete('/recipe/:recipeId', authMiddleware.protect, ratingController.deleteRating);

export default router;
