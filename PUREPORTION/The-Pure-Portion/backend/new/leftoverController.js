const Leftover = require('../models/Leftover');
const DonationRequest = require('../models/DonationRequest');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

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
      type = 'all' 
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

    // -------------------- VALIDATIONS --------------------

    // Food name - only letters and spaces
    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Food name is required and can only contain letters and spaces"
      });
    }

    // Quantity > 0
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a number greater than 0"
      });
    }

    // Expiry date - cannot be past
    if (!expiryDate || new Date(expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date is required and cannot be in the past"
      });
    }

    // Pickup address validation
    const allowedCities = [
      "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
      "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
      "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
      "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
      "Monaragala", "Ratnapura", "Kegalle"
    ];

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Pickup address is required"
      });
    }

    const addressParts = address.split(",").map(v => v.trim());
    if (addressParts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Pickup address must be in format: 'House name, Town, City'"
      });
    }

    const city = addressParts[2];
    if (!allowedCities.includes(city)) {
      return res.status(400).json({
        success: false,
        message: `City '${city}' is not allowed. Allowed cities are: ${allowedCities.join(", ")}`
      });
    }

    // -------------------- USER VALIDATION --------------------
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
        parsedCoordinates = typeof coordinates === 'string'
          ? JSON.parse(coordinates)
          : coordinates;
      } catch (err) {
        parsedCoordinates = {};
      }
    }

    // -------------------- BUILD DATA --------------------
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
      nutritionalInfo: nutritionalInfo
        ? (typeof nutritionalInfo === 'string' ? JSON.parse(nutritionalInfo) : nutritionalInfo)
        : {},
      allergens: allergens
        ? (typeof allergens === 'string' ? JSON.parse(allergens) : allergens)
        : [],
      dietaryTags: dietaryTags
        ? (typeof dietaryTags === 'string' ? JSON.parse(dietaryTags) : dietaryTags)
        : [],
      pickupInstructions,
      contactInfo: contactInfo
        ? (typeof contactInfo === 'string' ? JSON.parse(contactInfo) : contactInfo)
        : {},
      requestType: "donation"
    };

    // Add image URL if uploaded
    if (req.file) {
      leftoverData.imageUrl = `/uploads/leftovers/${req.file.filename}`;
    }

    // -------------------- SAVE TO DB --------------------
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

