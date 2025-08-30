const express = require('express');
const router = express.Router();
const {
  addInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getInventoryStats,
  getLowStockAlerts
} = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// Middleware to check if user is restaurant owner
const checkRestaurantUser = (req, res, next) => {
  // For now, we'll assume any authenticated user can access
  // In production, you should verify the user role
  next();
};

// Protected routes - require authentication
router.use(auth);
router.use(checkRestaurantUser);

// Inventory CRUD routes
router.post('/', addInventoryItem);
router.get('/', getAllInventoryItems);
router.get('/stats', getInventoryStats);
router.get('/alerts', getLowStockAlerts);
router.get('/:id', getInventoryItemById);
router.put('/:id', updateInventoryItem);
router.patch('/:id/stock', updateStock); // For stock in/out operations
router.delete('/:id', deleteInventoryItem);

module.exports = router;