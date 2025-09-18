const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const RestaurantSettings = require('../models/RestaurantSettings');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// Get restaurant settings helper
const getRestaurantSettings = async (restaurantId) => {
  let settings = await RestaurantSettings.findOne({ restaurantId });
  if (!settings) {
    settings = new RestaurantSettings({ restaurantId });
    await settings.save();
  }
  return settings;
};

// Clock in/out for staff
const clockInOut = async (req, res) => {
  try {
    const { staffId, action } = req.body; // action: 'in' or 'out'
    
    if (!staffId || !action) {
      return res.status(400).json({ message: 'Staff ID and action are required' });
    }

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Get restaurant settings
    const settings = await getRestaurantSettings(staff.restaurantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (action === 'in') {
      // Check if already clocked in today
      const existingAttendance = await Attendance.findOne({
        staffId,
        date: { $gte: today, $lt: tomorrow },
        status: 'in'
      });

      if (existingAttendance) {
        return res.status(400).json({ message: 'Already clocked in today' });
      }

      // Create new attendance record
      const attendance = new Attendance({
        staffId,
        date: new Date(),
        timeIn: new Date(),
        status: 'in'
      });

      await attendance.save();
      await attendance.populate('staffId', 'name email position');

      res.status(201).json({
        message: 'Clocked in successfully',
        attendance
      });

    } else if (action === 'out') {
      // Find today's attendance record that's still 'in'
      const attendance = await Attendance.findOne({
        staffId,
        date: { $gte: today, $lt: tomorrow },
        status: 'in'
      });

      if (!attendance) {
        return res.status(400).json({ message: 'No clock-in record found for today' });
      }

      // Update with clock-out time
      attendance.timeOut = new Date();
      attendance.status = 'out';
      attendance.calculateHours(settings.workingHours.standardHours);

      await attendance.save();
      await attendance.populate('staffId', 'name email position');

      res.json({
        message: 'Clocked out successfully',
        attendance
      });
    } else {
      res.status(400).json({ message: 'Invalid action. Use "in" or "out"' });
    }

  } catch (error) {
    console.error('Clock in/out error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance records with filters
const getAttendance = async (req, res) => {
  try {
    const { staffId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .populate('staffId', 'name email position')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: skip + attendance.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get individual staff attendance summary
const getStaffAttendanceSummary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { month, year } = req.query;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    let startDate, endDate;
    
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const attendance = await Attendance.find({
      staffId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Calculate summary statistics
    const totalDays = attendance.length;
    const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const totalOvertimeHours = attendance.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const daysPresent = attendance.filter(record => record.status !== 'absent').length;
    
    // Check current status (today's attendance)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.findOne({
      staffId,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      staff: {
        _id: staff._id,
        name: staff.firstName + ' ' + staff.lastName,
        email: staff.email,
        position: staff.position
      },
      summary: {
        totalDays,
        daysPresent,
        totalHours: Math.round(totalHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0
      },
      currentStatus: todayAttendance ? todayAttendance.status : 'not_clocked_in',
      todayAttendance,
      attendance,
      period: {
        startDate,
        endDate,
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear()
      }
    });

  } catch (error) {
    console.error('Get staff attendance summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate PDF report for attendance
const fs = require('fs');
const path = require('path');

const generateAttendancePDF = async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);

    // Build query
    let query = {};
    if (staffId) query.staffId = staffId;
    else {
      const restaurantStaff = await Staff.find({ restaurantId }, '_id');
      query.staffId = { $in: restaurantStaff.map(s => s._id) };
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('staffId', 'firstName lastName email position staffId')
      .sort({ 'staffId.firstName': 1, date: 1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for the specified criteria' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Attendance_Report_${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Add logo
    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 120 });

    // Title
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#2c3e50')
      .text('Staff Attendance Report', 0, 40, { align: 'right' });

    // Date/time
    const now = new Date();
    doc.fontSize(10).font('Helvetica').fillColor('black')
      .text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, { align: 'right' });

    if (startDate) doc.text(`From: ${new Date(startDate).toLocaleDateString()}`, { align: 'right' });
    if (endDate) doc.text(`To: ${new Date(endDate).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Summary section
    const totalRecords = attendanceRecords.length;
    const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const totalOvertime = attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    // Group by staff
    const staffGroups = {};
    attendanceRecords.forEach(record => {
      const staffKey = record.staffId._id.toString();
      if (!staffGroups[staffKey]) staffGroups[staffKey] = { staff: record.staffId, records: [] };
      staffGroups[staffKey].records.push(record);
    });

    let y = doc.y;
    const rowHeight = 15;

    const drawTableHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Date', 40, y)
        .text('Time In', 120, y)
        .text('Time Out', 190, y)
        .text('Total Hrs', 260, y)
        .text('Overtime', 330, y)
        .text('Status', 400, y);
      y += rowHeight;
    };

    const drawAttendanceRow = (record, alternate) => {
      if (alternate) doc.rect(35, y - 3, 520, rowHeight).fill('#f4f4f4');

      let statusColor = 'green';
      if (record.status === 'in') statusColor = 'orange';
      else if (record.status === 'not_clocked_in') statusColor = 'gray';

      doc.fillColor('black').font('Helvetica')
        .text(new Date(record.date).toLocaleDateString(), 40, y)
        .text(record.timeIn ? new Date(record.timeIn).toLocaleTimeString() : '-', 120, y)
        .text(record.timeOut ? new Date(record.timeOut).toLocaleTimeString() : '-', 190, y)
        .text(record.totalHours ? record.totalHours.toFixed(2) : '0', 260, y)
        .text(record.overtimeHours ? record.overtimeHours.toFixed(2) : '0', 330, y)
        .fillColor(statusColor)
        .text(record.status.toUpperCase(), 400, y);
      y += rowHeight;

      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
    };

    Object.values(staffGroups).forEach(group => {
      const { staff, records } = group;

      // Staff header
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
        .text(`${staff.firstName} ${staff.lastName} (${staff.staffId})`, 35, y, { underline: true });
      y += 20;

      // Staff summary
      const staffTotalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
      const staffOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
      const staffTotalDays = records.length;
      doc.fontSize(10).font('Helvetica').fillColor('#000')
        .text(`Total Days: ${staffTotalDays} | Total Hours: ${staffTotalHours.toFixed(2)} | Overtime: ${staffOvertime.toFixed(2)}`, 35, y);
      y += 20;

      drawTableHeader();
      records.forEach((rec, idx) => drawAttendanceRow(rec, idx % 2 === 0));
      y += 10;
    });

    // Footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('grey')
        .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 20, { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Update standard work hours (for overtime calculation)
const updateWorkHours = async (req, res) => {
  try {
    const { attendanceId, standardWorkHours } = req.body;
    
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.calculateHours(standardWorkHours);
    await attendance.save();

    res.json({
      message: 'Work hours updated successfully',
      attendance
    });

  } catch (error) {
    console.error('Update work hours error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get today's attendance status for all staff
const getTodayAttendance = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all staff
    const allStaff = await Staff.find({ restaurantId }, 'firstName lastName email position');
    
    // Get today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staffId', 'firstName lastName email position');

    // Combine staff with their attendance status
    const staffWithAttendance = allStaff.map(staff => {
      const attendance = todayAttendance.find(att => 
        att.staffId._id.toString() === staff._id.toString()
      );
      
      return {
        staff: {
          ...staff.toObject(),
          name: `${staff.firstName} ${staff.lastName}`
        },
        attendance: attendance || null,
        status: attendance ? attendance.status : 'not_clocked_in'
      };
    });

    res.json({
      date: today,
      staffAttendance: staffWithAttendance,
      summary: {
        total: allStaff.length,
        present: todayAttendance.filter(att => att.status === 'out').length,
        currentlyIn: todayAttendance.filter(att => att.status === 'in').length,
        notClockedIn: allStaff.length - todayAttendance.length
      }
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  clockInOut,
  getAttendance,
  getStaffAttendanceSummary,
  updateWorkHours,
  getTodayAttendance,
  generateAttendancePDF
};