import { Response } from "express";
import { RequestWithUser } from "../types";
import { RecipeAssistant } from "../utils/aiService";

const assistant = new RecipeAssistant();

export const searchRecipes = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { searchQuery, searchOptions } = req.body;

    // Validate required fields
    if (!searchQuery || !searchQuery.title) {
      res.status(400).json({
        success: false,
        message: "Search query with title is required",
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
