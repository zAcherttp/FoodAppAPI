import { Response } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import supabase from '../config/supabase';
import { RequestWithUser } from '../types';

// Update user profile
export const updateProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { name, email, date_of_birth, country, url_avatar} = req.body;

    // 1) Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to update your profile.',
      });
      return;
    }

    // 2) Check if email is provided and if it already exists for another user
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', req.user.id)
        .single();

      if (existingUser) {
        res.status(400).json({
          status: 'fail',
          message: 'This email is already used by another account.',
        });
        return;
      }
    }

    // 3) Update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        date_of_birth,
        country,
        url_avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select();

    if (error || !data || data.length === 0) {
      res.status(400).json({
        status: 'fail',
        message: error?.message || 'An error occurred while updating the user information.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: data[0],
      },
      message: 'Profile updated successfully.'
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while updating the profile.',
    });
  }
};

// Change password
export const updatePassword = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // 1) Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to change your password.',
      });
      return;
    }

    // 2) Check if current password is provided
    if (!currentPassword) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide your current password.',
      });
      return;
    }

    // 3) Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      res.status(400).json({
        status: 'fail',
        message: 'New passwords do not match.',
      });
      return;
    }

    // 4) Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
      return;
    }

    // 5) Check if current password is correct
    const isCorrect = await bcrypt.compare(currentPassword, user.password as string);
    
    if (!isCorrect) {
      res.status(401).json({
        status: 'fail',
        message: 'Your current password is incorrect. Please try again.',
      });
      return;
    }

    // 6) Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 7) Update the password in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (updateError) {
      res.status(500).json({
        status: 'error',
        message: 'Error updating password',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while changing the password.',
    });
  }
};

// Get user by id
export const getUserById = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if userId is provided
    if (!id) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a user ID.',
      });
      return;
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
      return;
    }

    // Remove password from output
    delete user.password;

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    console.error('Error getting user by ID:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while fetching the user.',
    });
  }
};

// Get current user profile
export const getMe = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while fetching the user profile.',
    });
  }
};

