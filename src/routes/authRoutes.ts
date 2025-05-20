import express, { Request, Response } from 'express';
import * as authController from '../controllers/authController';
import * as authMiddleware from '../middleware/authMiddleware';
import supabase from '../config/supabase';
import { RequestWithUser } from '../types';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.protect, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp/', authController.verifyOtp);
router.patch('/reset-password', authController.resetPassword);
router.patch('/update-profile', authMiddleware.protect, authController.updateProfile);
router.patch('/update-password', authMiddleware.protect, authController.updatePassword);
router.get('/get-user-byID', authMiddleware.protect, authController.getUserById);


// Get user profile
router.get('/me', authMiddleware.protect, (req: RequestWithUser, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// Get all active sessions for current user
router.get('/sessions', authMiddleware.protect, async (req: RequestWithUser, res: Response): Promise<void> => {
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
});

// Invalidate a specific session (logout from a specific device)
router.delete('/sessions/:sessionId', authMiddleware.protect, async (req: RequestWithUser, res: Response) : Promise<void> => {
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
});

export default router;