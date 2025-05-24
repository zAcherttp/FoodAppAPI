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
exports.getSocketIO = exports.isUserOnline = exports.sendNotificationToUser = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = __importDefault(require("../config/supabase"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Map of userId to socket connections
const userSocketMap = new Map();
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // In production, specify actual origins
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log('New socket connection:', socket.id);
        // Authenticate user with token
        socket.on('authenticate', (token) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                if (!token || !process.env.JWT_SECRET) {
                    socket.emit('authentication_error', 'No token provided or JWT secret missing');
                    return;
                }
                // Verify JWT token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                // Check if user exists
                const { data: user, error } = yield supabase_1.default
                    .from('users')
                    .select('id')
                    .eq('id', userId)
                    .single();
                if (error || !user) {
                    socket.emit('authentication_error', 'User not found');
                    return;
                }
                // Associate socket with user
                socket.data.userId = userId;
                // Add socket to user's socket list
                if (!userSocketMap.has(userId)) {
                    userSocketMap.set(userId, []);
                }
                (_a = userSocketMap.get(userId)) === null || _a === void 0 ? void 0 : _a.push(socket.id);
                socket.emit('authenticated', { userId });
                console.log(`Socket ${socket.id} authenticated for user ${userId}`);
                // Join user's private room for notifications
                socket.join(`user:${userId}`);
            }
            catch (err) {
                console.error('Socket authentication error:', err);
                socket.emit('authentication_error', 'Invalid token');
            }
        }));
        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId) {
                // Remove this socket from user's socket list
                const userSockets = userSocketMap.get(userId) || [];
                const updatedSockets = userSockets.filter(id => id !== socket.id);
                if (updatedSockets.length > 0) {
                    userSocketMap.set(userId, updatedSockets);
                }
                else {
                    userSocketMap.delete(userId);
                }
                console.log(`Socket ${socket.id} disconnected for user ${userId}`);
            }
        });
    });
    console.log('Socket.IO initialized');
};
exports.initializeSocket = initializeSocket;
// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('new_notification', notification);
        console.log(`Notification sent to user ${userId}`);
    }
};
exports.sendNotificationToUser = sendNotificationToUser;
// Check if a user is online
const isUserOnline = (userId) => {
    var _a;
    return userSocketMap.has(userId) && (((_a = userSocketMap.get(userId)) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0;
};
exports.isUserOnline = isUserOnline;
// Get socket service instance
const getSocketIO = () => {
    return io;
};
exports.getSocketIO = getSocketIO;
