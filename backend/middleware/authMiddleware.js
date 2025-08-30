const jwt = require('jsonwebtoken');
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
    
    // Handle admin token
    if (decoded.id === 'admin' || decoded.userId === 'admin') {
      req.user = {
        id: 'admin',
        _id: 'admin',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        userType: 'admin'
      };
      return next();
    }
    
    // Find user and attach to request
    const user = await User.findById(decoded.id || decoded.userId || decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
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