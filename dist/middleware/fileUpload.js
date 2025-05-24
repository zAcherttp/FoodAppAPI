"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueFilename = exports.handleRecipeCreationImage = exports.handleRecipeImageErrors = exports.uploadRecipeImage = exports.handleMulterErrors = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
// File filter to allow only image files
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Not an image! Please upload only images.'));
    }
};
// Multer configuration for avatar uploads
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: fileFilter,
});
// Middleware to handle Multer errors
const handleMulterErrors = (req, res, next) => {
    exports.upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
        }
        else if (err) {
            // A general error occurred
            return res.status(400).json({
                status: 'fail',
                message: err.message || 'File upload error',
            });
        }
        next();
    });
};
exports.handleMulterErrors = handleMulterErrors;
// Multer configuration for recipe image uploads
exports.uploadRecipeImage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Not an image! Please upload only images.'));
        }
    }
});
// Middleware to handle Multer errors for recipe images
const handleRecipeImageErrors = (req, res, next) => {
    exports.uploadRecipeImage.single('imageRecipe')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
        }
        else if (err) {
            // A general error occurred
            return res.status(400).json({
                status: 'fail',
                message: err.message || 'File upload error',
            });
        }
        next();
    });
};
exports.handleRecipeImageErrors = handleRecipeImageErrors;
// Middleware to handle Multer file upload for recipe creation
const handleRecipeCreationImage = (req, res, next) => {
    exports.upload.single('imageRecipe')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
        }
        else if (err) {
            // A general error occurred
            return res.status(400).json({
                status: 'fail',
                message: err.message || 'File upload error',
            });
        }
        next();
    });
};
exports.handleRecipeCreationImage = handleRecipeCreationImage;
// Generate a unique filename for uploaded images
const generateUniqueFilename = (originalname) => {
    const fileExtension = path_1.default.extname(originalname);
    return `${crypto_1.default.randomUUID()}${fileExtension}`;
};
exports.generateUniqueFilename = generateUniqueFilename;
