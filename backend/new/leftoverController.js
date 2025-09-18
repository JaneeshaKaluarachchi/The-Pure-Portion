const Leftover = require('../models/Leftover');
const DonationRequest = require('../models/DonationRequest');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/leftovers');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leftover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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

    // Location-based filtering
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        };
      }
    }

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leftovers = await Leftover.find(query)
      .populate('donorId', 'name userType')
      .populate('claimedBy.userId', 'name')
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
      .populate('claimedBy.userId', 'name userType')
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

// Get soon-to-expire inventory items for donation
const getSoonToExpireItems = async (req, res) => {
  try {
    const { days = 3 } = req.query;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + parseInt(days));

    const soonToExpireItems = await Inventory.find({
      restaurantId: req.user.id,
      expiryDate: { $lte: expiryThreshold },
      currentQuantity: { $gt: 0 },
      isActive: true
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      items: soonToExpireItems
    });
  } catch (error) {
    console.error('Error fetching soon-to-expire items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch soon-to-expire items',
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
      location,
      notes,
      nutritionalInfo,
      allergens,
      dietaryTags,
      pickupInstructions,
      contactInfo
    } = req.body;

    // Validate required fields
    if (!name || !description || !quantity || !unit || !category || !expiryDate || !location) {
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

let parsedLocation = {};
    try {
      parsedLocation = JSON.parse(location);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid location format"
      });
    }

    if (
      !parsedLocation.coordinates ||
      parsedLocation.coordinates.lat == null ||
      parsedLocation.coordinates.lng == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Location must include valid latitude and longitude"
      });
    }

    const geoLocation = {
      address: parsedLocation.address,
      type: "Point",
      coordinates: [
        parseFloat(parsedLocation.coordinates.lng),
        parseFloat(parsedLocation.coordinates.lat)
      ]
    };


   const leftoverData = {
      name,
      description,
      quantity: parseFloat(quantity),
      unit,
      category,
      expiryDate: new Date(expiryDate),
      location: geoLocation,
      donorId: req.user.id,
      donorName,
      donorType,
      notes,
      nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : {},
      allergens: allergens ? JSON.parse(allergens) : [],
      dietaryTags: dietaryTags ? JSON.parse(dietaryTags) : [],
      pickupInstructions,
      contactInfo: contactInfo ? JSON.parse(contactInfo) : {},
      requestType: "donation"
    };

    const newLeftover = new Leftover(leftoverData);
    await newLeftover.save();

    

    // Add image URL if uploaded
    if (req.file) {
      leftoverData.imageUrl = `/uploads/leftovers/${req.file.filename}`;
    }

    // Handle inventory items if provided
    if (inventoryItemIds && inventoryItemIds.length > 0) {
      const inventoryItems = [];
      const itemIds = JSON.parse(inventoryItemIds);
      
      for (const itemId of itemIds) {
        const inventoryItem = await Inventory.findById(itemId);
        if (inventoryItem && inventoryItem.restaurantId.toString() === req.user.id) {
          inventoryItems.push({
            inventoryId: itemId,
            quantityUsed: Math.min(inventoryItem.currentQuantity, parseFloat(quantity))
          });
        }
      }
      leftoverData.inventoryItems = inventoryItems;
    }

    const leftover = new Leftover(leftoverData);
    await leftover.save();

    res.status(201).json({
      success: true,
      message: "Leftover created successfully",
      data: newLeftover
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
      notes
    } = req.body;

    // Validate required fields
    if (!requesterName || !targetOrganization || !organizationType || !location || 
        !requestedItems || !neededBy || !description || !contactInfo) {
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
      location: JSON.parse(location),
      requestedItems: JSON.parse(requestedItems),
      urgencyLevel: urgencyLevel || 'medium',
      neededBy: new Date(neededBy),
      description,
      contactInfo: JSON.parse(contactInfo),
      notes: notes || ''
    };

    const donationRequest = new DonationRequest(requestData);
    await donationRequest.save();

    res.status(201).json({
      success: true,
      message: 'Donation request created successfully',
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

    // Location-based filtering
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000
          }
        };
      }
    }

    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find(query)
      .populate('requesterId', 'name userType')
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
    const { items, inventoryItemIds } = req.body; // items to donate and inventory IDs

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
    const donationItems = JSON.parse(items);
    const inventoryIds = inventoryItemIds ? JSON.parse(inventoryItemIds) : [];

    // Process inventory deduction
    for (let i = 0; i < donationItems.length; i++) {
      const item = donationItems[i];
      if (inventoryIds[i]) {
        const inventoryItem = await Inventory.findById(inventoryIds[i]);
        if (inventoryItem && inventoryItem.restaurantId.toString() === req.user.id) {
          // Deduct from inventory
          inventoryItem.currentQuantity = Math.max(0, inventoryItem.currentQuantity - item.quantity);
          await inventoryItem.save();
          
          // Add inventory reference to donation item
          item.inventoryId = inventoryIds[i];
        }
      }
    }

    // Add donation to request
    donationRequest.donations.push({
      donorId: req.user.id,
      donorName: user.name,
      items: donationItems,
      donatedAt: new Date(),
      status: 'pledged'
    });

    // Calculate fulfillment
    donationRequest.calculateFulfillment();
    
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
    
    leftover.status = 'claimed';
    leftover.claimedBy = {
      userId: req.user.id,
      userName: user.name,
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
    if (req.user.userType !== 'admin') {
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
      .populate('donorId', 'name userType email')
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
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find({ status: 'pending' })
      .populate('requesterId', 'name userType email')
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
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

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

    const admin = await User.findById(req.user.id);
    
    if (action === 'approve') {
      leftover.status = 'approved';
      leftover.approvedBy = {
        adminId: req.user.id,
        adminName: admin.name,
        approvedAt: new Date()
      };
    } else if (action === 'reject') {
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
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required.'
      });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

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

    const admin = await User.findById(req.user.id);
    
    if (action === 'approve') {
      donationRequest.status = 'approved';
      donationRequest.approvedBy = {
        adminId: req.user.id,
        adminName: admin.name,
        approvedAt: new Date()
      };
    } else if (action === 'reject') {
      donationRequest.status = 'rejected';
      donationRequest.notes = reason || 'Rejected by admin';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    await donationRequest.save();

    res.json({
      success: true,
      message: `Donation request ${action}d successfully`,
      request: donationRequest
    });
  } catch (error) {
    console.error('Error updating donation request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation request status',
      error: error.message
    });
  }
};

