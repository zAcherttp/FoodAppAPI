import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import supabase from '../config/supabase';
import { Recipe, RequestWithUser } from '../types';

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


