const RestaurantSettings = require('../models/RestaurantSettings');
const mongoose = require('mongoose');

// Get restaurant settings
const getSettings = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    
    let settings = await RestaurantSettings.findOne({ restaurantId });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new RestaurantSettings({ restaurantId });
      await settings.save();
    }
    
    res.json({
      message: 'Settings retrieved successfully',
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update restaurant settings
const updateSettings = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const updateData = req.body;
    
    let settings = await RestaurantSettings.findOne({ restaurantId });
    
    if (!settings) {
      settings = new RestaurantSettings({ restaurantId, ...updateData });
    } else {
      // Update nested objects properly
      if (updateData.workingHours) {
        settings.workingHours = { ...settings.workingHours.toObject(), ...updateData.workingHours };
      }
      if (updateData.overtimeSettings) {
        settings.overtimeSettings = { ...settings.overtimeSettings.toObject(), ...updateData.overtimeSettings };
      }
      if (updateData.attendanceSettings) {
        settings.attendanceSettings = { ...settings.attendanceSettings.toObject(), ...updateData.attendanceSettings };
      }
    }
    
    await settings.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};