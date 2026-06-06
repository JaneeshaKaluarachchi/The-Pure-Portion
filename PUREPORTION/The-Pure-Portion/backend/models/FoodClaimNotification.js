const mongoose = require('mongoose');

const foodClaimNotificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'claim_request',        // User requests to claim food
      'claim_approved',       // Donor approves the request
      'claim_rejected'        // Donor rejects the request
    ]
  },
  // The leftover/food donation being claimed
  leftoverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leftover',
    required: true
  },
  leftoverName: {
    type: String,
    required: true
  },
  // Donor information
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  // Requester information
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  // Claim request details
  claimDetails: {
    name: {
      type: String,
      required: true,
      match: [/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"]
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"]
    },
    location: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  },
  // Status of the claim
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Rejection reason (if applicable)
  rejectionReason: {
    type: String,
    default: ''
  },
  // Notification metadata
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  },
  respondedAt: {
    type: Date
  }
}, { timestamps: true });

// Auto-generate notificationId before validation
foodClaimNotificationSchema.pre('validate', async function(next) {
  if (this.isNew && !this.notificationId) {
    try {
      const lastNotification = await this.constructor.findOne().sort({ createdAt: -1 });
      if (lastNotification && lastNotification.notificationId) {
        const lastId = parseInt(lastNotification.notificationId.split('-')[1]);
        this.notificationId = `FCN-${(lastId + 1).toString().padStart(6, '0')}`;
      } else {
        this.notificationId = 'FCN-000001';
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Indexes for better query performance
foodClaimNotificationSchema.index({ donorId: 1, isRead: 1 });
foodClaimNotificationSchema.index({ requesterId: 1, isRead: 1 });
foodClaimNotificationSchema.index({ leftoverId: 1 });
foodClaimNotificationSchema.index({ status: 1 });
foodClaimNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FoodClaimNotification', foodClaimNotificationSchema);
