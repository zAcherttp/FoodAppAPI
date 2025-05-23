import express, { NextFunction, Response } from 'express';
import * as authController from '../controllers/authController';
import * as authMiddleware from '../middleware/authMiddleware';
import { RequestWithUser } from '../types';

const router = express.Router();

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.protect, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp/', authController.verifyOtp);
router.patch('/reset-password', authController.resetPassword);

// Get all active sessions for current user
router.get('/sessions', authMiddleware.protect, authController.getUserSessions);

export default router;
