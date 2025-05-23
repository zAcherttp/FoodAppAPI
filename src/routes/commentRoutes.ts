import express from 'express';
import * as commentController from '../controllers/commentController';
import * as authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Comment routes
router.post('/add', authMiddleware.protect, commentController.addComment);
router.get('/recipe/:recipeId', authMiddleware.protect,commentController.getRecipeComments);
router.post('/like', authMiddleware.protect, commentController.likeComment);
router.post('/dislike', authMiddleware.protect, commentController.dislikeComment);
router.delete('/:commentId', authMiddleware.protect, commentController.deleteComment);

export default router;
