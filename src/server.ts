import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/supabase';
import http from 'http';
import { initializeSocket } from './services/socketService';

import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';
import userRoutes from './routes/userRoutes';
import commentRoutes from './routes/commentRoutes';
import ratingRoutes from './routes/ratingRoutes';
import { RecipeVectorDB } from './controllers/aiController';
import notificationRoutes from './routes/notificationRoutes';

// Load environment variables
dotenv.config();

// Create and configure Express app
export const createServer = (): { app: Application, server: http.Server } => {
  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initializeSocket(server);
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('public'));

  app.use('/api/auth', authRoutes);
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.get('/', (req, res) => {
    res.send('API is running');
  });

  return { app, server };
};

const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    // First invalidate expired sessions
    const { error: invalidateError } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_valid', true);
    
    if (invalidateError) {
      console.error('Error invalidating expired sessions:', invalidateError);
      return;
    }
    
    // Then delete the invalidated sessions
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('is_valid', false);
    if (error) {
      console.error('Error cleaning up expired sessions:', error);
    } else {
      console.log('Expired sessions cleaned up successfully');
    }
  } catch (err) {
    console.error('Session cleanup error:', err);
  }
};

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  const { server } = createServer();
  const PORT = process.env.PORT || 3000;
  const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '1440'); // Default: once a day (in minutes)
  
  setInterval(cleanupExpiredSessions, cleanupInterval * 60 * 1000);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Run initial cleanup
    cleanupExpiredSessions();
    const recipeRAG = new RecipeVectorDB();
    recipeRAG.processRecipes();
  });
}