// AI Chat functions
const chatWithAI = async (req, res) => {
  try {
    const { message, sessionId, leftovers } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Message and session ID are required'
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      sessionId,
      userId: req.user.id,
      message,
      sender: 'user',
      context: { leftovers: leftovers || [] }
    });
    await userMessage.save();

    // Generate AI response (mock implementation)
    const aiResponse = await generateAIResponse(message, leftovers || []);

    // Save AI response
    const aiMessage = new ChatMessage({
      sessionId,
      userId: req.user.id,
      message: aiResponse.message,
      sender: 'ai',
      messageType: aiResponse.type,
      context: aiResponse.context,
      metadata: aiResponse.metadata
    });
    await aiMessage.save();

    res.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI chat',
      error: error.message
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      sessionId,
      userId: req.user.id
    })
    .sort({ createdAt: 1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
};

// Mock AI response generator
const generateAIResponse = async (message, leftovers) => {
  const startTime = Date.now();
  
  // Simple keyword-based responses (in production, use actual AI service)
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('recipe') || lowerMessage.includes('cook') || lowerMessage.includes('make')) {
    const recipes = generateRecipeSuggestions(leftovers);
    return {
      message: `Based on your leftovers, here are some recipe suggestions:\n\n${recipes.map((r, i) => 
        `${i + 1}. **${r.name}** (${r.difficulty}, ${r.cookTime})\n   Ingredients: ${r.ingredients.join(', ')}\n`
      ).join('\n')}`,
      type: 'recipe-suggestion',
      context: { suggestedRecipes: recipes },
      metadata: {
        responseTime: Date.now() - startTime,
        confidence: 0.8,
        source: 'recipe-database'
      }
    };
  } else if (lowerMessage.includes('nutrition') || lowerMessage.includes('healthy') || lowerMessage.includes('calories')) {
    return {
      message: `Here's some nutritional information about your leftovers:\n\n${leftovers.map(item => 
        `• **${item.name}**: Estimated ${Math.round(item.quantity * 50)} calories per ${item.unit}`
      ).join('\n')}\n\n💡 Tip: Combine vegetables with proteins for balanced meals!`,
      type: 'nutrition-info',
      context: { leftovers },
      metadata: {
        responseTime: Date.now() - startTime,
        confidence: 0.7,
        source: 'nutrition-database'
      }
    };
  } else if (lowerMessage.includes('storage') || lowerMessage.includes('preserve') || lowerMessage.includes('keep')) {
    return {
      message: `Here are some storage tips for your leftovers:\n\n🔸 **Refrigeration**: Most cooked leftovers last 3-4 days in the fridge\n🔸 **Freezing**: Many items can be frozen for 2-3 months\n🔸 **Containers**: Use airtight containers to maintain freshness\n🔸 **Labeling**: Always label with date and contents\n\nWould you like specific storage advice for any particular item?`,
      type: 'text',
      context: { leftovers },
      metadata: {
        responseTime: Date.now() - startTime,
        confidence: 0.9,
        source: 'food-safety-guidelines'
      }
    };
  } else {
    return {
      message: `I'm here to help you with leftover recipes and food management! You can ask me about:\n\n🍳 Recipe suggestions for your leftovers\n📊 Nutritional information\n🥫 Food storage tips\n♻️ Ways to reduce food waste\n\nWhat would you like to know?`,
      type: 'text',
      context: { leftovers },
      metadata: {
        responseTime: Date.now() - startTime,
        confidence: 0.6,
        source: 'general-help'
      }
    };
  }
};

