const mongoose = require('mongoose');

const financeRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'FIN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'staff_payment', 'inventory_cost', 'bonus', 'loan', 'loan_repayment'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'sales', 'catering', 'delivery', 'other_income',
      'rent', 'utilities', 'marketing', 'maintenance', 'supplies', 'other_expense',
      'salary', 'epf', 'etf', 'bonus', 'loan_disbursement', 'loan_payment'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: function() {
      return ['staff_payment', 'bonus', 'loan', 'loan_repayment'].includes(this.type);
    }
  },
  payrollDetails: {
    basicSalary: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    epfEmployee: { type: Number, default: 0 },
    epfEmployer: { type: Number, default: 0 },
    etf: { type: Number, default: 0 },
    grossPay: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 }
  },
  invoiceNumber: String,
  referenceNumber: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'card', 'online'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  attachments: [String],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
financeRecordSchema.index({ restaurantId: 1, date: -1 });
financeRecordSchema.index({ type: 1, date: -1 });
financeRecordSchema.index({ staffId: 1, date: -1 });

// Virtual for monthly grouping
financeRecordSchema.virtual('monthYear').get(function() {
  return `${this.date.getFullYear()}-${String(this.date.getMonth() + 1).padStart(2, '0')}`;
});

module.exports = mongoose.model('FinanceRecord', financeRecordSchema);