const mongoose = require('mongoose');

const payrollScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'PAY' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payPeriod: {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true }
  },
  staffPayments: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    basicSalary: { type: Number, required: true },
    overtime: {
      hours: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    allowances: {
      transport: { type: Number, default: 0 },
      meal: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    bonuses: { type: Number, default: 0 },
    grossPay: { type: Number, required: true },
    deductions: {
      epfEmployee: { type: Number, default: 0 }, // 8% of basic salary
      loanDeduction: { type: Number, default: 0 },
      advance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    employerContributions: {
      epfEmployer: { type: Number, default: 0 }, // 12% of basic salary
      etf: { type: Number, default: 0 } // 3% of basic salary
    },
    netPay: { type: Number, required: true },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'check'],
      default: 'bank_transfer'
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid', 'cancelled'],
      default: 'draft'
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      branchCode: String
    },
    notes: String
  }],
  totalGrossPay: { type: Number, default: 0 },
  totalNetPay: { type: Number, default: 0 },
  totalEmployerContributions: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'approved', 'processed', 'completed'],
    default: 'draft'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  notes: String
}, {
  timestamps: true
});

// Calculate totals before saving
payrollScheduleSchema.pre('save', function(next) {
  let totalGross = 0;
  let totalNet = 0;
  let totalEmployer = 0;
  
  this.staffPayments.forEach(payment => {
    // Calculate EPF and ETF
    const basicSalary = payment.basicSalary;
    payment.deductions.epfEmployee = basicSalary * 0.08; // 8%
    payment.employerContributions.epfEmployer = basicSalary * 0.12; // 12%
    payment.employerContributions.etf = basicSalary * 0.03; // 3%
    
    // Calculate allowances total
    const allowances = payment.allowances;
    allowances.total = allowances.transport + allowances.meal + allowances.performance + allowances.other;
    
    // Calculate overtime
    payment.overtime.amount = payment.overtime.hours * payment.overtime.rate;
    
    // Calculate gross pay
    payment.grossPay = basicSalary + allowances.total + payment.overtime.amount + payment.bonuses;
    
    // Calculate total deductions
    const deductions = payment.deductions;
    deductions.total = deductions.epfEmployee + deductions.loanDeduction + deductions.advance + deductions.other;
    
    // Calculate net pay
    payment.netPay = payment.grossPay - deductions.total;
    
    // Add to totals
    totalGross += payment.grossPay;
    totalNet += payment.netPay;
    totalEmployer += payment.employerContributions.epfEmployer + payment.employerContributions.etf;
  });
  
  this.totalGrossPay = totalGross;
  this.totalNetPay = totalNet;
  this.totalEmployerContributions = totalEmployer;
  
  next();
});

// Indexes
payrollScheduleSchema.index({ restaurantId: 1, 'payPeriod.year': -1, 'payPeriod.month': -1 });
payrollScheduleSchema.index({ 'staffPayments.staffId': 1 });

module.exports = mongoose.model('PayrollSchedule', payrollScheduleSchema);