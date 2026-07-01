const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/staff-images';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper to parse nested fields
const parseStaffData = (body, file, restaurantId) => {
  const staffData = {
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    address: body.address,
    position: body.position,
    department: body.department,
    salary: Number(body.salary),
    salaryType: body.salaryType || 'monthly',
    hireDate: new Date(body.hireDate),
    workSchedule: body.workSchedule || 'full-time',
    isActive: true,
    emergencyContact: {
      name: body['emergencyContact.name'],
      phone: body['emergencyContact.phone'],
      relationship: body['emergencyContact.relationship']
    },
    bankDetails: {
      accountNumber: body['bankDetails.accountNumber'],
      bankName: body['bankDetails.bankName'],
      branchCode: body['bankDetails.branchCode']
    }
  };

  if (file) staffData.profileImage = file.filename;

  return staffData;
};

// Add staff
const addStaff = async (req, res) => {
  try {
    console.log('Add staff request received:', req.body);
    console.log('User from token:', req.user);

    const restaurantId = req.user.userId;
    const staffData = parseStaffData(req.body, req.file, restaurantId);

    const staff = new Staff(staffData);
    await staff.save();

    res.status(201).json({ message: 'Staff member added successfully', staff });
  } catch (error) {
    console.error('Add staff error:', error);
    if (req.file && fs.existsSync(path.join('uploads/staff-images', req.file.filename))) {
      fs.unlinkSync(path.join('uploads/staff-images', req.file.filename));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all staff
const getAllStaff = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const staff = await Staff.find({ restaurantId }).sort({ createdAt: -1 });
    res.json({ message: 'Staff retrieved successfully', staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single staff
const getStaffById = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const staff = await Staff.findOne({ _id: req.params.id, restaurantId });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ message: 'Staff member retrieved successfully', staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update staff
const updateStaff = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const staffId = req.params.id;

    const staff = await Staff.findOne({ _id: staffId, restaurantId });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    // Delete old image if new uploaded
    if (req.file && staff.profileImage) {
      const oldImagePath = path.join('uploads/staff-images', staff.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    // Check if this is a partial finance update (only salary, salaryType, bankDetails)
    const isFinanceUpdate = req.body.salary !== undefined && 
                           !req.body.firstName && 
                           !req.body.email;

    let updatedData;
    if (isFinanceUpdate) {
      // Handle partial finance update
      updatedData = {
        updatedAt: Date.now()
      };
      
      if (req.body.salary !== undefined) {
        updatedData.salary = Number(req.body.salary);
      }
      
      if (req.body.salaryType) {
        updatedData.salaryType = req.body.salaryType;
      }
      
      if (req.body.bankDetails) {
        updatedData.bankDetails = {
          accountNumber: req.body.bankDetails.accountNumber || staff.bankDetails?.accountNumber || '',
          bankName: req.body.bankDetails.bankName || staff.bankDetails?.bankName || '',
          branchCode: req.body.bankDetails.branchCode || staff.bankDetails?.branchCode || ''
        };
      }
    } else {
      // Handle full staff update
      updatedData = parseStaffData(req.body, req.file, req.user.userId);
      updatedData.updatedAt = Date.now();
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId, 
      updatedData, 
      { new: true, runValidators: true }
    );

    res.json({ message: 'Staff member updated successfully', staff: updatedStaff });
  } catch (error) {
    console.error('Update staff error:', error);
    if (req.file && fs.existsSync(path.join('uploads/staff-images', req.file.filename))) {
      fs.unlinkSync(path.join('uploads/staff-images', req.file.filename));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const staffId = req.params.id;

    const staff = await Staff.findOne({ _id: staffId, restaurantId });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    if (staff.profileImage) {
      const imagePath = path.join('uploads/staff-images', staff.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Staff.findByIdAndDelete(staffId);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Staff stats
const getStaffStats = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('Getting stats for restaurant:', restaurantId);
    
    const totalStaff = await Staff.countDocuments({ restaurantId, isActive: true });
    console.log('Total staff found:', totalStaff);
    
    const departmentStats = await Staff.aggregate([
      { $match: { restaurantId, isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    
    const positionStats = await Staff.aggregate([
      { $match: { restaurantId, isActive: true } },
      { $group: { _id: '$position', count: { $sum: 1 } } }
    ]);
    
    const totalMonthlySalary = await Staff.aggregate([
      { $match: { restaurantId, isActive: true, salaryType: 'monthly' } },
      { $group: { _id: null, total: { $sum: '$salary' } } }
    ]);

    console.log('Department stats:', departmentStats);
    console.log('Monthly salary total:', totalMonthlySalary);

    res.json({
      totalStaff,
      departmentStats,
      positionStats,
      totalMonthlySalary: totalMonthlySalary[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getStaffStats,
  upload
};