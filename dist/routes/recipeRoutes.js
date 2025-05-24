"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recipeController = __importStar(require("../controllers/recipeController"));
const recipeControllerBridge = __importStar(require("../controllers/recipeControllerBridge"));
const authMiddleware = __importStar(require("../middleware/authMiddleware"));
const fileUpload_1 = require("../middleware/fileUpload");
const router = express_1.default.Router();
router.post('/add-recipe', authMiddleware.protect, fileUpload_1.handleRecipeCreationImage, recipeController.addRecipe);
router.get('/get-recipe-title', authMiddleware.protect, recipeController.getRecipesByTitle);
router.get('/get-recipe-latest', authMiddleware.protect, recipeController.getLatestRecipes);
router.get('/get-recipe-id', authMiddleware.protect, recipeController.getRecipeById);
router.get('/get-recipe-author', authMiddleware.protect, recipeController.getRecipesByAuthor);
router.get('/get-random-recipe', authMiddleware.protect, recipeController.getRandomRecipes);
router.patch('/comment-recipe', authMiddleware.protect, recipeControllerBridge.commentRecipe);
router.get('/get-recipe-comments', authMiddleware.protect, recipeControllerBridge.getCommentsRecipe);
router.patch('/rating-recipe', authMiddleware.protect, recipeControllerBridge.ratingRecipe);
router.get('/get-recipe-rating', authMiddleware.protect, recipeControllerBridge.getRatingRecipe);
router.patch('/like-comment', authMiddleware.protect, recipeControllerBridge.likeComment);
router.patch('/dislike-comment', authMiddleware.protect, recipeControllerBridge.dislikeComment);
router.post('/upload-image', authMiddleware.protect, fileUpload_1.handleRecipeImageErrors, recipeController.uploadRecipeImage);
exports.default = router;
