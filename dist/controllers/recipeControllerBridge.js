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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dislikeComment = exports.likeComment = exports.getRatingRecipe = exports.ratingRecipe = exports.getCommentsRecipe = exports.commentRecipe = void 0;
const commentController = __importStar(require("./commentController"));
const ratingController = __importStar(require("./ratingController"));
// Comment on a recipe - redirecting to commentController
const commentRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Modify the request body to match the commentController.addComment expectations
    req.body.recipeId = req.body.id;
    req.body.content = req.body.comment;
    // Forward the request to the commentController
    return commentController.addComment(req, res);
});
exports.commentRecipe = commentRecipe;
// Get comments of a recipe - redirecting to commentController
const getCommentsRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract the recipe ID from query parameters
    const recipeId = req.query.id;
    // Create a modified request with params to match commentController.getRecipeComments 
    const modifiedReq = Object.assign(Object.assign({}, req), { params: Object.assign(Object.assign({}, req.params), { recipeId: recipeId }) });
    // Forward the request to the commentController
    return commentController.getRecipeComments(modifiedReq, res);
});
exports.getCommentsRecipe = getCommentsRecipe;
// Rate a recipe - redirecting to ratingController
const ratingRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Modify the request body to match the ratingController.rateRecipe expectations
    req.body.recipeId = req.body.id;
    // Forward the request to the ratingController
    return ratingController.rateRecipe(req, res);
});
exports.ratingRecipe = ratingRecipe;
// Get rating of a recipe - redirecting to ratingController
const getRatingRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract the recipe ID from query parameters
    const recipeId = req.query.id;
    // Create a modified request with params to match ratingController.getRecipeRating
    const modifiedReq = Object.assign(Object.assign({}, req), { params: Object.assign(Object.assign({}, req.params), { recipeId: recipeId }) });
    // Forward the request to the ratingController
    return ratingController.getRecipeRating(modifiedReq, res);
});
exports.getRatingRecipe = getRatingRecipe;
// Like a comment - redirecting to commentController
const likeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Forward the request to the commentController
    return commentController.likeComment(req, res);
});
exports.likeComment = likeComment;
// Dislike a comment - redirecting to commentController
const dislikeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Forward the request to the commentController
    return commentController.dislikeComment(req, res);
});
exports.dislikeComment = dislikeComment;
