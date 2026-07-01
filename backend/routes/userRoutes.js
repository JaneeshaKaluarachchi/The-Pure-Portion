const express = require('express');
const router = express.Router();
const {
  registerHousehold,
  registerRestaurant,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register/household', registerHousehold);
router.post('/register/restaurant', registerRestaurant);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.get('/all', auth, getAllUsers);
router.delete('/:id', auth, deleteUser);

module.exports = router;