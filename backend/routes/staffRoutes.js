const express = require('express');
const router = express.Router();
const {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getStaffStats,
  upload
} = require('../controllers/staffController');
const auth = require('../middleware/auth');

// Middleware to check if user is restaurant owner
const checkRestaurantUser = (req, res, next) => {
  // Get user role from token or database
  // For now, we'll assume any authenticated user can access
  // In production, you should verify the user role
  next();
};

// Protected routes - require authentication
router.use(auth);
router.use(checkRestaurantUser);

// Staff CRUD routes
router.post('/', upload.single('profileImage'), addStaff);
router.get('/', getAllStaff);
router.get('/stats', getStaffStats);
router.get('/:id', getStaffById);
router.put('/:id', upload.single('profileImage'), updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;