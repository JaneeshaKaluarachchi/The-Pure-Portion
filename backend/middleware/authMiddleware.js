const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    // Handle admin token (use a valid ObjectId instead of 'admin')
    if (decoded.id === 'admin' || decoded.userId === 'admin') {
      const dummyAdminId = new mongoose.Types.ObjectId(); // dummy ObjectId
      req.user = {
        id: dummyAdminId,
        _id: dummyAdminId,
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        userType: 'admin'
      };
      return next();
    }

    // Find user in DB
    const userId = decoded.id || decoded.userId || decoded._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user ID is not valid'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    // Attach user to request, keep _id as ObjectId
    req.user = {
      id: user._id,
      _id: user._id,
      name: user.firstName ? `${user.firstName} ${user.lastName}` : user.restaurantName || user.email,
      email: user.email,
      role: user.role,
      userType: user.role // For backward compatibility
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = authMiddleware;
