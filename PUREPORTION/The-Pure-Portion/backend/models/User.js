const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Common fields for all users
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['household', 'restaurant', 'admin'],
    required: true
  },
  
  // Household user fields
  firstName: {
    type: String,
    required: function() { return this.role === 'household'; }
  },
  lastName: {
    type: String,
    required: function() { return this.role === 'household'; }
  },
  phone: {
    type: String,
    required: function() { return this.role === 'household'; }
  },
  address: {
    type: String,
    required: function() { return this.role === 'household'; }
  },
  familyMembers: {
    type: Number,
    required: function() { return this.role === 'household'; }
  },
  
  // Restaurant user fields
  restaurantName: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  restaurantType: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  restaurantAddress: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  restaurantPhone: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  businessRegistrationNo: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  ownerFirstName: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  ownerLastName: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  ownerPhone: {
    type: String,
    required: function() { return this.role === 'restaurant'; }
  },
  
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);