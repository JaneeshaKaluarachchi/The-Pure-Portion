const express = require('express');
const router = express.Router();
const {
  upload,
  getAllLeftovers,
  getUserLeftovers,
  getSoonToExpireItems,
  createLeftover,
  createDonationRequest,
  getDonationRequests,
  fulfillDonationRequest,
  claimLeftover,
  getPendingLeftovers,
  getPendingDonationRequests,
  approveLeftover,
  approveDonationRequest,
  chatWithAI,
  getChatHistory
} = require('../controllers/leftoverController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (with authentication)
router.get('/', authMiddleware, getAllLeftovers);
router.get('/my-leftovers', authMiddleware, getUserLeftovers);
router.get('/soon-to-expire', authMiddleware, getSoonToExpireItems);
router.post('/', authMiddleware, upload.single('image'), createLeftover);
router.post('/:id/claim', authMiddleware, claimLeftover);

// Donation request routes
router.post('/request', authMiddleware, createDonationRequest);
router.get('/requests', authMiddleware, getDonationRequests);
router.post('/requests/:requestId/fulfill', authMiddleware, fulfillDonationRequest);

// AI Chat routes
router.post('/chat', authMiddleware, chatWithAI);
router.get('/chat/:sessionId', authMiddleware, getChatHistory);

// Admin routes
router.get('/admin/pending', authMiddleware, getPendingLeftovers);
router.get('/admin/pending-requests', authMiddleware, getPendingDonationRequests);
router.post('/admin/:id/approve', authMiddleware, approveLeftover);
router.post('/admin/requests/:id/approve', authMiddleware, approveDonationRequest);

module.exports = router;