const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: String,
    unique: true // remove required, since we generate it
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: [
      'chef',
      'sous-chef',
      'cook',
      'waiter',
      'manager',
      'cashier',
      'cleaner',
      'helper',
      'supervisor',
      'other'
    ]
  },
  department: {
    type: String,
    required: true,
    enum: ['kitchen', 'service', 'management', 'cleaning', 'cashier']
  },
  salary: {
    type: Number,
    required: true
  },
  salaryType: {
    type: String,
    enum: ['monthly', 'daily', 'hourly'],
    default: 'monthly'
  },
  hireDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  workSchedule: {
    type: String,
    enum: ['full-time', 'part-time', 'contract'],
    default: 'full-time'
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchCode: String
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

// Auto-increment staff ID
staffSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      console.log('Generating staff ID for restaurant:', this.restaurantId);
      const lastStaff = await this.constructor
        .findOne({ restaurantId: this.restaurantId })
        .sort({ createdAt: -1 });

      if (lastStaff && lastStaff.staffId) {
        const lastId = parseInt(lastStaff.staffId.split('-')[1]);
        this.staffId = `STAFF-${(lastId + 1).toString().padStart(4, '0')}`;
      } else {
        this.staffId = 'STAFF-0001';
      }

      console.log('Generated staff ID:', this.staffId);
    }
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    console.error('Staff pre-save error:', error);
    next(error);
  }
});

module.exports = mongoose.model('Staff', staffSchema);
