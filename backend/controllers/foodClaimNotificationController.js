const FoodClaimNotification = require('../models/FoodClaimNotification');
const Leftover = require('../models/Leftover');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new claim request notification
const createClaimRequest = async (req, res) => {
  try {
    const { leftoverId, name, phone, location, reason } = req.body;

    // Validate required fields
    if (!leftoverId || !name || !phone || !location || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate name (only letters and spaces)
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain letters and spaces'
      });
    }

    // Validate phone (exactly 10 digits)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Get leftover details
    const leftover = await Leftover.findById(leftoverId).populate('donorId');
    if (!leftover) {
      return res.status(404).json({
        success: false,
        message: 'Food donation not found'
      });
    }

    // Check if leftover is approved and not already claimed
    if (leftover.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This food donation is not available for claiming'
      });
    }

    // Check if user is trying to claim their own donation
    if (leftover.donorId._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot claim your own donation'
      });
    }

    // Check if user has already sent a pending claim request for this leftover
    const existingRequest = await FoodClaimNotification.findOne({
      leftoverId,
      requesterId: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending claim request for this donation'
      });
    }

    // Get requester details
    const requester = await User.findById(req.user.id);
    const requesterName = requester.firstName 
      ? `${requester.firstName} ${requester.lastName}` 
      : requester.restaurantName || requester.email;

    // Create claim request notification
    const claimNotification = new FoodClaimNotification({
      type: 'claim_request',
      leftoverId: leftover._id,
      leftoverName: leftover.name,
      donorId: leftover.donorId._id,
      donorName: leftover.donorName,
      requesterId: req.user.id,
      requesterName,
      claimDetails: {
        name,
        phone,
        location,
        reason
      },
      status: 'pending',
      priority: 'high'
    });

    await claimNotification.save();

    res.status(201).json({
      success: true,
      message: 'Claim request submitted successfully',
      notification: claimNotification
    });
  } catch (error) {
    console.error('Error creating claim request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit claim request',
      error: error.message
    });
  }
};