// Upload user avatar to Supabase Storage and update profile
export const uploadAvatar = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // 1) Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to upload an avatar.',
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

    // 3) Generate a unique filename
    const fileName = `avatar-${req.user.id}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = `avatars/${fileName}`;

    // 4) Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true // Replace if file exists
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      res.status(500).json({
        status: 'error',
        message: 'Error uploading avatar to storage'
      });
      return;
    }

    // 5) Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 6) Update user's url_avatar field in database
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        url_avatar: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select();

    if (updateError || !userData || userData.length === 0) {
      console.error('Error updating user avatar URL:', updateError);
      res.status(500).json({
        status: 'error',
        message: 'Error updating user profile with avatar URL'
      });
      return;
    }

    // 7) Return success with updated user data
    res.status(200).json({
      status: 'success',
      data: {
        user: userData[0]
      },
      message: 'Avatar uploaded successfully'
    });

  } catch (err) {
    console.error('Error in avatar upload:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while uploading the avatar',
    });
  }
};

// Save recipe to saved recipes
export const saveRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.body;

    // Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to save a recipe.',
      });
      return;
    }

    // Check if recipeId is provided
    if (!recipeId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a recipe ID.',
      });
      return;
    }

    // Get the current user with their saved recipes
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('saved_recipes')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    // Initialize saved_recipes array if it doesn't exist
    const savedRecipes = userData.saved_recipes || [];
    
    // Check if recipe is already saved
    if (savedRecipes.includes(recipeId)) {
      res.status(400).json({
        status: 'fail',
        message: 'Recipe already saved',
      });
      return;
    }

    // Add the new recipe ID to the saved_recipes array
    savedRecipes.push(recipeId);

    // Update the user with the new saved_recipes array
    const { data, error } = await supabase
      .from('users')
      .update({
        saved_recipes: savedRecipes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select();

    if (error || !data || data.length === 0) {
      res.status(400).json({
        status: 'fail',
        message: error?.message || 'Error saving recipe',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        savedRecipe: recipeId,
        totalSavedRecipes: savedRecipes.length
      },
      message: 'Recipe saved successfully'
    });
  } catch (err) {
    console.error('Error saving recipe:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while saving the recipe',
    });
  }
};

// Get all saved recipes for a user
export const getSavedRecipes = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to view saved recipes.',
      });
      return;
    }

    // Get user with saved recipes
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('saved_recipes')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    // Check if user has any saved recipes
    const savedRecipeIds = userData.saved_recipes || [];
    
    if (savedRecipeIds.length === 0) {
      res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          savedRecipes: [],
        },
      });
      return;
    }

    // Get recipe details for all saved recipe IDs
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', savedRecipeIds);

    if (recipesError) {
      res.status(400).json({
        status: 'fail',
        message: recipesError.message || 'Error fetching recipe details',
      });
      return;
    }

    // Sort recipes to match the order in saved_recipes array
    const sortedRecipes = savedRecipeIds
      .map((id: string) => recipes.find((recipe: any) => recipe.id === id))
      .filter((recipe: any) => recipe !== undefined);

    // Return recipes
    res.status(200).json({
      status: 'success',
      results: sortedRecipes.length,
      data: {
        recipes: sortedRecipes,
      },
    });

  } catch (err) {
    console.error('Error fetching saved recipes:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while fetching saved recipes',
    });
  }
};

// Remove a recipe from saved recipes
export const removeSavedRecipe = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;

    // Check if user is logged in
    if (!req.user || !req.user.id) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to remove a saved recipe.',
      });
      return;
    }

    // Check if recipeId is provided
    if (!recipeId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a recipe ID.',
      });
      return;
    }

    // Get the current user with their saved recipes
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('saved_recipes')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    // Initialize saved_recipes array if it doesn't exist
    const savedRecipes = userData.saved_recipes || [];
    
    // Check if recipe exists in saved recipes
    if (!savedRecipes.includes(recipeId)) {
      res.status(404).json({
        status: 'fail',
        message: 'Recipe not found in saved recipes',
      });
      return;
    }

    // Remove the recipe ID from the saved_recipes array
    const updatedRecipes = savedRecipes.filter((id: string) => id !== recipeId);

    // Update the user with the modified saved_recipes array
    const { error } = await supabase
      .from('users')
      .update({
        saved_recipes: updatedRecipes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message || 'Error removing saved recipe',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Recipe removed from saved recipes'
    });
  } catch (err) {
    console.error('Error removing saved recipe:', err);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while removing the saved recipe',
    });
  }
};

// Get active sessions for current user
export const getUserSessions = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Not authenticated',
      });
      return;
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, user_agent, ip_address, created_at, expires_at')
      .eq('user_id', req.user.id)
      .eq('is_valid', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      res.status(500).json({
        status: 'error',
        message: 'Could not retrieve sessions',
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        sessions,
        current_session_id: req.session?.id
      },
    });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching sessions',
    });
  }
};

// Invalidate a specific session (logout from a specific device)
export const invalidateSession = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail', 
        message: 'Not authenticated',
      });
      return;
    }

    // Verify the session belongs to the current user
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
    if (fetchError || !session) {
      res.status(404).json({
        status: 'fail',
        message: 'Session not found',
      });
      return;
    }
    
    if (session.user_id !== req.user.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to invalidate this session',
      });
      return;
    }
    
    // Don't allow invalidating the current session through this endpoint
    if (req.session && sessionId === req.session.id) {
      res.status(400).json({
        status: 'fail',
        message: 'Cannot invalidate your current session. Use the logout endpoint instead.',
      });
      return;
    }
    
    // Invalidate the session
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('id', sessionId);
    
    if (error) {
      res.status(500).json({
        status: 'error',
        message: 'Could not invalidate session',
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Session invalidated successfully',
    });
  } catch (err) {
    console.error('Error invalidating session:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while invalidating the session',
    });
  }
};
