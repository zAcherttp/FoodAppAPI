import e, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import supabase from '../config/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe, RequestWithUser, Rating, Comment, User } from '../types';
import dotenv from 'dotenv';
import path from 'path';


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

// Get recipe by id
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
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
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();    // 3) Check for errors
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Get recipes by author
export const getRecipesByAuthor = async (req: Request, res: Response): Promise<void> => {
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
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('author', author);    // 3) Check for errors
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Get 10 recipes latest
export const getLatestRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Fetch latest 10 recipes from Supabase
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);    // 2) Check for errors
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Get 10 random recipe
export const getRandomRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Fetch 10 random recipes from Supabase
    const { data, error } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Update a recipe
export const updateRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    const { data: existingRecipe, error: fetchError } = await supabase
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
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      title,
      ingredients,
      instructions,
      image_url,
      updated_at: new Date().toISOString()
    };

    // 5) Update the recipe in Supabase
    const { data, error: updateError } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Comment on a recipe (comment is a part of the recipe)
export const commentRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    const { data: existingRecipe, error: fetchError } = await supabase
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
    }    // 4) Update the recipe object with the new comment
    const newComment = {
      id: crypto.randomUUID(),
      content: comment,
      author_id: req.user?.id || 'Anonymous',
      created_at: new Date().toISOString()
    };

    const updatedRecipe: Recipe = {
      ...existingRecipe,
      comments: existingRecipe.comments ? [...existingRecipe.comments, newComment] : [newComment],
      updated_at: new Date().toISOString()
    };

    // 5) Update the recipe in Supabase
    const { data, error: updateError } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Get all comments of a recipe
export const getCommentsRecipe = async (req: Request, res: Response): Promise<void> => {
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
    const { data, error } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Rating on a recipe (rating is a part of the recipe)
export const ratingRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    const { data: existingRecipe, error: fetchError } = await supabase
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
    const userId = req.user?.id || 'anonymous';
    const existingRatingIndex = updatedRatings.findIndex((r: Rating) => r.user_id === userId);

    if (existingRatingIndex !== -1) {
      // Update the existing rating
      updatedRatings[existingRatingIndex].rating = numericRating;
      updatedRatings[existingRatingIndex].created_at = new Date().toISOString();
    } else {
      // Add a new Rating object
      const newRating: Rating = {
        id: crypto.randomUUID(),
        user_id: userId,
        rating: numericRating,
        created_at: new Date().toISOString()
      };
      updatedRatings.push(newRating);
    }

    // 5) Update the recipe object with the updated ratings
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      rating: updatedRatings,
      updated_at: new Date().toISOString()
    };

    // 6) Update the recipe in Supabase
    const { data, error: updateError } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Get rating of a recipe
