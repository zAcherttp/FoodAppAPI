import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to allow only image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'));
  }
};

// Multer configuration for avatar uploads
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware to handle Multer errors
export const handleMulterErrors = (req: Request, res: Response, next: NextFunction) => {
  upload.single('avatar')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during upload
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'fail',
          message: 'File too large. Maximum size is 5MB.',
        });
      }
      return res.status(400).json({
        status: 'fail',
        message: `File upload error: ${err.message}`,
      });
    } else if (err) {
      // A general error occurred
      return res.status(400).json({
        status: 'fail',
        message: err.message || 'File upload error',
      });
    }
    next();
  });
};

// Generate a unique filename for uploaded images
export const generateUniqueFilename = (originalname: string): string => {
  const fileExtension = path.extname(originalname);
  return `${crypto.randomUUID()}${fileExtension}`;
};
