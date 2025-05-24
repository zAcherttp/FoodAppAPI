import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { RequestWithUser } from '../types';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

// Map of userId to socket connections
const userSocketMap: Map<string, string[]> = new Map();

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // In production, specify actual origins
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // Authenticate user with token
    socket.on('authenticate', async (token) => {
      try {
        if (!token || !process.env.JWT_SECRET) {
          socket.emit('authentication_error', 'No token provided or JWT secret missing');
          return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        const userId = decoded.id;

        // Check if user exists
        const { data: user, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (error || !user) {
          socket.emit('authentication_error', 'User not found');
          return;
        }

        // Associate socket with user
        socket.data.userId = userId;
        
        // Add socket to user's socket list
        if (!userSocketMap.has(userId)) {
          userSocketMap.set(userId, []);
        }
        userSocketMap.get(userId)?.push(socket.id);
        
        socket.emit('authenticated', { userId });
        console.log(`Socket ${socket.id} authenticated for user ${userId}`);
        
        // Join user's private room for notifications
        socket.join(`user:${userId}`);
      } catch (err) {
        console.error('Socket authentication error:', err);
        socket.emit('authentication_error', 'Invalid token');
      }
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        // Remove this socket from user's socket list
        const userSockets = userSocketMap.get(userId) || [];
        const updatedSockets = userSockets.filter(id => id !== socket.id);
        
        if (updatedSockets.length > 0) {
          userSocketMap.set(userId, updatedSockets);
        } else {
          userSocketMap.delete(userId);
        }
        
        console.log(`Socket ${socket.id} disconnected for user ${userId}`);
      }
    });
  });

  console.log('Socket.IO initialized');
};

// Send notification to specific user
export const sendNotificationToUser = (userId: string, notification: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification);
    console.log(`Notification sent to user ${userId}`);
  }
};

// Check if a user is online
export const isUserOnline = (userId: string): boolean => {
  return userSocketMap.has(userId) && (userSocketMap.get(userId)?.length || 0) > 0;
};

// Get socket service instance
export const getSocketIO = (): SocketIOServer => {
  return io;
};
