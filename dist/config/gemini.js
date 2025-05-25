"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingModel = exports.gemini = void 0;
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.gemini = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
exports.embeddingModel = "gemini-embedding-exp-03-07";
