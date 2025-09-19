const Leftover = require('../models/Leftover');
const DonationRequest = require('../models/DonationRequest');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

// Configure multer for file uploads (images and documents)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'proofDocuments') {
      uploadPath = path.join(__dirname, '../uploads/documents');
    } else {
      uploadPath = path.join(__dirname, '../uploads/leftovers');
    }
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'proofDocuments' ? 'proof-' : 'leftover-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'proofDocuments') {
      // Allow documents for proof
      const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and image files are allowed for proof documents'));
      }
    } else {
      // Allow images for leftovers
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  }
});

// Get all approved leftovers/donation requests
const getAllLeftovers = async (req, res) => {
  try {
    const { 
      status = 'approved', 
      category, 
      location, 
      radius = 10, 
      page = 1, 
      limit = 20,
      sortBy = 'expiryDate',
      sortOrder = 'asc',
      type = 'all' // 'donation', 'request', or 'all'
    } = req.query;

    let query = { status };
    
    if (type !== 'all') {
      query.requestType = type;
    }
    
    if (category) {
      query.category = category;
    }

    // Location-based filtering (simplified without Google Maps)
    if (location) {
      // Simple text-based location search
      query['location.address'] = { $regex: location, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leftovers = await Leftover.find(query)
      .populate('donorId', 'firstName lastName restaurantName email role')
      .populate('claimedBy.userId', 'firstName lastName restaurantName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leftover.countDocuments(query);

    res.json({
      success: true,
      leftovers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching leftovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leftovers',
      error: error.message
    });
  }
};

// Get user's donated leftovers
const getUserLeftovers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const leftovers = await Leftover.find({ donorId: req.user.id })
      .populate('claimedBy.userId', 'firstName lastName restaurantName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leftover.countDocuments({ donorId: req.user.id });

    res.json({
      success: true,
      leftovers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user leftovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user leftovers',
      error: error.message
    });
  }
};

// Create new leftover donation
const createLeftover = async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      unit,
      category,
      expiryDate,
      address,
      coordinates,
      notes,
      nutritionalInfo,
      allergens,
      dietaryTags,
      pickupInstructions,
      contactInfo
    } = req.body;

    // Validate required fields
    if (!name || !description || !quantity || !unit || !category || !expiryDate || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const donorName = user.firstName
      ? `${user.firstName} ${user.lastName}`
      : user.restaurantName || user.email;

    const donorType = user.role || user.userType;

    // Parse coordinates if provided
    let parsedCoordinates = {};
    if (coordinates) {
      try {
        parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      } catch (err) {
        parsedCoordinates = {};
      }
    }

    const leftoverData = {
      name,
      description,
      quantity: parseFloat(quantity),
      unit,
      category,
      expiryDate: new Date(expiryDate),
      location: {
        address,
        geo: {
          type: 'Point',
          coordinates: [
            parsedCoordinates.lng || 0,
            parsedCoordinates.lat || 0
          ]
        }
      },
      donorId: req.user.id,
      donorName,
      donorType,
      notes,
      nutritionalInfo: nutritionalInfo ? (typeof nutritionalInfo === 'string' ? JSON.parse(nutritionalInfo) : nutritionalInfo) : {},
      allergens: allergens ? (typeof allergens === 'string' ? JSON.parse(allergens) : allergens) : [],
      dietaryTags: dietaryTags ? (typeof dietaryTags === 'string' ? JSON.parse(dietaryTags) : dietaryTags) : [],
      pickupInstructions,
      contactInfo: contactInfo ? (typeof contactInfo === 'string' ? JSON.parse(contactInfo) : contactInfo) : {},
      requestType: "donation"
    };

    // Add image URL if uploaded
    if (req.file) {
      leftoverData.imageUrl = `/uploads/leftovers/${req.file.filename}`;
    }

    const leftover = new Leftover(leftoverData);
    await leftover.save();

    res.status(201).json({
      success: true,
      message: "Leftover created successfully and pending admin approval",
      data: leftover
    });
  } catch (error) {
    console.error("Error creating leftover:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Create donation request
const createDonationRequest = async (req, res) => {
  try {
    const {
      requesterName,
      targetOrganization,
      organizationType,
      location,
      requestedItems,
      urgencyLevel,
      neededBy,
      description,
      contactInfo,
      purpose,
      notes
    } = req.body;

    // Validate required fields
    if (!requesterName || !targetOrganization || !organizationType || !location || 
        !requestedItems || !neededBy || !description || !contactInfo || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const requestData = {
      requesterName,
      requesterId: req.user.id,
      targetOrganization,
      organizationType,
      purpose,
      location: typeof location === 'string' ? JSON.parse(location) : location,
      requestedItems: typeof requestedItems === 'string' ? JSON.parse(requestedItems) : requestedItems,
      urgencyLevel: urgencyLevel || 'medium',
      neededBy: new Date(neededBy),
      description,
      contactInfo: typeof contactInfo === 'string' ? JSON.parse(contactInfo) : contactInfo,
      notes: notes || ''
    };

    // Handle proof documents if uploaded
    if (req.files && req.files.length > 0) {
      requestData.proofDocuments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    const donationRequest = new DonationRequest(requestData);
    await donationRequest.save();

    res.status(201).json({
      success: true,
      message: 'Donation request created successfully and pending admin approval',
      request: donationRequest
    });
  } catch (error) {
    console.error('Error creating donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create donation request',
      error: error.message
    });
  }
};

// Get all donation requests
const getDonationRequests = async (req, res) => {
  try {
    const { 
      status = 'approved', 
      location, 
      radius = 10, 
      page = 1, 
      limit = 20,
      urgency
    } = req.query;

    let query = { status };
    
    if (urgency) {
      query.urgencyLevel = urgency;
    }

    // Location-based filtering (simplified)
    if (location) {
      query['location.address'] = { $regex: location, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find(query)
      .populate('requesterId', 'firstName lastName email role')
      .sort({ urgencyLevel: -1, neededBy: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DonationRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching donation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation requests',
      error: error.message
    });
  }
};

// Fulfill donation request
const fulfillDonationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    let { items, inventoryItemIds } = req.body;

    const donationRequest = await DonationRequest.findById(requestId);
    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    if (donationRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Donation request is not approved'
      });
    }

    const user = await User.findById(req.user.id);

    // Ensure donationItems is an array
    let donationItems = [];
    if (items) {
      donationItems = typeof items === 'string' ? JSON.parse(items) : items;
      if (!Array.isArray(donationItems)) donationItems = [];
    }

    // Ensure inventoryIds is an array
    let inventoryIds = [];
    if (inventoryItemIds) {
      inventoryIds = typeof inventoryItemIds === 'string' ? JSON.parse(inventoryItemIds) : inventoryItemIds;
      if (!Array.isArray(inventoryIds)) inventoryIds = [];
    }

    // Process inventory deduction
    for (let i = 0; i < donationItems.length; i++) {
      const item = donationItems[i];
      if (inventoryIds[i]) {
        const inventoryItem = await Inventory.findById(inventoryIds[i]);
        if (inventoryItem && inventoryItem.restaurantId.toString() === req.user.id) {
          inventoryItem.currentQuantity = Math.max(0, inventoryItem.currentQuantity - (item.quantity || 0));
          await inventoryItem.save();
          item.inventoryId = inventoryIds[i];
        }
      }
    }

    const donorName = user.firstName ? `${user.firstName} ${user.lastName}` : user.restaurantName || user.email;

    // Add donation to request
    donationRequest.donations.push({
      donorId: req.user.id,
      donorName,
      items: donationItems,
      donatedAt: new Date(),
      status: 'pledged'
    });

    // Calculate fulfillment safely
    if (typeof donationRequest.calculateFulfillment === 'function') {
      donationRequest.calculateFulfillment();
    }

    // Update status if fully fulfilled
    if (donationRequest.totalFulfillment >= 100) {
      donationRequest.status = 'fulfilled';
    }

    await donationRequest.save();

    res.json({
      success: true,
      message: 'Donation pledged successfully',
      request: donationRequest
    });
  } catch (error) {
    console.error('Error fulfilling donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fulfill donation request',
      error: error.message
    });
  }
};

// Claim a leftover
const claimLeftover = async (req, res) => {
  try {
    const { id } = req.params;

    const leftover = await Leftover.findById(id);
    if (!leftover) {
      return res.status(404).json({
        success: false,
        message: 'Leftover not found'
      });
    }

    if (leftover.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Leftover is not available for claiming'
      });
    }

    if (leftover.donorId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot claim your own donation'
      });
    }

    const user = await User.findById(req.user.id);
    const userName = user.firstName ? `${user.firstName} ${user.lastName}` : user.restaurantName || user.email;
    
    leftover.status = 'claimed';
    leftover.claimedBy = {
      userId: req.user.id,
      userName: userName,
      claimedAt: new Date()
    };

    await leftover.save();

    res.json({
      success: true,
      message: 'Leftover claimed successfully',
      leftover
    });
  } catch (error) {
    console.error('Error claiming leftover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim leftover',
      error: error.message
    });
  }
};