// Get all claim notifications for a user (as donor or requester)
const getClaimNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, status, limit = 50 } = req.query;

    let filter = {};
    
    // Filter by role (donor or requester)
    if (role === 'donor') {
      filter.donorId = userId;
    } else if (role === 'requester') {
      filter.requesterId = userId;
    } else {
      // Get both
      filter.$or = [{ donorId: userId }, { requesterId: userId }];
    }

    // Filter by status
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const notifications = await FoodClaimNotification.find(filter)
      .populate('leftoverId', 'name quantity unit category imageUrl expiryDate location')
      .populate('donorId', 'firstName lastName restaurantName email')
      .populate('requesterId', 'firstName lastName restaurantName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Count unread notifications
    const unreadCount = await FoodClaimNotification.countDocuments({
      ...filter,
      isRead: false
    });

    // Count by status for donor
    let statusCounts = null;
    if (role === 'donor' || !role) {
      statusCounts = {
        pending: await FoodClaimNotification.countDocuments({ donorId: userId, status: 'pending' }),
        approved: await FoodClaimNotification.countDocuments({ donorId: userId, status: 'approved' }),
        rejected: await FoodClaimNotification.countDocuments({ donorId: userId, status: 'rejected' })
      };
    }

    res.json({
      success: true,
      notifications,
      unreadCount,
      statusCounts
    });
  } catch (error) {
    console.error('Error fetching claim notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get a specific claim notification by ID
const getClaimNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FoodClaimNotification.findById(id)
      .populate('leftoverId', 'name quantity unit category imageUrl expiryDate location contactInfo pickupInstructions')
      .populate('donorId', 'firstName lastName restaurantName email phone')
      .populate('requesterId', 'firstName lastName restaurantName email phone');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is authorized to view this notification
    if (notification.donorId._id.toString() !== userId && 
        notification.requesterId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this notification'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

// Approve or reject a claim request (donor only)
const respondToClaimRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;
    const userId = req.user.id;

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    // If rejecting, rejection reason is required
    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the claim notification
    const claimNotification = await FoodClaimNotification.findById(id)
      .populate('leftoverId')
      .populate('requesterId');

    if (!claimNotification) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found'
      });
    }

    // Check if user is the donor
    if (claimNotification.donorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the donor can respond to this request'
      });
    }

    // Check if already responded
    if (claimNotification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This claim request has already been responded to'
      });
    }

    // Update claim notification
    if (action === 'approve') {
      claimNotification.status = 'approved';
      claimNotification.type = 'claim_approved';
      
      // Update leftover status to claimed
      const leftover = await Leftover.findById(claimNotification.leftoverId._id);
      if (leftover) {
        leftover.status = 'claimed';
        leftover.claimedBy = {
          userId: claimNotification.requesterId._id,
          userName: claimNotification.claimDetails.name,
          claimedAt: new Date()
        };
        await leftover.save();
      }

      // Create approval notification for requester
      const approvalNotification = new FoodClaimNotification({
        type: 'claim_approved',
        leftoverId: claimNotification.leftoverId._id,
        leftoverName: claimNotification.leftoverName,
        donorId: claimNotification.donorId,
        donorName: claimNotification.donorName,
        requesterId: claimNotification.requesterId._id,
        requesterName: claimNotification.requesterName,
        claimDetails: claimNotification.claimDetails,
        status: 'approved',
        priority: 'high'
      });
      await approvalNotification.save();

    } else if (action === 'reject') {
      claimNotification.status = 'rejected';
      claimNotification.type = 'claim_rejected';
      claimNotification.rejectionReason = rejectionReason;

      // Create rejection notification for requester
      const rejectionNotification = new FoodClaimNotification({
        type: 'claim_rejected',
        leftoverId: claimNotification.leftoverId._id,
        leftoverName: claimNotification.leftoverName,
        donorId: claimNotification.donorId,
        donorName: claimNotification.donorName,
        requesterId: claimNotification.requesterId._id,
        requesterName: claimNotification.requesterName,
        claimDetails: claimNotification.claimDetails,
        status: 'rejected',
        rejectionReason: rejectionReason,
        priority: 'medium'
      });
      await rejectionNotification.save();
    }

    claimNotification.respondedAt = new Date();
    await claimNotification.save();

    res.json({
      success: true,
      message: `Claim request ${action}d successfully`,
      notification: claimNotification
    });
  } catch (error) {
    console.error('Error responding to claim request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to claim request',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FoodClaimNotification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is authorized
    if (notification.donorId.toString() !== userId && 
        notification.requesterId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this notification'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query;

    let filter = { isRead: false };
    
    if (role === 'donor') {
      filter.donorId = userId;
    } else if (role === 'requester') {
      filter.requesterId = userId;
    } else {
      filter.$or = [{ donorId: userId }, { requesterId: userId }];
    }

    const result = await FoodClaimNotification.updateMany(
      filter,
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FoodClaimNotification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is authorized
    if (notification.donorId.toString() !== userId && 
        notification.requesterId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notification'
      });
    }

    await FoodClaimNotification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Check if user has a pending claim for a specific leftover
const checkPendingClaim = async (req, res) => {
  try {
    const { leftoverId } = req.params;
    const userId = req.user.id;

    const pendingClaim = await FoodClaimNotification.findOne({
      leftoverId,
      requesterId: userId,
      status: 'pending'
    });

    res.json({
      success: true,
      hasPendingClaim: !!pendingClaim,
      claimRequest: pendingClaim || null
    });
  } catch (error) {
    console.error('Error checking pending claim:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check pending claim',
      error: error.message
    });
  }
};

module.exports = {
  createClaimRequest,
  getClaimNotifications,
  getClaimNotificationById,
  respondToClaimRequest,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkPendingClaim
};
