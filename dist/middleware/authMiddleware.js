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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = __importDefault(require("../config/supabase"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Get token and check if it exists
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please log in to get access.',
            });
            return;
        }
        // 2) Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // 3) Check if session exists and is valid
        const { data: session, error } = yield supabase_1.default
            .from('sessions')
            .select('*')
            .eq('id', decoded.sessionId)
            .eq('is_valid', true)
            .single();
        //console.log('Session data:', session);
        if (error || !session) {
            res.status(401).json({
                status: 'fail',
                message: 'Your session is no longer valid. Please log in again.',
            });
            return;
        }
        // 4) Check session expiration
        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        if (expiresAt < now) {
            // Invalidate expired session
            yield supabase_1.default
                .from('sessions')
                .update({ is_valid: false })
                .eq('id', session.id);
            res.status(401).json({
                status: 'fail',
                message: 'Your session has expired. Please log in again.',
            });
            return;
        }
        // 5) Verify token matches stored token
        if (session.token !== token) {
            res.status(401).json({
                status: 'fail',
                message: 'Invalid authorization. Please log in again.',
            });
            return;
        }
        // 6) Check if user still exists
        const { data: currentUser, error: userError } = yield supabase_1.default
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .single();
        if (userError || !currentUser) {
            res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists.',
            });
            return;
        }
        // 7) Store session and user on request
        req.session = session;
        req.user = currentUser;
        // Proceed to the protected route
        next();
    }
    catch (err) {
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token or authorization error',
        });
    }
});
exports.protect = protect;
