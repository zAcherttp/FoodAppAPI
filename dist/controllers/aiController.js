"use strict";
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
exports.generateSearchQueryFromPromptAndSearchRecipes = exports.extractIngredientsFromImageAndSuggestRecipe = exports.extractIngredientsFromImageAndSearchRecipes = exports.searchRecipes = void 0;
const aiService_1 = require("../services/aiService");
const assistant = new aiService_1.RecipeAssistant();
const searchRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { searchQuery, searchOptions } = req.body;
        // Validate required fields
        if (!searchQuery) {
            res.status(400).json({
                success: false,
                message: "Search query is required",
            });
            return;
        }
        // Perform RAG search
        const result = yield assistant.vectorSearchRecipes(searchQuery, searchOptions);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Search recipes error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to search recipes",
            error: error.message,
        });
    }
});
exports.searchRecipes = searchRecipes;
const extractIngredientsFromImageAndSearchRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate file upload
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No image file provided",
            });
            return;
        }
        // Convert buffer directly to base64
        const base64Image = req.file.buffer.toString("base64");
        // Extract ingredients using AI directly from buffer
        const extracted = yield assistant.extractIngredientsFromImage(base64Image, req.file.mimetype);
        // Create search query with extracted ingredients
        const searchQuery = {
            title: extracted.suggested_dishes
                ? extracted.suggested_dishes.join(", ")
                : "",
            ingredients: extracted.ingredients,
        };
        // Perform recipe search
        const searchResult = yield assistant.vectorSearchRecipes(searchQuery, {
            similarity_threshold: 0.4,
            match_limit: 10,
        });
        res.status(200).json({
            success: true,
            data: {
                suggested_dishes: extracted.suggested_dishes,
                extracted_ingredients: extracted.ingredients,
                recipes: searchResult,
            },
        });
    }
    catch (error) {
        console.error("Extract ingredients error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to extract ingredients from image",
            error: error.message,
        });
    }
});
exports.extractIngredientsFromImageAndSearchRecipes = extractIngredientsFromImageAndSearchRecipes;
const extractIngredientsFromImageAndSuggestRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate file upload
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No image file provided",
            });
            return;
        }
        // Convert buffer directly to base64
        const base64Image = req.file.buffer.toString("base64");
        // Extract ingredients using AI directly from buffer
        const extracted = yield assistant.extractIngredientsFromImage(base64Image, req.file.mimetype);
        const recipes = yield assistant.getSuggestedRecipes(extracted.ingredients);
        res.status(200).json({
            success: true,
            data: {
                extracted_ingredients: extracted.ingredients,
                recipes: recipes,
            },
        });
    }
    catch (error) {
        console.error("Extract ingredients error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to extract ingredients from image",
            error: error.message,
        });
    }
});
exports.extractIngredientsFromImageAndSuggestRecipe = extractIngredientsFromImageAndSuggestRecipe;
const generateSearchQueryFromPromptAndSearchRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prompt, searchOptions } = req.body;
        // Validate required fields
        if (!prompt) {
            res.status(400).json({
                success: false,
                message: "Prompt is required",
            });
            return;
        }
        // Generate search query from prompt
        const searchQuery = yield assistant.getSearchQueryByPrompt(prompt);
        // Perform RAG search
        const result = yield assistant.vectorSearchRecipes(searchQuery, searchOptions);
        res.status(200).json({
            success: true,
            searchQuery: searchQuery,
            data: result,
        });
    }
    catch (error) {
        console.error("Generate search query error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate search query and search recipes",
            error: error.message,
        });
    }
});
exports.generateSearchQueryFromPromptAndSearchRecipes = generateSearchQueryFromPromptAndSearchRecipes;
