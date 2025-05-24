import { Request, Response } from 'express';
import * as commentController from './commentController';
import * as ratingController from './ratingController';
import { RequestWithUser } from '../types';

// Comment on a recipe - redirecting to commentController
export const commentRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Modify the request body to match the commentController.addComment expectations
  req.body.recipeId = req.body.id;
  req.body.content = req.body.comment;
  
  // Forward the request to the commentController
  return commentController.addComment(req, res);
};

// Get comments of a recipe - redirecting to commentController
export const getCommentsRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Extract the recipe ID from query parameters
  const recipeId = req.query.id as string;
  
  // Create a modified request with params to match commentController.getRecipeComments 
  const modifiedReq = {
    ...req,
    params: {
      ...req.params,
      recipeId: recipeId
    }
  } as RequestWithUser;
  
  // Forward the request to the commentController
  return commentController.getRecipeComments(modifiedReq, res);
};

// Rate a recipe - redirecting to ratingController
export const ratingRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Modify the request body to match the ratingController.rateRecipe expectations
  req.body.recipeId = req.body.id;
  
  // Forward the request to the ratingController
  return ratingController.rateRecipe(req, res);
};

// Get rating of a recipe - redirecting to ratingController
export const getRatingRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Extract the recipe ID from query parameters
  const recipeId = req.query.id as string;
  
  // Create a modified request with params to match ratingController.getRecipeRating
  const modifiedReq = {
    ...req,
    params: {
      ...req.params,
      recipeId: recipeId
    }
  } as RequestWithUser;
  
  // Forward the request to the ratingController
  return ratingController.getRecipeRating(modifiedReq, res);
};

// Like a comment - redirecting to commentController
export const likeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Forward the request to the commentController
  return commentController.likeComment(req, res);
};

// Dislike a comment - redirecting to commentController
export const dislikeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  // Forward the request to the commentController
  return commentController.dislikeComment(req, res);
};
