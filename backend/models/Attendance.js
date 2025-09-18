const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  timeIn: {
    type: Date,
    required: true
  },
  timeOut: {
    type: Date,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in', 'out', 'absent'],
    default: 'in'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ staffId: 1, date: 1 });

// Method to calculate total hours and overtime
attendanceSchema.methods.calculateHours = function(standardWorkHours = 8) {
  if (this.timeIn && this.timeOut) {
    const diffMs = this.timeOut - this.timeIn;
    const totalHours = diffMs / (1000 * 60 * 60); // Convert to hours
    this.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
    
    // Calculate overtime (hours beyond standard work hours)
    this.overtimeHours = Math.max(0, this.totalHours - standardWorkHours);
    this.overtimeHours = Math.round(this.overtimeHours * 100) / 100;
  }
  return this;
};

module.exports = mongoose.model('Attendance', attendanceSchema);