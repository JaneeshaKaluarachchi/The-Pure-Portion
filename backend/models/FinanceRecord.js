const mongoose = require('mongoose');

const financeRecordSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple null values
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'staff_payment', 'bonus', 'loan', 'loan_repayment', 'inventory_cost']
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'sales', 'catering', 'delivery', 'other_income',
      // Expense categories
      'rent', 'utilities', 'marketing', 'maintenance', 'supplies', 'other_expense',
      // Staff payment categories
      'salary', 'bonus',
      // Loan categories
      'loan_disbursement', 'loan_payment',
      // Inventory
      'inventory_cost'
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: function() {
      // staffId is required only for staff-related transactions
      return ['staff_payment', 'bonus', 'loan', 'loan_repayment'].includes(this.type);
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'salary_deduction'],
    default: 'cash'
  },
  invoiceNumber: String,
  referenceNumber: String,
  notes: String,
  // Payment period fields (for staff payments)
  paymentMonth: {
    type: Number,
    min: 1,
    max: 12
  },
  paymentYear: {
    type: Number,
    min: 2020,
    max: 2100
  },
  // Payroll specific fields
  payrollDetails: {
    basicSalary: Number,
    overtime: Number,
    overtimeHours: Number,
    overtimeRate: Number,
    allowances: Number,
    deductions: Number,
    epfEmployee: Number,
    epfEmployer: Number,
    etf: Number,
    grossPay: Number,
    netPay: Number
  },
  // Bonus specific fields
  bonusDetails: {
    attendanceDays: Number,
    overtimeHours: Number,
    performanceRating: Number,
    calculationType: {
      type: String,
      enum: ['attendance', 'overtime', 'performance', 'fixed']
    },
    ratePerUnit: Number
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Generate unique record ID before saving
financeRecordSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.recordId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the last record for this restaurant this month
      const lastRecord = await this.constructor
        .findOne({ 
          restaurantId: this.restaurantId,
          recordId: { $regex: `^FR-${year}${month}-` }
        })
        .sort({ recordId: -1 });

      let sequence = 1;
      if (lastRecord && lastRecord.recordId) {
        const lastSequence = parseInt(lastRecord.recordId.split('-')[2]);
        sequence = lastSequence + 1;
      }

      this.recordId = `FR-${year}${month}-${String(sequence).padStart(4, '0')}`;
    }
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Index for better query performance
financeRecordSchema.index({ restaurantId: 1, date: -1 });
financeRecordSchema.index({ restaurantId: 1, type: 1 });
financeRecordSchema.index({ staffId: 1 });
financeRecordSchema.index({ recordId: 1 });

module.exports = mongoose.model('FinanceRecord', financeRecordSchema);