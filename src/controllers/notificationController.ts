import { Request, Response } from 'express';
import supabase from '../config/supabase';
import crypto from 'crypto';
import { RequestWithUser, Notification } from '../types';
import { sendNotificationToUser, isUserOnline } from '../services/socketService';

/**
 * Create a new notification
 * @param recipientId ID of the user who will receive the notification
 * @param senderId ID of the user who triggered the notification (optional)
 * @param type Type of notification (COMMENT, RATING, etc.)
 * @param content Text content of the notification
 * @param referenceId ID of the related entity (recipe, comment, etc.)
 * @param referenceType Type of the referenced entity (RECIPE, COMMENT, etc.)
 */
export const createNotification = async (
  recipientId: string,
  senderId: string | undefined,
  type: string,
  content: string,
  referenceId?: string,
  referenceType?: string
): Promise<void> => {
  try {
    // Don't create notification if sender is recipient
    if (senderId === recipientId) {
      return;
    }

    const notification: Notification = {
      id: crypto.randomUUID(),
      recipient_id: recipientId,
      sender_id: senderId,
      type,
      content,
      reference_id: referenceId,
      reference_type: referenceType,
      is_read: false,
      created_at: new Date().toISOString()
    };    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return;
    }

    // Send real-time notification through socket if user is online
    if (data && isUserOnline(recipientId)) {
      // Get sender info for richer notification
      let senderInfo = null;
      if (senderId) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, url_avatar')
          .eq('id', senderId)
          .single();
        
        if (userData) {
          senderInfo = userData;
        }
      }

      // Send notification with sender info
      sendNotificationToUser(recipientId, {
        ...data,
        sender: senderInfo
      });
    }
  } catch (err) {
    console.error('Error in createNotification:', err);
  }
};

// Get notifications for the current user
export const getUserNotifications = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to view notifications'
      });
      return;
    }    // Get the user's notifications
    const { data: notifications, error } = await supabase
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
    const notificationsWithSender = await Promise.all(notifications.map(async (notification) => {
      if (notification.sender_id) {
        // Get sender info
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, url_avatar')
          .eq('id', notification.sender_id)
          .single();
        
        if (userData) {
          return {
            ...notification,
            sender: userData
          };
        }
      }
      return notification;
    }));    res.status(200).json({
      status: 'success',
      results: notificationsWithSender.length,
      data: {
        notifications: notificationsWithSender
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching notifications'
    });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to update notifications'
      });
      return;
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
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
    const { error: updateError } = await supabase
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
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the notification'
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to update notifications'
      });
      return;
    }

    // Update all unread notifications
    const { error: updateError } = await supabase
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
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating notifications'
    });
  }
};

// Delete a notification
export const deleteNotification = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'You must be logged in to delete notifications'
      });
      return;
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
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
    const { error: deleteError } = await supabase
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
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the notification'
    });
  }
};
