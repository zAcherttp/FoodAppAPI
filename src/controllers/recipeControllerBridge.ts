// filepath: e:\uit\uit-ki-2-nam-2\nt118\FoodAppAPI\src\controllers\recipeController.ts
import e, { Request, Response } from 'express';
import { normalizeRecipe } from '../utils/dataNormalization';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import supabase from '../config/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe, RequestWithUser, Rating, Comment, User } from '../types';
import dotenv from 'dotenv';
import path from 'path';
import * as commentController from './commentController';
import * as ratingController from './ratingController';

// Get recipes with title
export const getRecipesByTitle = async (req: Request, res: Response): Promise<void> => {
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
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .ilike('title', `%${title}%`);    // 3) Check for errors
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// [Keep all other existing recipe-specific functions]

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
