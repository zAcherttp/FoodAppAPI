import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/supabase';

import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';

// Load environment variables
dotenv.config();

// Create and configure Express app
export const createServer = (): Application => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/recipes', recipeRoutes);

  app.get('/', (req, res) => {
    res.send('API is running');
  });

  return app;
};

const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_valid', true);
    
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
  const app = createServer();
  const PORT = process.env.PORT || 3000;
  const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '1440'); // Default: once a day (in minutes)
  
  setInterval(cleanupExpiredSessions, cleanupInterval * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Run initial cleanup
    cleanupExpiredSessions();
  });
}