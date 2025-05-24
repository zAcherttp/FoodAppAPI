import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

export const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const embeddingModel = "gemini-embedding-exp-03-07";
