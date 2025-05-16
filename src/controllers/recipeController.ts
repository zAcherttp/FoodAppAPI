import e, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import supabase from '../config/supabase';
import { Recipe, RequestWithUser, Rating } from '../types';

// Add a new recipe
export const addRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const { title, ingredients, instructions, image_url } = req.body;
    
        // 1) Validate input
        if (!title || !ingredients || !instructions) {
        res.status(400).json({
            status: 'fail',
            message: 'Please provide all required fields: title, ingredients, instructions'
        });
        return;
        }
    
        // 2) Create a new recipe object
        const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        title,
        ingredients,
        instructions,
        image_url,
        author: req.user?.name, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        };
    
        // 3) Insert the recipe into Supabase
        const { data, error } = await supabase
        .from('recipes')
        .insert([newRecipe])
        .select();
    
        // 4) Check for errors
        if (error || !data || data.length === 0) {
            console.error('Error adding recipe:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error adding recipe'
            });
            return;
        }
    
        // 5) Return the added recipe
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

// Get recipes with title
export const getRecipesByTitle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

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
    const { id } = req.body;

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
    const { author } = req.body;

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
      .order('random()')
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
      author: req.user?.name || 'Anonymous',
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
    const { id } = req.body;

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
    const { id } = req.body;

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