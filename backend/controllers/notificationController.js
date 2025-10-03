  const Notification = require('../models/Notification');
  const mongoose = require('mongoose');

  // Create a new notification
  const createNotification = async (req, res) => {
    try {
      const { type, title, message, fromModule, toModule, relatedData, priority } = req.body;
      const restaurantId = new mongoose.Types.ObjectId(req.user.userId);

      const notification = new Notification({
        type,
        title,
        message,
        fromModule,
        toModule,
        restaurantId,
        relatedData,
        priority: priority || 'medium'
      });

      await notification.save();

      res.status(201).json({
        message: 'Notification created successfully',
        notification
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Get all notifications for a user/restaurant
  const getNotifications = async (req, res) => {
    try {
      const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
      const { module, isRead, limit = 50 } = req.query;

      let filter = { restaurantId };
      
      if (module) {
        filter.toModule = module;
      }
      
      if (isRead !== undefined) {
        filter.isRead = isRead === 'true';
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('relatedData.portionPlanId', 'name planId');

      const unreadCount = await Notification.countDocuments({
        restaurantId,
        isRead: false,
        ...(module && { toModule: module })
      });

      res.json({
        message: 'Notifications retrieved successfully',
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Mark notification as read
  const markAsRead = async (req, res) => {
    try {
      const { id } = req.params;
      const restaurantId = new mongoose.Types.ObjectId(req.user.userId);

      const notification = await Notification.findOneAndUpdate(
        { _id: id, restaurantId },
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Mark all notifications as read for a module
  const markAllAsRead = async (req, res) => {
    try {
      const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
      const { module } = req.query;

      let filter = { restaurantId, isRead: false };
      if (module) {
        filter.toModule = module;
      }

      const result = await Notification.updateMany(
        filter,
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      res.json({
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Delete notification
  const deleteNotification = async (req, res) => {
    try {
      const { id } = req.params;
      const restaurantId = new mongoose.Types.ObjectId(req.user.userId);

      const notification = await Notification.findOneAndDelete({
        _id: id,
        restaurantId
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Helper function to create notifications (used by other controllers)
  const createNotificationHelper = async (notificationData) => {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotificationHelper
  };