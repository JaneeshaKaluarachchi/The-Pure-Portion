const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const Notification = require('../models/Notification');
const { createNotificationHelper } = require('../controllers/notificationController');
const mongoose = require('mongoose');

/* ── When an inventory item is added or updated, check if it fulfils
   any pending ingredient in draft recipes for this restaurant.
   If it does, remove the match from pendingIngredients and, if the
   list is now empty, promote the recipe to active. ── */
const fulfillPendingIngredients = async (restaurantId, inventoryItemName) => {
  try {
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const invName = normalize(inventoryItemName);

    const draftRecipes = await Recipe.find({
      restaurantId,
      status: 'draft',
      'pendingIngredients.0': { $exists: true },
    });

    for (const recipe of draftRecipes) {
      const before = recipe.pendingIngredients.length;

      recipe.pendingIngredients = recipe.pendingIngredients.filter((p) => {
        const pName = normalize(p.name);
        // Remove if names are the same OR one contains the other
        return !(pName === invName || pName.includes(invName) || invName.includes(pName));
      });

      if (recipe.pendingIngredients.length === before) continue; // nothing removed

      const fulfilledCount = before - recipe.pendingIngredients.length;
      const isNowComplete = recipe.pendingIngredients.length === 0;

      if (isNowComplete) recipe.status = 'active';
      await recipe.save();

      // Notify recipe_management
      await new Notification({
        type: 'recipe_ingredients_fulfilled',
        title: isNowComplete
          ? `Recipe "${recipe.name}" is now ready`
          : `${fulfilledCount} ingredient${fulfilledCount > 1 ? 's' : ''} fulfilled in "${recipe.name}"`,
        message: isNowComplete
          ? `All missing ingredients for "${recipe.name}" (${recipe.recipeId}) have been added to inventory. The recipe is now active and available in the Portion Calculator.`
          : `"${inventoryItemName}" was added to inventory and matched ${fulfilledCount} pending ingredient${fulfilledCount > 1 ? 's' : ''} in recipe "${recipe.name}" (${recipe.recipeId}). ${recipe.pendingIngredients.length} ingredient${recipe.pendingIngredients.length > 1 ? 's' : ''} still pending.`,
        fromModule: 'inventory_management',
        toModule: 'recipe_management',
        restaurantId,
        priority: isNowComplete ? 'high' : 'medium',
        relatedData: {
          recipeName: recipe.name,
          recipeId: recipe.recipeId,
          missingIngredients: recipe.pendingIngredients.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unit: p.unit,
          })),
        },
      }).save();
    }
  } catch (err) {
    console.error('fulfillPendingIngredients error:', err.message);
  }
};

// Add inventory item
const addInventoryItem = async (req, res) => {
  try {
    console.log('Add inventory item request:', req.body);
    
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const costQty = Math.max(0.0001, Number(req.body.costQuantity) || 1);
    const itemData = {
      restaurantId,
      ...req.body,
      currentQuantity: Number(req.body.currentQuantity),
      minQuantity: Number(req.body.minQuantity),
      maxQuantity: req.body.maxQuantity ? Number(req.body.maxQuantity) : null,
      // Normalize: store cost per 1 unit regardless of how user entered it
      costPerUnit: Number(req.body.costPerUnit) / costQty,
      costQuantity: costQty,
      costUnit: req.body.costUnit || "kg",
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date()
    };

    const item = new Inventory(itemData);
    await item.save();

    // Check if this new item fulfils any pending recipe ingredients
    fulfillPendingIngredients(restaurantId, item.name);

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

    const costQty = Math.max(0.0001, Number(req.body.costQuantity) || 1);
    const updateData = {
      ...req.body,
      currentQuantity: Number(req.body.currentQuantity),
      minQuantity: Number(req.body.minQuantity),
      maxQuantity: req.body.maxQuantity ? Number(req.body.maxQuantity) : null,
      costPerUnit: Number(req.body.costPerUnit) / costQty,
      costQuantity: costQty,
      costUnit: req.body.costUnit || "kg",
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      updatedAt: Date.now()
    };

    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true, runValidators: true }
    );

    // Check if renaming or restocking fulfils any pending recipe ingredients
    fulfillPendingIngredients(restaurantId, updatedItem.name);

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

    const previousQuantity = item.currentQuantity;
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

    // Check if this is a restock operation that might resolve pending portion plans
    if (operation === 'add' && previousQuantity <= item.minQuantity && newQuantity > item.minQuantity) {
      // Create notification for successful restock
      await createNotificationHelper({
        type: 'inventory_restocked',
        title: 'Inventory Item Restocked',
        message: `${item.name} has been restocked. New quantity: ${newQuantity} ${item.unit}`,
        fromModule: 'inventory_management',
        toModule: 'portion_calculator',
        restaurantId: restaurantId,
        relatedData: {
          restockedItems: [{
            itemName: item.name,
            itemId: item.itemId,
            newQuantity: newQuantity,
            unit: item.unit
          }]
        },
        priority: 'medium'
      });
    }

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

// Get near-expiry inventory items (expiring within N days)
const getNearExpiryItems = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const items = await Inventory.find({
      restaurantId,
      isActive: true,
      expiryDate: { $gte: now, $lte: threshold },
      currentQuantity: { $gt: 0 }
    }).sort({ expiryDate: 1 });

    res.json({ items, count: items.length });
  } catch (error) {
    console.error('Near expiry error:', error);
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
  getLowStockAlerts,
  getNearExpiryItems
};