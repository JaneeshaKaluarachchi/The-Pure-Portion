const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  requesterName: {
    type: String,
    required: true,
    trim: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetOrganization: {
    type: String,
    required: true,
    trim: true
  },
  organizationType: {
    type: String,
    enum: ['charity', 'elder-home', 'street-beggars', 'ngo', 'food-bank', 'shelter', 'school', 'hospital', 'other'],
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
  },
  requestedItems: [{
    itemName: {
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
      enum: ['cooked-meal', 'raw-ingredient', 'prepared-food', 'baked-goods', 'dairy', 'produce', 'other']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    notes: String
  }],
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  neededBy: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    alternateContact: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'both'],
      default: 'both'
    }
  },
  // Proof documents for official requests
  proofDocuments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isOfficialRequest: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'fulfilled', 'expired', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    approvedAt: Date,
    adminNotes: String
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  donations: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    donorName: String,
    items: [{
      itemName: String,
      quantity: Number,
      unit: String,
      inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
      }
    }],
    donatedAt: Date,
    status: {
      type: String,
      enum: ['pledged', 'confirmed', 'delivered'],
      default: 'pledged'
    },
    notes: String
  }],
  totalFulfillment: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  visibility: {
    type: String,
    enum: ['public', 'verified-only'],
    default: 'public'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generate unique request ID
donationRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestId) {
    const count = await mongoose.model('DonationRequest').countDocuments();
    this.requestId = `DR${String(count + 1).padStart(6, '0')}`;
  }
  
  // Check if request needs verification based on organization type
  const officialTypes = ['charity', 'ngo', 'food-bank', 'shelter', 'school', 'hospital'];
  this.isOfficialRequest = officialTypes.includes(this.organizationType);
  
  next();
});

// Calculate fulfillment percentage
donationRequestSchema.methods.calculateFulfillment = function() {
  let totalRequested = this.requestedItems.reduce((sum, item) => sum + item.quantity, 0);
  let totalDonated = 0;
  
  this.donations.forEach(donation => {
    if (donation.status === 'confirmed' || donation.status === 'delivered') {
      donation.items.forEach(item => {
        totalDonated += item.quantity;
      });
    }
  });
  
  this.totalFulfillment = totalRequested > 0 ? Math.min((totalDonated / totalRequested) * 100, 100) : 0;
  return this.totalFulfillment;
};

// Check if request needs official verification
donationRequestSchema.methods.requiresVerification = function() {
  const officialTypes = ['charity', 'ngo', 'food-bank', 'shelter', 'school', 'hospital'];
  return officialTypes.includes(this.organizationType);
};

// Index for efficient queries
donationRequestSchema.index({ status: 1, neededBy: 1 });
donationRequestSchema.index({ requesterId: 1 });
donationRequestSchema.index({ urgencyLevel: 1 });
donationRequestSchema.index({ organizationType: 1 });
donationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DonationRequest', donationRequestSchema);