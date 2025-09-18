const mongoose = require('mongoose');

const leftoverSchema = new mongoose.Schema({
  leftoverId: {
    type: String,
    unique: true
    // No required, pre-save hook generates it
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pieces', 'portions', 'plates', 'bowls']
  },
  category: {
    type: String,
    required: true,
    enum: ['cooked-meal', 'raw-ingredient', 'prepared-food', 'baked-goods', 'dairy', 'produce', 'other']
  },
  expiryDate: {
    type: Date,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },

  // ✅ Fixed location schema (GeoJSON + address)
  location: {
    address: { type: String, required: true },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    }
  },

  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  donorType: {
    type: String,
    enum: ['restaurant', 'household', 'organization'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'claimed', 'expired', 'rejected'],
    default: 'pending'
  },
  claimedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    claimedAt: Date
  },
  approvedBy: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    approvedAt: Date
  },
  notes: {
    type: String,
    default: ''
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish', 'sesame']
  }],
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher', 'organic']
  }],
  pickupInstructions: {
    type: String,
    default: ''
  },
  contactInfo: {
    phone: String,
    email: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'app'],
      default: 'app'
    }
  },
  requestType: {
    type: String,
    enum: ['donation', 'request'],
    default: 'donation'
  },
  targetOrganization: {
    type: String,
    default: ''
  },
  requesterName: {
    type: String,
    default: ''
  },
  requestedItems: [{
    itemName: String,
    quantity: Number,
    unit: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],
  inventoryItems: [{
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    quantityUsed: Number
  }]
}, {
  timestamps: true
});

// Generate unique leftover ID
leftoverSchema.pre('save', async function(next) {
  if (this.isNew && !this.leftoverId) {
    const count = await mongoose.model('Leftover').countDocuments();
    this.leftoverId = `LO${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
leftoverSchema.index({ status: 1, expiryDate: 1 });
leftoverSchema.index({ donorId: 1 });
leftoverSchema.index({ category: 1 });
leftoverSchema.index({ "location.geo": "2dsphere" }); // ✅ fixed
leftoverSchema.index({ requestType: 1 });

module.exports = mongoose.model('Leftover', leftoverSchema);
