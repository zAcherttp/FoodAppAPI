import express from "express";
import * as aiController from "../controllers/aiController";
import * as authMiddleware from "../middleware/authMiddleware";
import { upload } from "../middleware/fileUpload";

const router = express.Router();

// AI routes
router.post("/search", authMiddleware.protect, aiController.searchRecipes);
router.post(
  "/search-image",
  authMiddleware.protect,
  upload.single("image"),
  aiController.extractIngredientsFromImageAndSearchRecipes
);
router.post(
  "/suggest-recipes",
  authMiddleware.protect,
  upload.single("image"),
  aiController.extractIngredientsFromImageAndSuggestRecipe
);

export default router;
