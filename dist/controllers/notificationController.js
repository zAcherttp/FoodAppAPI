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
exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotification = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const crypto_1 = __importDefault(require("crypto"));
const socketService_1 = require("../services/socketService");
/**
 * Create a new notification
 * @param recipientId ID of the user who will receive the notification
 * @param senderId ID of the user who triggered the notification (optional)
 * @param type Type of notification (COMMENT, RATING, etc.)
 * @param content Text content of the notification
 * @param referenceId ID of the related entity (recipe, comment, etc.)
 * @param referenceType Type of the referenced entity (RECIPE, COMMENT, etc.)
 */
const createNotification = (recipientId, senderId, type, content, referenceId, referenceType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Don't create notification if sender is recipient
        if (senderId === recipientId) {
            return;
        }
        const notification = {
            id: crypto_1.default.randomUUID(),
            recipient_id: recipientId,
            sender_id: senderId,
            type,
            content,
            reference_id: referenceId,
            reference_type: referenceType,
            is_read: false,
            created_at: new Date().toISOString()
        };
        const { data, error } = yield supabase_1.default
            .from('notifications')
            .insert([notification])
            .select()
            .single();
        if (error) {
            console.error('Error creating notification:', error);
            return;
        }
        // Send real-time notification through socket if user is online
        if (data && (0, socketService_1.isUserOnline)(recipientId)) {
            // Get sender info for richer notification
            let senderInfo = null;
            if (senderId) {
                const { data: userData } = yield supabase_1.default
                    .from('users')
                    .select('id, name, url_avatar')
                    .eq('id', senderId)
                    .single();
                if (userData) {
                    senderInfo = userData;
                }
            }
            // Send notification with sender info
            (0, socketService_1.sendNotificationToUser)(recipientId, Object.assign(Object.assign({}, data), { sender: senderInfo }));
        }
    }
    catch (err) {
        console.error('Error in createNotification:', err);
    }
});
exports.createNotification = createNotification;
// Get notifications for the current user
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to view notifications'
            });
            return;
        } // Get the user's notifications
        const { data: notifications, error } = yield supabase_1.default
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching notifications'
            });
            return;
        }
        // Fetch sender information separately for each notification with a sender_id
        const notificationsWithSender = yield Promise.all(notifications.map((notification) => __awaiter(void 0, void 0, void 0, function* () {
            if (notification.sender_id) {
                // Get sender info
                const { data: userData } = yield supabase_1.default
                    .from('users')
                    .select('id, name, url_avatar')
                    .eq('id', notification.sender_id)
                    .single();
                if (userData) {
                    return Object.assign(Object.assign({}, notification), { sender: userData });
                }
            }
            return notification;
        })));
        res.status(200).json({
            status: 'success',
            results: notificationsWithSender.length,
            data: {
                notifications: notificationsWithSender
            }
        });
    }
    catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching notifications'
        });
    }
});
exports.getUserNotifications = getUserNotifications;
// Mark a notification as read
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { notificationId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to update notifications'
            });
            return;
        }
        // Check if notification exists and belongs to user
        const { data: notification, error: fetchError } = yield supabase_1.default
            .from('notifications')
            .select('*')
            .eq('id', notificationId)
            .eq('recipient_id', userId)
            .single();
        if (fetchError || !notification) {
            res.status(404).json({
                status: 'fail',
                message: 'Notification not found'
            });
            return;
        }
        // Update notification
        const { error: updateError } = yield supabase_1.default
            .from('notifications')
            .update({
            is_read: true,
            updated_at: new Date().toISOString()
        })
            .eq('id', notificationId);
        if (updateError) {
            console.error('Error updating notification:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating notification'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read'
        });
    }
    catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the notification'
        });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to update notifications'
            });
            return;
        }
        // Update all unread notifications
        const { error: updateError } = yield supabase_1.default
            .from('notifications')
            .update({
            is_read: true,
            updated_at: new Date().toISOString()
        })
            .eq('recipient_id', userId)
            .eq('is_read', false);
        if (updateError) {
            console.error('Error updating notifications:', updateError);
            res.status(500).json({
                status: 'error',
                message: 'Error updating notifications'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    }
    catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating notifications'
        });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete a notification
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { notificationId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                status: 'fail',
                message: 'You must be logged in to delete notifications'
            });
            return;
        }
        // Check if notification exists and belongs to user
        const { data: notification, error: fetchError } = yield supabase_1.default
            .from('notifications')
            .select('*')
            .eq('id', notificationId)
            .eq('recipient_id', userId)
            .single();
        if (fetchError || !notification) {
            res.status(404).json({
                status: 'fail',
                message: 'Notification not found'
            });
            return;
        }
        // Delete notification
        const { error: deleteError } = yield supabase_1.default
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        if (deleteError) {
            console.error('Error deleting notification:', deleteError);
            res.status(500).json({
                status: 'error',
                message: 'Error deleting notification'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Notification deleted successfully'
        });
    }
    catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the notification'
        });
    }
});
exports.deleteNotification = deleteNotification;
