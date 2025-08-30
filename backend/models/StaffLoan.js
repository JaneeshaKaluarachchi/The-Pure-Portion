const mongoose = require('mongoose');

const staffLoanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'LOAN' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  loanTerm: {
    type: Number,
    required: true,
    min: 1 // months
  },
  monthlyInstallment: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'cancelled'],
    default: 'active'
  },
  paymentHistory: [{
    paymentDate: { type: Date, required: true },
    amountPaid: { type: Number, required: true },
    principalAmount: { type: Number, required: true },
    interestAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['salary_deduction', 'cash', 'bank_transfer'],
      default: 'salary_deduction'
    },
    notes: String
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvalDate: {
    type: Date,
    default: Date.now
  },
  guarantor: {
    name: String,
    phone: String,
    relationship: String
  },
  documents: [String],
  notes: String
}, {
  timestamps: true
});

// Calculate monthly installment before saving
staffLoanSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['loanAmount', 'interestRate', 'loanTerm'])) {
    const principal = this.loanAmount;
    const rate = this.interestRate / 100 / 12; // Monthly interest rate
    const term = this.loanTerm;
    
    if (rate > 0) {
      this.monthlyInstallment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
      this.totalAmount = this.monthlyInstallment * term;
    } else {
      this.monthlyInstallment = principal / term;
      this.totalAmount = principal;
    }
    
    this.remainingAmount = this.totalAmount - this.amountPaid;
    
    // Calculate end date
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + term);
    this.endDate = endDate;
  }
  next();
});

// Indexes
staffLoanSchema.index({ staffId: 1, status: 1 });
staffLoanSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('StaffLoan', staffLoanSchema);