const allowedCities = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle"
];

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

    // 🔹 1. Required fields check
    if (!requesterName || !targetOrganization || !organizationType || !location ||
        !requestedItems || !neededBy || !description || !contactInfo || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // 🔹 2. Validate requesterName
    if (!/^[A-Za-z\s]+$/.test(requesterName)) {
      return res.status(400).json({ success: false, message: "Requester name can only contain letters and spaces" });
    }

    // 🔹 3. Validate location
    const parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
    if (!parsedLocation.address) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }
    const parts = parsedLocation.address.split(",").map(p => p.trim());
    if (parts.length !== 3 || !allowedCities.includes(parts[2])) {
      return res.status(400).json({
        success: false,
        message: "Address must be in format 'House, Town, City' and City must be valid"
      });
    }

    // 🔹 4. Validate requested items
    const parsedItems = typeof requestedItems === "string" ? JSON.parse(requestedItems) : requestedItems;
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, message: "At least one requested item is required" });
    }
    for (let item of parsedItems) {
      if (!/^[A-Za-z\s]+$/.test(item.itemName)) {
        return res.status(400).json({ success: false, message: `Invalid item name: ${item.itemName}` });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Quantity must be greater than 0 for item: ${item.itemName}` });
      }
    }

    // 🔹 5. Validate neededBy (must be future date)
    const neededByDate = new Date(neededBy);
    if (neededByDate <= new Date()) {
      return res.status(400).json({ success: false, message: "Needed by date must be in the future" });
    }

    // 🔹 6. Validate contactInfo
    const parsedContact = typeof contactInfo === "string" ? JSON.parse(contactInfo) : contactInfo;
    if (!/^[0-9]{10}$/.test(parsedContact.phone)) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsedContact.email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // 🔹 7. Prepare request data
    const requestData = {
      requesterName,
      requesterId: req.user.id,
      targetOrganization,
      organizationType,
      purpose,
      location: parsedLocation,
      requestedItems: parsedItems,
      urgencyLevel: urgencyLevel || "medium",
      neededBy: neededByDate,
      description,
      contactInfo: parsedContact,
      notes: notes || ""
    };

    // 🔹 8. Handle proof documents (uploads)
    if (req.files && req.files.length > 0) {
      requestData.proofDocuments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    // 🔹 9. Save donation request
    const donationRequest = new DonationRequest(requestData);
    await donationRequest.save();

    res.status(201).json({
      success: true,
      message: "Donation request created successfully and pending admin approval",
      request: donationRequest
    });
  } catch (error) {
    console.error("Error creating donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create donation request",
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

// Generate PDF Report for Donations
const generateDonationsPDF = async (req, res) => {
  try {
    const filterStatus = req.query.status || 'all';
    const filterType = req.query.type || 'all'; // 'donations', 'requests', or 'all'
    
    // Attempt to get DB user id from auth middleware
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    
    // fetch user profile from DB (if available)
    let user = null;
    if (userId) {
      user = await User.findById(userId).lean();
    }

    // Fallbacks for different possible schema field names
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.restaurantName || user?.name || user?.businessName || 'User Name';
    const userAddress = user?.address || user?.restaurantAddress || user?.location || 'User Address';

    const now = new Date();

    // Build query for leftovers
    let leftoverQuery = {};
    if (userId) {
      leftoverQuery.donorId = userId; // Only get user's own donations
    }
    if (filterStatus !== 'all') {
      leftoverQuery.status = filterStatus;
    }

    // Build query for donation requests
    let requestQuery = {};
    if (userId) {
      requestQuery.requesterId = userId; // Only get user's own requests
    }
    if (filterStatus !== 'all') {
      requestQuery.status = filterStatus;
    }

    let leftovers = [];
    let donationRequests = [];

    // Fetch data based on filter type
    if (filterType === 'all' || filterType === 'donations') {
      leftovers = await Leftover.find(leftoverQuery)
        .populate('donorId', 'firstName lastName restaurantName email')
        .populate('claimedBy.userId', 'firstName lastName restaurantName')
        .sort({ createdAt: -1 });
    }

    if (filterType === 'all' || filterType === 'requests') {
      donationRequests = await DonationRequest.find(requestQuery)
        .populate('requesterId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    const totalDonations = leftovers.length;
    const totalRequests = donationRequests.length;
    const totalQuantity = leftovers.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Create PDF document
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Donations_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    // Logo (if exists)
      const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    try {
      await fs.access(logoPath);
      doc.image(logoPath, 40, 30, { width: 120 });
    } catch (error) {
      // Logo doesn't exist, skip it
    }

    // Top-right user info
    const margin = 40;
    const infoBoxWidth = 220;
    const infoX = doc.page.width - margin - infoBoxWidth;
    const infoY = 30;
    doc.fontSize(12).font('Helvetica-Bold').text(userName, infoX, infoY, { width: infoBoxWidth, align: 'right' });
    doc.fontSize(10).font('Helvetica').text(userAddress, infoX, infoY + 16, { width: infoBoxWidth, align: 'right' });

    // Title & date
    const titleY = infoY + 80;
    doc.fontSize(22).font('Helvetica-Bold').text('Donations Report', 0, titleY, { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 0, titleY + 24, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`Total Donations: ${totalDonations}   |   Total Requests: ${totalRequests}   |   Total Quantity: ${totalQuantity.toFixed(2)}`, { align: 'center' });
    doc.moveDown(2);

    let y = doc.y;
    const rowHeight = 18;
    const pageBottom = doc.page.height - 50;

    const addPageIfNeeded = (rowHeightNeeded) => {
      if (y + rowHeightNeeded > pageBottom) {
        doc.addPage();
        y = 50;
      }
    };

    // Donations Section
    if (leftovers.length > 0) {
      addPageIfNeeded(40);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50').text('MY DONATIONS', 40, y);
      y += 30;

      // Table header for donations
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Food Name', 40, y)
        .text('Qty', 180, y, { width: 40, align: 'right' })
        .text('Category', 230, y)
        .text('Status', 320, y)
        .text('Expires', 380, y)
        .text('Claimed By', 450, y, { width: 90, align: 'left' });
      y += rowHeight;

      leftovers.forEach((donation, index) => {
        const rowActualHeight = Math.max(rowHeight, doc.heightOfString(donation.name || '', { width: 140 }) + 4);
        addPageIfNeeded(rowActualHeight);

        if (index % 2 === 0) doc.rect(35, y - 3, 520, rowActualHeight).fill('#f4f4f4');

        let statusColor = 'green';
        if (donation.status === 'pending') statusColor = 'orange';
        else if (donation.status === 'rejected') statusColor = 'red';
        else if (donation.status === 'claimed') statusColor = 'blue';

        const claimedBy = donation.claimedBy?.userName || 'Not claimed';

        doc.fillColor('black').font('Helvetica')
          .text(donation.name || '', 40, y, { width: 140 })
          .text(`${(donation.quantity || 0).toFixed(1)} ${donation.unit || ''}`, 180, y, { width: 40, align: 'right' })
          .text(donation.category || '', 230, y, { width: 80 })
          .fillColor(statusColor)
          .text(donation.status || '', 320, y, { width: 50 })
          .fillColor('black')
          .text(donation.expiryDate ? new Date(donation.expiryDate).toLocaleDateString() : '', 380, y, { width: 60 })
          .text(claimedBy, 450, y, { width: 150 });

        y += rowActualHeight;
      });
      y += 20;
    }

    // Donation Requests Section
    if (donationRequests.length > 0) {
      addPageIfNeeded(40);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50').text('MY DONATION REQUESTS', 40, y);
      y += 30;

      // Table header for requests
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Organization', 40, y)
        .text('Type', 180, y)
        .text('Urgency', 240, y)
        .text('Status', 300, y)
        .text('Needed By', 360, y)
        .text('Fulfillment', 450, y, { width: 70, align: 'right' });
      y += rowHeight;

      donationRequests.forEach((request, index) => {
        const rowActualHeight = Math.max(rowHeight, doc.heightOfString(request.targetOrganization || '', { width: 130 }) + 4);
        addPageIfNeeded(rowActualHeight);

        if (index % 2 === 0) doc.rect(35, y - 3, 520, rowActualHeight).fill('#f4f4f4');

        let statusColor = 'green';
        if (request.status === 'pending') statusColor = 'orange';
        else if (request.status === 'rejected') statusColor = 'red';
        else if (request.status === 'fulfilled') statusColor = 'blue';

        let urgencyColor = 'green';
        if (request.urgencyLevel === 'high') urgencyColor = 'orange';
        else if (request.urgencyLevel === 'critical') urgencyColor = 'red';

        const fulfillment = request.totalFulfillment || 0;

        doc.fillColor('black').font('Helvetica')
          .text(request.targetOrganization || '', 40, y, { width: 130 })
          .text(request.organizationType || '', 180, y, { width: 50 })
          .fillColor(urgencyColor)
          .text(request.urgencyLevel || '', 240, y, { width: 50 })
          .fillColor(statusColor)
          .text(request.status || '', 300, y, { width: 50 })
          .fillColor('black')
          .text(request.neededBy ? new Date(request.neededBy).toLocaleDateString() : '', 360, y, { width: 80 })
          .text(`${fulfillment.toFixed(0)}%`, 450, y, { width: 70, align: 'right' });

        y += rowActualHeight;
      });
    }

    // Add signature section
    doc.moveDown(4);
    const signatureY = doc.page.height - 80;
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text("_________________________", 40, signatureY);
    doc.text("User's Signature", 80, signatureY + 15);

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
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

    // Simple fix: always use a valid ObjectId
    const adminId = new mongoose.Types.ObjectId(); // Creates a new valid ObjectId
    const adminName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.name || req.user.username || req.user.email || 'Admin';

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
  getDashboardStats,
  generateDonationsPDF
};