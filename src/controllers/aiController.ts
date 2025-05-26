import { Response } from "express";
import { Recipe, RequestWithUser, SearchQuery } from "../types";
import { RecipeAssistant } from "../services/aiService";

const assistant = new RecipeAssistant();

export const searchRecipes = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
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
    const result = await assistant.vectorSearchRecipes(
      searchQuery,
      searchOptions
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Search recipes error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to search recipes",
      error: error.message,
    });
  }
};

export const extractIngredientsFromImageAndSearchRecipes = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
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
    const extracted = await assistant.extractIngredientsFromImage(
      base64Image,
      req.file.mimetype
    );

    // Create search query with extracted ingredients
    const searchQuery: SearchQuery = {
      title: extracted.suggested_dishes
        ? extracted.suggested_dishes.join(", ")
        : "",
      ingredients: extracted.ingredients,
    };

    // Perform recipe search
    const searchResult = await assistant.vectorSearchRecipes(searchQuery, {
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
  } catch (error: any) {
    console.error("Extract ingredients error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to extract ingredients from image",
      error: error.message,
    });
  }
};

export const extractIngredientsFromImageAndSuggestRecipe = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
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
    const extracted = await assistant.extractIngredientsFromImage(
      base64Image,
      req.file.mimetype
    );

    const recipes: Recipe[] = await assistant.getSuggestedRecipes(
      extracted.ingredients
    );

    res.status(200).json({
      success: true,
      data: {
        extracted_ingredients: extracted.ingredients,
        recipes: recipes,
      },
    });
  } catch (error: any) {
    console.error("Extract ingredients error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to extract ingredients from image",
      error: error.message,
    });
  }
};

export const generateSearchQueryFromPromptAndSearchRecipes = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
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
    const searchQuery = await assistant.getSearchQueryByPrompt(prompt);

    // Perform RAG search
    const result = await assistant.vectorSearchRecipes(
      searchQuery,
      searchOptions
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Generate search query error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate search query and search recipes",
      error: error.message,
    });
  }
};
