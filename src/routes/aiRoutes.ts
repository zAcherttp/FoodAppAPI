import express from "express";
import * as aiController from "../controllers/aiController";
import * as authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// AI routes
router.post("/search", authMiddleware.protect, aiController.searchRecipes);

export default router;
