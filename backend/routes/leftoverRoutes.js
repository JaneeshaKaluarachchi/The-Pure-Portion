const express = require('express');
const router = express.Router();
const {
  upload,
  getAllLeftovers,
  getUserLeftovers,
  createLeftover,
  claimLeftover,
  getPendingLeftovers,
  approveLeftover,
  chatWithAI,
  getChatHistory
} = require('../controllers/leftoverController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (with authentication)
router.get('/', authMiddleware, getAllLeftovers);
router.get('/my-leftovers', authMiddleware, getUserLeftovers);
router.post('/', authMiddleware, upload.single('image'), createLeftover);
router.post('/:id/claim', authMiddleware, claimLeftover);

// AI Chat routes
router.post('/chat', authMiddleware, chatWithAI);
router.get('/chat/:sessionId', authMiddleware, getChatHistory);

// Admin routes
router.get('/admin/pending', authMiddleware, getPendingLeftovers);
router.post('/admin/:id/approve', authMiddleware, approveLeftover);

module.exports = router;