// Admin functions
const getPendingLeftovers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { page = 1, limit = 20, type = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'pending' };
    if (type !== 'all') {
      query.requestType = type;
    }

    const leftovers = await Leftover.find(query)
      .populate('donorId', 'firstName lastName restaurantName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leftover.countDocuments(query);

    res.json({
      success: true,
      leftovers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending leftovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending leftovers',
      error: error.message
    });
  }
};

const getPendingDonationRequests = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find({ status: 'pending' })
      .populate('requesterId', 'firstName lastName email role')
      .sort({ urgencyLevel: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DonationRequest.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending donation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending donation requests',
      error: error.message
    });
  }
};

const approveLeftover = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { id } = req.params;
    const { action, reason } = req.body;

    const leftover = await Leftover.findById(id);
    if (!leftover) {
      return res.status(404).json({
        success: false,
        message: 'Leftover not found'
      });
    }

    if (leftover.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leftover is not pending approval'
      });
    }

const adminId = req.user._id; // must be a valid ObjectId
const adminName = req.user.name || 'Admin';

if (action === 'approve') {
  leftover.status = 'approved';
  leftover.approvedBy = {
    adminId: adminId, // must be ObjectId
    adminName,
    approvedAt: new Date()
  };
}
 else if (action === 'reject') {
      leftover.status = 'rejected';
      leftover.notes = reason || 'Rejected by admin';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    await leftover.save();

    res.json({
      success: true,
      message: `Leftover ${action}d successfully`,
      leftover
    });
    
  } catch (error) {
    console.error('Error updating leftover status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leftover status',
      error: error.message
    });
  }
};

