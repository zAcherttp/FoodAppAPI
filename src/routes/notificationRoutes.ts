import express from 'express';
import * as notificationController from '../controllers/notificationController';
import * as authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware.protect);

// Get all notifications for the current user
router.get('/', notificationController.getUserNotifications);

// Mark a notification as read
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllNotificationsAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
