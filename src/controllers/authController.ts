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

    // 2) Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP before storing in database
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString(); // 10 minutes

    // 3) Save to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_reset_token: hashedOtp,
        password_reset_expires: otpExpires,
      })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({
        status: 'fail',
        message: 'Error generating OTP',
      });
      return;
    }

    // 4) Send email
    try {
      const emailData: EmailOptions = {
        email: user.email,
        subject: 'Your password reset OTP (valid for 10 min)',
        html: `
          <h2>Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `,
      };
      
      await sendEmail(emailData);

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

// verify OTP
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide email and OTP',
      });
      return;
    }

    // 1) Hash the provided OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    // 2) Get user based on email and check OTP
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_reset_token', hashedOtp)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    // 3) If OTP has not expired and is valid, return success
    if (error || !user) {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid OTP or OTP has expired',
      });
      return;
    }

    // OTP is valid
    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      isValid: true
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying OTP',
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide email, password, and password confirmation',
      });
      return;
    }
    
    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match',
      });
      return;
    }
    
    // Get user based on email and check if they have an active reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .not('password_reset_token', 'is', null)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    // 3) If reset token has not expired and is valid, set the new password
    if (error || !user) {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid reset session or session has expired. Please verify OTP again.',
      });
      return;
    }

    // 4) Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    
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

    // 5) Log the user in, send JWT
    await createSendToken(user, req, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Error resetting password',
    });
  }
};

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
}

// Get user by id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.query;

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