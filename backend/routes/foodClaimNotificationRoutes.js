const express = require('express');
const router = express.Router();
const {
  createClaimRequest,
  getClaimNotifications,
  getClaimNotificationById,
  respondToClaimRequest,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkPendingClaim
} = require('../controllers/foodClaimNotificationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Create a new claim request
router.post('/claim-request', createClaimRequest);

// Get all claim notifications for current user
router.get('/', getClaimNotifications);

// Get a specific claim notification
router.get('/:id', getClaimNotificationById);

// Check if user has pending claim for specific leftover
router.get('/check-pending/:leftoverId', checkPendingClaim);

// Respond to a claim request (approve/reject) - donor only
router.post('/:id/respond', respondToClaimRequest);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
