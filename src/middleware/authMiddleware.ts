import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { RequestWithUser, DecodedToken } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Get token and check if it exists
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
        message: 'You are not logged in! Please log in to get access.',
      });
      return;
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // 3) Check if session exists and is valid
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', decoded.sessionId)
      .eq('is_valid', true)
      .single();

    //console.log('Session data:', session);

    if (error || !session) {
      res.status(401).json({
        status: 'fail',
        message: 'Your session is no longer valid. Please log in again.',
      });
      return;
    }
    
    // 4) Check session expiration
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (expiresAt < now) {
      // Invalidate expired session
      await supabase
        .from('sessions')
        .update({ is_valid: false })
        .eq('id', session.id);
      
      res.status(401).json({
        status: 'fail',
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }
    
    // 5) Verify token matches stored token
    if (session.token !== token) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid authorization. Please log in again.',
      });
      return;
    }

    // 6) Check if user still exists
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (userError || !currentUser) {
      res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    // 7) Store session and user on request
    req.session = session;
    req.user = currentUser;
    
    // Proceed to the protected route
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token or authorization error',
    });
  }
};