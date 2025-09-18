const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

// Add inventory item
const addInventoryItem = async (req, res) => {
  try {
    console.log('Add inventory item request:', req.body);
    
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const itemData = {
      restaurantId,
      ...req.body,
      currentQuantity: Number(req.body.currentQuantity),
      minQuantity: Number(req.body.minQuantity),
      maxQuantity: req.body.maxQuantity ? Number(req.body.maxQuantity) : null,
      costPerUnit: Number(req.body.costPerUnit),
       costUnit: req.body.costUnit || "kg",
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date()
    };

    const item = new Inventory(itemData);
    await item.save();

    res.status(201).json({
      message: 'Inventory item added successfully',
      item
    });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all inventory items
const getAllInventoryItems = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const { category, status, search } = req.query;
    
    let filter = { restaurantId, isActive: true };
    
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Inventory.find(filter).sort({ createdAt: -1 });
    
    res.json({
      message: 'Inventory items retrieved successfully',
      items
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single inventory item
const getInventoryItemById = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const item = await Inventory.findOne({ _id: req.params.id, restaurantId });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({
      message: 'Inventory item retrieved successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const itemId = req.params.id;

    const item = await Inventory.findOne({ _id: itemId, restaurantId });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const updateData = {
      ...req.body,
      currentQuantity: Number(req.body.currentQuantity),
      minQuantity: Number(req.body.minQuantity),
      maxQuantity: req.body.maxQuantity ? Number(req.body.maxQuantity) : null,
      costPerUnit: Number(req.body.costPerUnit),
      costUnit: req.body.costUnit || "kg",
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      updatedAt: Date.now()
    };

    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const itemId = req.params.id;

    const item = await Inventory.findOne({ _id: itemId, restaurantId });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await Inventory.findByIdAndDelete(itemId);

    res.json({
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update stock quantity (for stock in/out operations)
const updateStock = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const itemId = req.params.id;
    const { quantity, operation, reason } = req.body; // operation: 'add' or 'subtract'

    const item = await Inventory.findOne({ _id: itemId, restaurantId });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    let newQuantity;
    if (operation === 'add') {
      newQuantity = item.currentQuantity + Number(quantity);
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, item.currentQuantity - Number(quantity));
    } else {
      return res.status(400).json({ message: 'Invalid operation. Use "add" or "subtract"' });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      { 
        currentQuantity: newQuantity,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: `Stock ${operation}ed successfully`,
      item: updatedItem,
      operation,
      quantity: Number(quantity),
      reason
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper: normalize units
const normalizeQuantity = (quantity, unit) => {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "g": return q / 1000;  // grams → kg
    case "kg": return q;
    case "ml": return q / 1000; // ml → liters
    case "l": return q;
    case "pieces":
    case "packs":
    case "bottles":
    case "cans":
    case "boxes":
      return q;
    default: return q;
  }
};

// Get inventory statistics (FIXED)
const getInventoryStats = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);

    const items = await Inventory.find({ restaurantId, isActive: true });

    // ✅ Count total items
    const totalItems = items.length;

    // ✅ Calculate total value with proper unit conversion
    const totalValue = items.reduce((sum, item) => {
      const normalizedQty = normalizeQuantity(item.currentQuantity, item.unit);
      return sum + (normalizedQty * item.costPerUnit);
    }, 0);

    // ✅ Status stats
    const statusStats = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    // ✅ Category stats
    const categoryStats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    // ✅ Low stock items
    const lowStockItems = items.filter(item => item.currentQuantity <= item.minQuantity);

    // ✅ Expiring soon items (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringItems = items.filter(item =>
      item.expiryDate &&
      item.expiryDate >= new Date() &&
      item.expiryDate <= sevenDaysFromNow
    );

    res.json({
      totalItems,
      statusStats,
      categoryStats,
      totalValue,
      lowStockItems,
      expiringItems,
      alerts: {
        lowStock: lowStockItems.length,
        expiringSoon: expiringItems.length,
      },
    });
  } catch (error) {
    console.error("Inventory stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    
    const lowStockItems = await Inventory.find({
      restaurantId,
      isActive: true,
      $expr: { $lte: ['$currentQuantity', '$minQuantity'] }
    }).sort({ currentQuantity: 1 });

    res.json({
      message: 'Low stock alerts retrieved successfully',
      alerts: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getInventoryStats,
  getLowStockAlerts
};