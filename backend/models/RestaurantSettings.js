const mongoose = require('mongoose');

const restaurantSettingsSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workingHours: {
    standardHours: {
      type: Number,
      default: 8,
      min: 1,
      max: 24
    },
    startTime: {
      type: String,
      default: '09:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      default: '17:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    breakTime: {
      type: Number,
      default: 1, // hours
      min: 0,
      max: 4
    }
  },
  overtimeSettings: {
    overtimeRate: {
      type: Number,
      default: 1.5, // 1.5x normal rate
      min: 1
    },
    maxOvertimePerDay: {
      type: Number,
      default: 4, // hours
      min: 0,
      max: 12
    }
  },
  attendanceSettings: {
    allowEarlyClockIn: {
      type: Number,
      default: 15, // minutes before start time
      min: 0,
      max: 60
    },
    allowLateClockOut: {
      type: Number,
      default: 30, // minutes after end time
      min: 0,
      max: 120
    },
    autoClockOutAfter: {
      type: Number,
      default: 12, // hours
      min: 8,
      max: 24
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

restaurantSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);