const generateRecipeSuggestions = (leftovers) => {
  const recipes = [
    {
      name: 'Leftover Fried Rice',
      difficulty: 'Easy',
      cookTime: '15 mins',
      ingredients: ['rice', 'vegetables', 'soy sauce', 'eggs']
    },
    {
      name: 'Veggie Stir-fry',
      difficulty: 'Easy',
      cookTime: '10 mins',
      ingredients: ['mixed vegetables', 'garlic', 'oil', 'seasonings']
    },
    {
      name: 'Leftover Soup',
      difficulty: 'Medium',
      cookTime: '20 mins',
      ingredients: ['broth', 'leftover proteins', 'vegetables', 'herbs']
    },
    {
      name: 'Sandwich Wrap',
      difficulty: 'Easy',
      cookTime: '5 mins',
      ingredients: ['tortilla', 'leftover meats', 'vegetables', 'sauce']
    }
  ];
  
  // Filter based on available leftovers (simplified logic)
  const availableIngredients = leftovers.map(item => item.name.toLowerCase());
  
  return recipes.filter(recipe => 
    recipe.ingredients.some(ingredient => 
      availableIngredients.some(available => 
        available.includes(ingredient.split(' ')[0]) || 
        ingredient.includes(available.split(' ')[0])
      )
    )
  ).slice(0, 3);
};

module.exports = {
  upload,
  getAllLeftovers,
  getUserLeftovers,
  getSoonToExpireItems,
  createLeftover,
  createDonationRequest,
  getDonationRequests,
  fulfillDonationRequest,
  claimLeftover,
  getPendingLeftovers,
  getPendingDonationRequests,
  approveLeftover,
  approveDonationRequest,
  chatWithAI,
  getChatHistory
};