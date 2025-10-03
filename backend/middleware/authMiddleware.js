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

    // ✅ If admin token is detected
    if (decoded.id === 'admin' || decoded.userId === 'admin') {
      // Check if we already have an admin user in DB
      let adminUser = await User.findOne({ role: 'admin', email: process.env.ADMIN_EMAIL });

      // If not, create a dedicated admin record
      if (!adminUser) {
        adminUser = new User({
          firstName: 'System',
          lastName: 'Admin',
          email: process.env.ADMIN_EMAIL,
          password: 'not_used', // won’t be used for login since you’re JWT-based
          role: 'admin'
        });
        await adminUser.save();
      }

      req.user = {
        id: adminUser._id.toString(),  // ✅ real ObjectId
        _id: adminUser._id.toString(),
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        role: 'admin',
        userType: 'admin'
      };
      return next();
    }

    // ✅ Normal user flow
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
      userType: user.role // backward compatibility
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
