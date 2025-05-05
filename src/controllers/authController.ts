import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import supabase from '../config/supabase';
import sendEmail from '../utils/emailService';
import { User, Session, RequestWithUser, DecodedToken, EmailOptions } from '../types';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const signToken = (id: string, sessionId: string): string => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  } as jwt.SignOptions);
};

const createSession = async (userId: string, req: Request): Promise<Session> => {
  const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN || '90');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Create session record
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        user_id: userId,
        user_agent: req.headers['user-agent'] || 'unknown',
        ip_address: req.ip || req.socket.remoteAddress,
        expires_at: expiresAt.toISOString(),
        is_valid: true
      }
    ])
    .select();

  if (error || !data || data.length === 0) {
    console.error('Error creating session:', error);
    throw new Error('Could not create session');
  }
  
  return data[0] as Session;
};

// Helper function to create and send token
const createSendToken = async (user: User, req: Request, statusCode: number, res: Response): Promise<void> => {
  try {
    // Create a session
    const session = await createSession(user.id, req);
    
    // Create token including the session ID
    const token = signToken(user.id, session.id);

    // Update the session with the token
    await supabase
      .from('sessions')
      .update({ token })
      .eq('id', session.id);

    // Remove password from output
    delete user.password;

    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user,
        session: { id: session.id },
      },
    });
  } catch (err) {
    console.error('Error in createSendToken:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error creating authentication token',
    });
  }
};

// Register user
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({
        status: 'fail',
        message: 'Email already in use',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        },
      ])
      .select();

    if (error || !newUser || newUser.length === 0) {
      res.status(400).json({
        status: 'fail',
        message: error?.message || 'Error creating user',
      });
      return;
    }

    // Remove password from output
    delete newUser[0].password;

    // Return success but don't create a session
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser[0],
      },
      message: 'User created successfully. Please log in.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
      return;
    }

    // Check if user exists && password is correct
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password as string))) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
      return;
    }

    // Check for existing active sessions
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    // Invalidate all existing sessions - ensure only one active session
    if (existingSessions && existingSessions.length > 0) {
      const currentIP = req.ip || req.socket.remoteAddress;
      const currentUserAgent = req.headers['user-agent'] || 'unknown';
      
      // Option to reuse session if from same device/location
      const sameDeviceSession = existingSessions.find(session => 
        session.ip_address === currentIP && 
        session.user_agent === currentUserAgent
      );
      
      if (sameDeviceSession) {
        // If session is from same device but has expired, invalidate it
        const now = new Date();
        const expiresAt = new Date(sameDeviceSession.expires_at);
        
        if (expiresAt > now) {
          // Session is still valid, reuse it
          const token = signToken(user.id, sameDeviceSession.id);
          
          // Update the session with new token
          await supabase
            .from('sessions')
            .update({ token })
            .eq('id', sameDeviceSession.id);
          
          // Remove password from output
          delete user.password;
          
          res.status(200).json({
            status: 'success',
            token,
            sessionId: sameDeviceSession.id, // Include session ID in response
            data: {
              user,
              message: 'Using existing session from same device'
            },
          });
          return;
        }
      }
      
      // Invalidate all existing sessions for this user
      await supabase
        .from('sessions')
        .update({ is_valid: false })
        .eq('user_id', user.id);
    }

    // Create new session and send token
    await createSendToken(user, req, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in',
    });
  }
};

// Logout 
export const logout = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Get token
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in.',
      });
      return;
    }

    // Find and invalidate the session
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('token', token);

    if (error) {
      console.error('Error invalidating session:', error);
      res.status(500).json({
        status: 'error',
        message: 'Could not log out. Please try again.',
      });
      return;
    }

    res.status(200).json({ 
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout',
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // 1) Get user based on POSTed email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address',
      });
      return;
    }

    // 2) Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const passwordResetExpires = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString(); // 10 minutes

    // 3) Save to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_reset_token: passwordResetToken,
        password_reset_expires: passwordResetExpires,
      })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({
        status: 'error',
        message: 'Error generating reset token',
      });
      return;
    }

    // 4) Send email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/reset-password/${resetToken}`;
    
    try {
      const email: EmailOptions = {
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        html: `Forgot your password? Click here to reset your password or copy and paste this link in your browser: <a href="${resetURL}">${resetURL}</a> If you didn't forget your password, please ignore this email!`,
      };
      
      await sendEmail(email);

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      // If error sending email, remove token from db
      await supabase
        .from('users')
        .update({
          password_reset_token: null,
          password_reset_expires: null,
        })
        .eq('id', user.id);

      res.status(500).json({
        status: 'error',
        message: 'There was an error sending the email. Try again later!',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error processing request',
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Get user based on the token
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', hashedToken)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    // 2) If token has not expired, and there is user, set the new password
    if (error || !user) {
      res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired',
      });
      return;
    }

    // 3) Update password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({
        status: 'error',
        message: 'Error updating password',
      });
      return;
    }

    // 4) Log the user in, send JWT
    await createSendToken(user, req, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error resetting password',
    });
  }
};