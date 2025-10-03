const mongoose = require('mongoose');

const allowedCities = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle"
];

const leftoverSchema = new mongoose.Schema({
  leftoverId: {
    type: String,
    unique: true
  },
  // ✅ Food name validation
  name: {
    type: String,
    required: true,
    trim: true,
    match: [/^[A-Za-z\s]+$/, "Food name can only contain letters and spaces"]
  },
  description: {
    type: String,
    required: true
  },
  // ✅ Quantity must be > 0
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be greater than 0"]
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
  // ✅ Expiry date must be future
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v > new Date();
      },
      message: "Expiry date must be a future date"
    }
  },
  imageUrl: {
    type: String,
    default: ''
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
  // ✅ Address validation (House, Town, City)
  location: {
    address: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          const parts = v.split(',').map(p => p.trim());
          if (parts.length !== 3) return false;
          const city = parts[2];
          return allowedCities.includes(city);
        },
        message: props => `${props.value} is not a valid address (must be 'House, Town, City' and City must be valid)`
      }
    },
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'claimed', 'expired', 'rejected'],
    default: 'pending'
  },
  claimedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    claimedAt: Date
  },
  approvedBy: {
    adminId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
    adminName: String,
    approvedAt: Date
  },
  notes: { type: String, default: '' },
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
  pickupInstructions: { type: String, default: '' },
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
  targetOrganization: { type: String, default: '' },
  requesterName: { type: String, default: '' },
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
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantityUsed: Number
  }]
}, { timestamps: true });

// Generate unique leftover ID
leftoverSchema.pre('save', async function (next) {
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
leftoverSchema.index({ requestType: 1 });

module.exports = mongoose.model('Leftover', leftoverSchema);
