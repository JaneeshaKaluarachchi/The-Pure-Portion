const mongoose = require('mongoose');

const staffLoanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  loanAmount: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  interestRate: { type: Number, default: 0, min: 0, max: 100 },
  loanDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'defaulted'], default: 'active' },
  description: { type: String, trim: true },
  payments: [{
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    description: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate loanId before saving
staffLoanSchema.pre('save', async function(next) {
  if (!this.loanId) {
    this.loanId = `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
staffLoanSchema.index({ restaurantId: 1, staffId: 1 });
staffLoanSchema.index({ status: 1 });

module.exports = mongoose.model('StaffLoan', staffLoanSchema);
