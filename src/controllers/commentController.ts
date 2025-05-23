import { Request, Response } from 'express';
import supabase from '../config/supabase';
import crypto from 'crypto';
import { RequestWithUser, Comment, CommentInteraction } from '../types';

// Add a comment to a recipe
export const addComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { recipeId, content } = req.body;
    const userId = req.user?.id;

    // 1) Validate input
    if (!recipeId || !content) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields: recipeId, content'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to comment'
      });
      return;
    }

    // 2) Check if recipe exists
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipeData) {
      res.status(404).json({
        status: 'fail',
        message: 'Recipe not found'
      });
      return;
    }

    // 3) Create new comment
    const newComment = {
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 0,
      dislikes: 0
    };

    // 4) Insert comment into the database
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert([newComment])
      .select();

    if (commentError || !commentData) {
      console.error('Error adding comment:', commentError);
      res.status(500).json({
        status: 'error',
        message: 'Error adding comment'
      });
      return;
    }

    // 5) Return success response
    res.status(201).json({
      status: 'success',
      data: {
        comment: commentData[0]
      }
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while adding the comment'
    });
  }
};

// Get comments for a recipe
export const getRecipeComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = (req as RequestWithUser).user?.id;

    // 1) Validate input
    if (!recipeId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a recipe ID'
      });
      return;
    }

    // 2) Fetch comments from the database
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching comments'
      });
      return;
    }

    // 3) If user is logged in, check which comments they've liked/disliked
    if (userId) {
      const { data: interactions, error: interactionsError } = await supabase
        .from('comment_interactions')
        .select('*')
        .eq('user_id', userId)
        .in('comment_id', comments.map(comment => comment.id));

      if (!interactionsError && interactions) {
        // Add userLiked and userDisliked flags to each comment
        for (const comment of comments) {
          const userInteraction = interactions.find(int => int.comment_id === comment.id);
          if (userInteraction) {
            comment.userLiked = userInteraction.interaction_type === 'like';
            comment.userDisliked = userInteraction.interaction_type === 'dislike';
          } else {
            comment.userLiked = false;
            comment.userDisliked = false;
          }
        }
      }
    }

    // 4) Return the comments
    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: {
        comments
      }
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the comments'
    });
  }
};

// Like a comment
export const likeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { commentId } = req.body;
    const userId = req.user?.id;

    // 1) Validate input
    if (!commentId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a comment ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to like a comment'
      });
      return;
    }

    // 2) Check if comment exists
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !commentData) {
      res.status(404).json({
        status: 'fail',
        message: 'Comment not found'
      });
      return;
    }

    // 3) Check if user already has an interaction
    const { data: existingInteraction, error: interactionError } = await supabase
      .from('comment_interactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    let operation;
    let likesChange = 0;
    let dislikesChange = 0;

    if (existingInteraction) {
      // User already has an interaction - handle accordingly
      if (existingInteraction.interaction_type === 'like') {
        // User is removing their like
        operation = 'remove_like';
        likesChange = -1;

        // Delete the interaction
        await supabase
          .from('comment_interactions')
          .delete()
          .eq('id', existingInteraction.id);
      } else {
        // User is changing from dislike to like
        operation = 'change_to_like';
        likesChange = 1;
        dislikesChange = -1;

        // Update the interaction
        await supabase
          .from('comment_interactions')
          .update({ 
            interaction_type: 'like',
            created_at: new Date().toISOString()
          })
          .eq('id', existingInteraction.id);
      }
    } else {
      // User is adding a new like
      operation = 'add_like';
      likesChange = 1;

      // Insert new interaction
      await supabase
        .from('comment_interactions')
        .insert({
          id: crypto.randomUUID(),
          comment_id: commentId,
          user_id: userId,
          interaction_type: 'like',
          created_at: new Date().toISOString()
        });
    }

    // 4) Update the comment likes/dislikes count
    const updatedLikes = Math.max(0, commentData.likes + likesChange);
    const updatedDislikes = Math.max(0, commentData.dislikes + dislikesChange);

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        likes: updatedLikes,
        dislikes: updatedDislikes
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      res.status(500).json({
        status: 'error',
        message: 'Error updating comment'
      });
      return;
    }

    // 5) Return the updated comment
    res.status(200).json({
      status: 'success',
      data: {
        comment: {
          ...updatedComment,
          userLiked: operation === 'add_like' || operation === 'change_to_like',
          userDisliked: false
        }
      }
    });
  } catch (err) {
    console.error('Error liking comment:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while liking the comment'
    });
  }
};

// Dislike a comment
export const dislikeComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { commentId } = req.body;
    const userId = req.user?.id;

    // 1) Validate input
    if (!commentId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a comment ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to dislike a comment'
      });
      return;
    }

    // 2) Check if comment exists
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !commentData) {
      res.status(404).json({
        status: 'fail',
        message: 'Comment not found'
      });
      return;
    }

    // 3) Check if user already has an interaction
    const { data: existingInteraction, error: interactionError } = await supabase
      .from('comment_interactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    let operation;
    let likesChange = 0;
    let dislikesChange = 0;

    if (existingInteraction) {
      // User already has an interaction - handle accordingly
      if (existingInteraction.interaction_type === 'dislike') {
        // User is removing their dislike
        operation = 'remove_dislike';
        dislikesChange = -1;

        // Delete the interaction
        await supabase
          .from('comment_interactions')
          .delete()
          .eq('id', existingInteraction.id);
      } else {
        // User is changing from like to dislike
        operation = 'change_to_dislike';
        likesChange = -1;
        dislikesChange = 1;

        // Update the interaction
        await supabase
          .from('comment_interactions')
          .update({ 
            interaction_type: 'dislike',
            created_at: new Date().toISOString()
          })
          .eq('id', existingInteraction.id);
      }
    } else {
      // User is adding a new dislike
      operation = 'add_dislike';
      dislikesChange = 1;

      // Insert new interaction
      await supabase
        .from('comment_interactions')
        .insert({
          id: crypto.randomUUID(),
          comment_id: commentId,
          user_id: userId,
          interaction_type: 'dislike',
          created_at: new Date().toISOString()
        });
    }

    // 4) Update the comment likes/dislikes count
    const updatedLikes = Math.max(0, commentData.likes + likesChange);
    const updatedDislikes = Math.max(0, commentData.dislikes + dislikesChange);

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        likes: updatedLikes,
        dislikes: updatedDislikes
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      res.status(500).json({
        status: 'error',
        message: 'Error updating comment'
      });
      return;
    }

    // 5) Return the updated comment
    res.status(200).json({
      status: 'success',
      data: {
        comment: {
          ...updatedComment,
          userLiked: false,
          userDisliked: operation === 'add_dislike' || operation === 'change_to_dislike'
        }
      }
    });
  } catch (err) {
    console.error('Error disliking comment:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while disliking the comment'
    });
  }
};

// Delete a comment
export const deleteComment = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    // 1) Validate input
    if (!commentId) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide a comment ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to delete a comment'
      });
      return;
    }

    // 2) Check if comment exists and belongs to the user
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !commentData) {
      res.status(404).json({
        status: 'fail',
        message: 'Comment not found'
      });
      return;
    }

    // 3) Check if user is the author of the comment
    if (commentData.user_id !== userId) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own comments'
      });
      return;
    }

    // 4) Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting comment'
      });
      return;
    }

    // 5) Return success
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the comment'
    });
  }
};
