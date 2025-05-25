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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = __importDefault(require("./config/supabase"));
const http_1 = __importDefault(require("http"));
const socketService_1 = require("./services/socketService");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const recipeRoutes_1 = __importDefault(require("./routes/recipeRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const ratingRoutes_1 = __importDefault(require("./routes/ratingRoutes"));
const aiController_1 = require("./controllers/aiController");
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
// Load environment variables
dotenv_1.default.config();
// Create and configure Express app
const createServer = () => {
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    // Initialize Socket.IO
    (0, socketService_1.initializeSocket)(server);
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.static('public'));
    app.use('/api/auth', authRoutes_1.default);
    app.use('/api/recipes', recipeRoutes_1.default);
    app.use('/api/users', userRoutes_1.default);
    app.use('/api/comments', commentRoutes_1.default);
    app.use('/api/ratings', ratingRoutes_1.default);
    app.use('/api/notifications', notificationRoutes_1.default);
    app.get('/', (req, res) => {
        res.send('API is running');
    });
    return { app, server };
};
exports.createServer = createServer;
const cleanupExpiredSessions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First invalidate expired sessions
        const { error: invalidateError } = yield supabase_1.default
            .from('sessions')
            .update({ is_valid: false })
            .lt('expires_at', new Date().toISOString())
            .eq('is_valid', true);
        if (invalidateError) {
            console.error('Error invalidating expired sessions:', invalidateError);
            return;
        }
        // Then delete the invalidated sessions
        const { error } = yield supabase_1.default
            .from('sessions')
            .delete()
            .eq('is_valid', false);
        if (error) {
            console.error('Error cleaning up expired sessions:', error);
        }
        else {
            console.log('Expired sessions cleaned up successfully');
        }
    }
    catch (err) {
        console.error('Session cleanup error:', err);
    }
});
// Start server only if this file is run directly (not imported)
if (require.main === module) {
    const { server } = (0, exports.createServer)();
    const PORT = process.env.PORT || 3000;
    const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '1440'); // Default: once a day (in minutes)
    setInterval(cleanupExpiredSessions, cleanupInterval * 60 * 1000);
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        // Run initial cleanup
        cleanupExpiredSessions();
        const recipeRAG = new aiController_1.RecipeVectorDB();
        recipeRAG.processExistingRecipes();
    });
}