const approveDonationRequest = async (req, res) => {
  try {
    // Only admins can approve/reject
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { id } = req.params;
    const { action, reason, adminNotes } = req.body;

    const donationRequest = await DonationRequest.findById(id);
    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    if (donationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Donation request is not pending approval'
      });
    }

    // Ensure adminId is a valid ObjectId
    const adminIdString = req.user._id || req.user.id;
    if (!adminIdString || !mongoose.Types.ObjectId.isValid(adminIdString)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID. Must be a valid ObjectId.'
      });
    }

    const adminId = new mongoose.Types.ObjectId(adminIdString);

    const adminName =
      req.user.firstName && req.user.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.name || 'Admin';

    if (action === 'approve') {
      donationRequest.status = 'approved';
      donationRequest.approvedBy = {
        adminId,
        adminName,
        approvedAt: new Date(),
        adminNotes: adminNotes || ''
      };
    } else if (action === 'reject') {
      donationRequest.status = 'rejected';
      donationRequest.rejectionReason = reason || 'Rejected by admin';
      donationRequest.approvedBy = {
        adminId,
        adminName,
        approvedAt: new Date(),
        adminNotes: adminNotes || ''
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"',
      });
    }

    await donationRequest.save();

    res.json({
      success: true,
      message: `Donation request ${action}d successfully`,
      request: donationRequest,
    });
  } catch (error) {
    console.error('Error updating donation request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation request status',
      error: error.message,
    });
  }
};



// Get dashboard statistics for admin
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const [
      totalLeftovers,
      pendingLeftovers,
      approvedLeftovers,
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalUsers
    ] = await Promise.all([
      Leftover.countDocuments(),
      Leftover.countDocuments({ status: 'pending' }),
      Leftover.countDocuments({ status: 'approved' }),
      DonationRequest.countDocuments(),
      DonationRequest.countDocuments({ status: 'pending' }),
      DonationRequest.countDocuments({ status: 'approved' }),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        leftovers: {
          total: totalLeftovers,
          pending: pendingLeftovers,
          approved: approvedLeftovers
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests
        },
        users: {
          total: totalUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  getAllLeftovers,
  getUserLeftovers,
  createLeftover,
  createDonationRequest,
  getDonationRequests,
  fulfillDonationRequest,
  claimLeftover,
  getPendingLeftovers,
  getPendingDonationRequests,
  approveLeftover,
  approveDonationRequest,
  getDashboardStats
};