export const getRatingRecipe = async (req: Request, res: Response): Promise<void> => {
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
    const { data, error } = await supabase
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
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Like a comment of a recipe
export const likeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { recipeId, commentId } = req.body;
    const userId = req.user?.id;

    // 1) Validate input
    if (!recipeId || !commentId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields: recipeId, commentId'
      });
      return;
    }

    // 2) Fetch the existing recipe from Supabase
    const { data: existingRecipe, error: fetchError } = await supabase
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
    const commentToUpdate = existingRecipe.comments?.find((comment: Comment) => comment.id === commentId);

    if (!commentToUpdate) {
      res.status(404).json({
        status: 'fail',
        message: 'Comment not found'
      });
      return;
    }

    // Initialize arrays if they don't exist
    if (!commentToUpdate.likedBy) commentToUpdate.likedBy = [];
    if (!commentToUpdate.dislikedBy) commentToUpdate.dislikedBy = [];
    
    // Check if user already liked this comment
    const alreadyLiked = commentToUpdate.likedBy.includes(userId);
    
    // Check if user already disliked this comment
    const alreadyDisliked = commentToUpdate.dislikedBy.includes(userId);

    // 5) Handle the like action
    if (alreadyLiked) {
      // User is unliking - remove from likedBy and decrease count
      commentToUpdate.likedBy = commentToUpdate.likedBy.filter((id: string) => id !== userId);
      commentToUpdate.likes = Math.max(0, (commentToUpdate.likes || 1) - 1);
    } else {
      // User is liking - first remove any dislike if it exists
      if (alreadyDisliked) {
        commentToUpdate.dislikedBy = commentToUpdate.dislikedBy.filter((id: string )=> id !== userId);
        commentToUpdate.dislikes = Math.max(0, (commentToUpdate.dislikes || 1) - 1);
      }
      
      // Then add the like
      commentToUpdate.likedBy.push(userId);
      commentToUpdate.likes = (commentToUpdate.likes || 0) + 1;
    }

    // 6) Update the recipe in Supabase
    const { data, error: updateError } = await supabase
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
    const updatedComment = data[0].comments?.find((comment: Comment) => comment.id === commentId);
    if (updatedComment) {
      updatedComment.userLiked = updatedComment.likedBy?.includes(userId) || false;
      updatedComment.userDisliked = updatedComment.dislikedBy?.includes(userId) || false;
    }

    // 9) Return the updated recipe
    res.status(200).json({
      status: 'success',
      data: {
        recipe: data[0]
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Dislike a comment of a recipe
export const dislikeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { recipeId, commentId } = req.body;
    const userId = req.user?.id; // Get the current user's ID

    // 1) Validate input
    if (!recipeId || !commentId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields: recipeId, commentId'
      });
      return;
    }

    // 2) Fetch the existing recipe from Supabase
    const { data: existingRecipe, error: fetchError } = await supabase
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
    const commentToUpdate = existingRecipe.comments?.find((comment: Comment) => comment.id === commentId);

    if (!commentToUpdate) {
      res.status(404).json({
        status: 'fail',
        message: 'Comment not found'
      });
      return;
    }

    // Initialize arrays if they don't exist
    if (!commentToUpdate.likedBy) commentToUpdate.likedBy = [];
    if (!commentToUpdate.dislikedBy) commentToUpdate.dislikedBy = [];
    
    // Check if user already disliked this comment
    const alreadyDisliked = commentToUpdate.dislikedBy.includes(userId);
    
    // Check if user already liked this comment
    const alreadyLiked = commentToUpdate.likedBy.includes(userId);

    // 5) Handle the dislike action
    if (alreadyDisliked) {
      // User is un-disliking - remove from dislikedBy and decrease count
      commentToUpdate.dislikedBy = commentToUpdate.dislikedBy.filter((id: string) => id !== userId);
      commentToUpdate.dislikes = Math.max(0, (commentToUpdate.dislikes || 1) - 1);
    } else {
      // User is disliking - first remove any like if it exists
      if (alreadyLiked) {
        commentToUpdate.likedBy = commentToUpdate.likedBy.filter((id: string )=> id !== userId);
        commentToUpdate.likes = Math.max(0, (commentToUpdate.likes || 1) - 1);
      }
      
      // Then add the dislike
      commentToUpdate.dislikedBy.push(userId);
      commentToUpdate.dislikes = (commentToUpdate.dislikes || 0) + 1;
    }

    // 6) Update the recipe in Supabase
    const { data, error: updateError } = await supabase
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
    const updatedComment = data[0].comments?.find((comment: Comment) => comment.id === commentId);
    if (updatedComment) {
      updatedComment.userLiked = updatedComment.likedBy?.includes(userId) || false;
      updatedComment.userDisliked = updatedComment.dislikedBy?.includes(userId) || false;
    }

    // 9) Return the updated recipe
    res.status(200).json({
      status: 'success',
      data: {
        recipe: data[0]
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

// Upload recipe image to Supabase Storage and update recipe
export const uploadRecipeImage = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    const { data: recipeData, error: recipeError } = await supabase
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
    const { data: authorData, error: authorError } = await supabase
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
    const fileName = `recipe-${recipeId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = `Image Recipe/${fileName}`;

    // 7) Upload to Supabase Storage (using existing avatars bucket)
    const { data: uploadData, error: uploadError } = await supabase
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
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 9) Update recipe's image_url field in database
    const { data: updatedRecipe, error: updateError } = await supabase
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

  } catch (err) {
    console.error('Error in recipe image upload:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while uploading the recipe image',
    });
  }
};

// Add a new recipe with image upload
export const addRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
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
        const recipeId = crypto.randomUUID();
        let image_url: string | undefined = undefined;

        // 3) If there's an image file, upload it first
        if (req.file) {
          // Generate a unique filename
          const fileName = `recipe-${recipeId}-${Date.now()}${path.extname(req.file.originalname)}`;
          const filePath = `Image Recipe/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
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
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(filePath);

          image_url = publicUrlData.publicUrl;
        }
    
        // 4) Create a new recipe object
        const newRecipe: Recipe = {
          id: recipeId,
          title,
          ingredients,
          instructions,
          image_url, // Use the uploaded image URL or null
          author: req.user?.name, 
          tags,
          time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
    
        // 5) Insert the recipe into Supabase
        const { data, error } = await supabase
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
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
          status: 'error',
          message: 'Something went wrong'
        });
    }
}