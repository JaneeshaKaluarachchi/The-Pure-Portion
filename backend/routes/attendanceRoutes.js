const express = require('express');
const router = express.Router();

const {
  clockInOut,
  getAttendance,
  getStaffAttendanceSummary,
  updateWorkHours,
  getTodayAttendance,
  generateAttendancePDF
} = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Clock in/out route
router.post('/clock', clockInOut);

// Get attendance records with filters
router.get('/', getAttendance);

// Get today's attendance for all staff
router.get('/today', getTodayAttendance);

// Generate PDF report
router.get('/pdf', generateAttendancePDF);

// Get individual staff attendance summary
router.get('/staff/:staffId', getStaffAttendanceSummary);

// Update work hours for overtime calculation
router.put('/work-hours', updateWorkHours);

module.exports = router;