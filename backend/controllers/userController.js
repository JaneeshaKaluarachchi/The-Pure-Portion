const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId, userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register Household User
const registerHousehold = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, familyMembers, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new household user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      address,
      familyMembers,
      password,
      role: 'household'
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Household user registered successfully',
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register Restaurant User
const registerRestaurant = async (req, res) => {
  try {
    const { 
      restaurantName, 
      restaurantType, 
      restaurantAddress, 
      restaurantPhone, 
      businessRegistrationNo,
      ownerFirstName,
      ownerLastName,
      ownerPhone,
      email,
      password 
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new restaurant user
    const user = new User({
      restaurantName,
      restaurantType,
      restaurantAddress,
      restaurantPhone,
      businessRegistrationNo,
      ownerFirstName,
      ownerLastName,
      ownerPhone,
      email,
      password,
      role: 'restaurant'
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Restaurant user registered successfully',
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for admin credentials
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken('admin');
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: 'admin',
          email: process.env.ADMIN_EMAIL,
          role: 'admin'
        }
      });
    }
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Simple password check (not using bcrypt as requested)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        restaurantName: user.restaurantName,
        ownerFirstName: user.ownerFirstName,
        ownerLastName: user.ownerLastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    if (req.user.userId === 'admin') {
      return res.json({
        id: 'admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin'
      });
    }
    
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    if (req.user.userId === 'admin') {
      return res.status(400).json({ message: 'Admin profile cannot be updated' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { ...req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.userId !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete User (Admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.user.userId !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerHousehold,
  registerRestaurant,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser
};