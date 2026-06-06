const PortionPlan = require('../models/PortionPlan');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotificationHelper } = require('../controllers/notificationController');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');




// Helper function to convert units
const convertToStandardUnit = (quantity, fromUnit, toUnit) => {
  // Define conversion factors to grams (base unit)
  const toGrams = {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'kilogram': 1000,
    'kilograms': 1000,
    'ml': 1, // For liquids, treat ml as equivalent to grams
    'l': 1000,
    'liter': 1000,
    'liters': 1000,
    'cup': 240, // Approximate
    'tbsp': 15,
    'tsp': 5,
    'oz': 28.35,
    'lb': 453.59,
    'pound': 453.59,
    'pounds': 453.59
  };

  const fromGrams = {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 0.001,
    'kilogram': 0.001,
    'kilograms': 0.001,
    'ml': 1,
    'l': 0.001,
    'liter': 0.001,
    'liters': 0.001,
    'cup': 1/240,
    'tbsp': 1/15,
    'tsp': 1/5,
    'oz': 1/28.35,
    'lb': 1/453.59,
    'pound': 1/453.59,
    'pounds': 1/453.59
  };

  // Normalize unit names
  const normalizeUnit = (unit) => {
    return unit.toLowerCase().trim();
  };

  const normalizedFromUnit = normalizeUnit(fromUnit);
  const normalizedToUnit = normalizeUnit(toUnit);

  // If units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return quantity;
  }

  // Convert to grams first, then to target unit
  const quantityInGrams = quantity * (toGrams[normalizedFromUnit] || 1);
  const convertedQuantity = quantityInGrams * (fromGrams[normalizedToUnit] || 1);

  return convertedQuantity;
};

// Create portion plan
const createPortionPlan = async (req, res) => {
  try {
    console.log('Create portion plan request:', req.body);
    
    const { name, mainMeal, curries, peopleCount, userType } = req.body;
    const restaurantId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    console.log('Restaurant ID from token:', restaurantId);

    // Validate main meal recipe
    const mainMealRecipe = await Recipe.findById(mainMeal.recipeId)
    .populate('ingredients.inventoryItemId');
    if (!mainMealRecipe) {
      return res.status(404).json({ message: 'Main meal recipe not found' });
    }

    // Validate curry recipes
    const curryRecipes = await Recipe.find({ 
      _id: { $in: curries.map(curry => curry.recipeId) } 
    }).populate('ingredients.inventoryItemId');
    
    if (curryRecipes.length !== curries.length) {
      return res.status(404).json({ message: 'One or more curry recipes not found' });
    }

    // Calculate total ingredients needed with proper cost calculation and unit conversion
    const ingredientMap = new Map();
    
    // Add main meal ingredients
    const mainMealMultiplier = peopleCount / mainMealRecipe.servings;
    console.log(`Main meal multiplier: ${mainMealMultiplier} (${peopleCount} people / ${mainMealRecipe.servings} servings)`);
    
    mainMealRecipe.ingredients.forEach(ingredient => {
      const key = ingredient.inventoryItemId._id.toString();
      const recipeQuantity = ingredient.quantity * mainMealMultiplier;
      const recipeUnit = ingredient.unit || 'g';
      const inventoryUnit = ingredient.inventoryItemId.unit || 'kg';
      
      // Convert recipe quantity to inventory unit
      const convertedQuantity = convertToStandardUnit(recipeQuantity, recipeUnit, inventoryUnit);
      const itemCostPerUnit = ingredient.inventoryItemId.costPerUnit || 0;
      const totalCost = convertedQuantity * itemCostPerUnit;
      
      console.log(`Main meal ingredient: ${ingredient.inventoryItemId.name}`);
      console.log(`  Recipe: ${recipeQuantity} ${recipeUnit} -> Inventory: ${convertedQuantity} ${inventoryUnit}`);
      console.log(`  Cost per unit: ${itemCostPerUnit}, Total cost: ${totalCost}`);
      
      if (ingredientMap.has(key)) {
        ingredientMap.get(key).totalQuantity += convertedQuantity;
        ingredientMap.get(key).totalCost += totalCost;
      } else {
        ingredientMap.set(key, {
          inventoryItemId: ingredient.inventoryItemId._id,
          itemName: ingredient.inventoryItemId.name,
          totalQuantity: convertedQuantity,
          unit: inventoryUnit,
          costPerUnit: itemCostPerUnit,
          totalCost: totalCost
        });
      }
    });

    // Add curry ingredients
    for (let i = 0; i < curryRecipes.length; i++) {
      const curry = curryRecipes[i];
      const curryMultiplier = peopleCount / curry.servings;
      console.log(`Curry ${curry.name} multiplier: ${curryMultiplier} (${peopleCount} people / ${curry.servings} servings)`);
      
      curry.ingredients.forEach(ingredient => {
        const key = ingredient.inventoryItemId._id.toString();
        const recipeQuantity = ingredient.quantity * curryMultiplier;
        const recipeUnit = ingredient.unit || 'g';
        const inventoryUnit = ingredient.inventoryItemId.unit || 'kg';
        
        // Convert recipe quantity to inventory unit
        const convertedQuantity = convertToStandardUnit(recipeQuantity, recipeUnit, inventoryUnit);
        const itemCostPerUnit = ingredient.inventoryItemId.costPerUnit || 0;
        const totalCost = convertedQuantity * itemCostPerUnit;
        
        console.log(`Curry ingredient: ${ingredient.inventoryItemId.name}`);
        console.log(`  Recipe: ${recipeQuantity} ${recipeUnit} -> Inventory: ${convertedQuantity} ${inventoryUnit}`);
        console.log(`  Cost per unit: ${itemCostPerUnit}, Total cost: ${totalCost}`);
        
        if (ingredientMap.has(key)) {
          ingredientMap.get(key).totalQuantity += convertedQuantity;
          ingredientMap.get(key).totalCost += totalCost;
        } else {
          ingredientMap.set(key, {
            inventoryItemId: ingredient.inventoryItemId._id,
            itemName: ingredient.inventoryItemId.name,
            totalQuantity: convertedQuantity,
            unit: inventoryUnit,
            costPerUnit: itemCostPerUnit,
            totalCost: totalCost
          });
        }
      });
    }

    const totalIngredients = Array.from(ingredientMap.values());
    console.log('Total ingredients calculated:', totalIngredients);

    // Check inventory availability and collect missing items
    const missingItems = [];
    
    if (userType === 'restaurant' && restaurantId) {
      for (const ingredient of totalIngredients) {
        const inventoryItem = await Inventory.findOne({
          _id: ingredient.inventoryItemId,
          restaurantId: restaurantId
        });
        
        if (!inventoryItem) {
          missingItems.push({
            itemName: ingredient.itemName,
            required: ingredient.totalQuantity,
            available: 0,
            unit: ingredient.unit
          });
        } else if (inventoryItem.currentQuantity < ingredient.totalQuantity) {
          missingItems.push({
            itemName: ingredient.itemName,
            required: ingredient.totalQuantity,
            available: inventoryItem.currentQuantity,
            unit: ingredient.unit
          });
        }
      }
    }

    // Create portion plan
    const portionPlan = new PortionPlan({
      restaurantId,
      name,
      mainMeal: {
        recipeId: mainMeal.recipeId,
        name: mainMealRecipe.name,
        servings: mainMealRecipe.servings
      },
      curries: curryRecipes.map((recipe, index) => ({
        recipeId: recipe._id,
        name: recipe.name,
        servings: recipe.servings
      })),
      peopleCount,
      totalIngredients,
      userType: userType || 'restaurant'
    });

    await portionPlan.save();
    console.log('Portion plan saved with total cost:', portionPlan.totalCost);

    // Create notifications based on inventory availability
    // Create notifications based on inventory availability
if (restaurantId) {
  if (missingItems.length > 0) {
    // ✅ Insufficient inventory notification
    await createNotificationHelper({
      type: 'insufficient_inventory',
      title: 'Insufficient Inventory for Portion Plan',
      message: `Portion plan "${name}" cannot be executed due to insufficient inventory. ${missingItems.length} items need restocking.`,
      fromModule: 'portion_calculator',
      toModule: 'inventory_management',
      restaurantId,
      relatedData: {
        portionPlanId: portionPlan._id,
        missingItems
      },
      priority: 'high'
    });
  } else {
    // ✅ Portion plan created successfully
    await createNotificationHelper({
      type: 'portion_plan_created',
      title: 'New Portion Plan Created',
      message: `Portion plan "${name}" has been created and is ready for execution.`,
      fromModule: 'portion_calculator',
      toModule: 'inventory_management',
      restaurantId,
      relatedData: {
        portionPlanId: portionPlan._id
      },
      priority: 'medium'
    });
  }
}


    res.status(201).json({
      message: 'Portion plan created successfully',
      portionPlan,
      hasInsufficientInventory: missingItems.length > 0,
      missingItems: missingItems
    });
  } catch (error) {
    console.error('Create portion plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all portion plans
const getAllPortionPlans = async (req, res) => {
  try {
    const restaurantId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;
    
    console.log('Getting portion plans for user:', restaurantId);
    
    let filter = {};
    if (restaurantId) {
      // Show plans for this user OR plans without restaurantId (for backward compatibility)
      filter.$or = [
        { restaurantId: restaurantId },
        { restaurantId: null }
      ];
    }

    const plans = await PortionPlan.find(filter)
      .populate('mainMeal.recipeId', 'name category imageUrl')
      .populate('curries.recipeId', 'name category imageUrl')
      .sort({ createdAt: -1 });

    console.log(`Found ${plans.length} portion plans`);

    res.json({
      message: 'Portion plans retrieved successfully',
      plans
    });
  } catch (error) {
    console.error('Get portion plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get portion plan by ID
const getPortionPlanById = async (req, res) => {
  try {
    const plan = await PortionPlan.findById(req.params.id)
      .populate('mainMeal.recipeId', 'name category imageUrl ingredients')
      .populate('curries.recipeId', 'name category imageUrl ingredients')
      .populate('totalIngredients.inventoryItemId', 'name category currentQuantity');

    if (!plan) {
      return res.status(404).json({ message: 'Portion plan not found' });
    }

    res.json({
      message: 'Portion plan retrieved successfully',
      plan
    });
  } catch (error) {
    console.error('Get portion plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Execute portion plan (deduct from inventory for restaurants)
const executePortionPlan = async (req, res) => {
  try {
    const plan = await PortionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Portion plan not found' });
    }

    if (plan.isInventoryDeducted) {
      return res.status(400).json({ message: 'Inventory already deducted for this plan' });
    }

    // Only deduct inventory for restaurants
    if (plan.userType === 'restaurant') {
      const restaurantId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;
      
      console.log('Starting inventory deduction for plan:', plan.planId);
      console.log('Restaurant ID from token:', restaurantId);
      console.log('Plan restaurant ID:', plan.restaurantId);
      console.log('Required ingredients:', plan.totalIngredients);
      
      // Check inventory availability first
      const inventoryChecks = await Promise.all(
        plan.totalIngredients.map(async (ingredient) => {
          // First try with restaurantId filter if available
          let inventoryQuery = { _id: ingredient.inventoryItemId };
          if (restaurantId) {
            inventoryQuery.restaurantId = restaurantId;
          }
          
          let inventoryItem = await Inventory.findOne(inventoryQuery);
          
          // If not found with restaurantId and we have a restaurantId, try without it (for shared inventory)
          if (!inventoryItem && restaurantId) {
            inventoryItem = await Inventory.findOne({
              _id: ingredient.inventoryItemId
            });
            console.log(`Inventory item ${ingredient.itemName} found without restaurantId filter:`, !!inventoryItem);
          }
          
          console.log(`Checking inventory for ${ingredient.itemName}:`, {
            found: !!inventoryItem,
            available: inventoryItem?.currentQuantity || 0,
            required: ingredient.totalQuantity,
            unit: ingredient.unit,
            restaurantMatch: inventoryItem?.restaurantId?.toString() === restaurantId?.toString()
          });
          
          if (!inventoryItem) {
            return { 
              item: ingredient.itemName, 
              available: false, 
              reason: 'Item not found in inventory',
              required: ingredient.totalQuantity,
              current: 0,
              unit: ingredient.unit
            };
          }
          
          if (inventoryItem.currentQuantity < ingredient.totalQuantity) {
            return { 
              item: ingredient.itemName, 
              available: false, 
              reason: `Insufficient quantity. Available: ${inventoryItem.currentQuantity} ${ingredient.unit}, Required: ${ingredient.totalQuantity} ${ingredient.unit}`,
              required: ingredient.totalQuantity,
              current: inventoryItem.currentQuantity,
              unit: ingredient.unit
            };
          }
          
          return { 
            item: ingredient.itemName, 
            available: true,
            required: ingredient.totalQuantity,
            current: inventoryItem.currentQuantity,
            inventoryId: inventoryItem._id,
            unit: ingredient.unit
          };
        })
      );

      const unavailableItems = inventoryChecks.filter(check => !check.available);
if (unavailableItems.length > 0) {
  console.log('Insufficient inventory items:', unavailableItems);

  // ✅ Notification for execution failure
  if (restaurantId) {
    await createNotificationHelper({
      type: 'insufficient_inventory',
      title: 'Cannot Execute Portion Plan - Insufficient Inventory',
      message: `Portion plan "${plan.name}" cannot be executed due to insufficient inventory. Please restock the missing items.`,
      fromModule: 'portion_calculator',
      toModule: 'inventory_management',
      restaurantId,
      relatedData: {
        portionPlanId: plan._id,
        missingItems: unavailableItems.map(item => ({
          itemName: item.item,
          required: item.required,
          available: item.current,
          unit: item.unit
        }))
      },
      priority: 'urgent'
    });
  }

  return res.status(400).json({
    message: 'Insufficient inventory for the following items',
    unavailableItems
  });
}


      // All items are available, proceed with deduction
      console.log('All items available, proceeding with deduction...');
      
      const deductionResults = [];
      
      for (const ingredient of plan.totalIngredients) {
        try {
          // Try to find inventory item with restaurantId first if available
          let inventoryQuery = {
            _id: ingredient.inventoryItemId,
            currentQuantity: { $gte: ingredient.totalQuantity }
          };
          
          if (restaurantId) {
            inventoryQuery.restaurantId = restaurantId;
          }
          
          let result = await Inventory.findOneAndUpdate(
            inventoryQuery,
            { $inc: { currentQuantity: -ingredient.totalQuantity } },
            { new: true }
          );
          
          // If not found with restaurantId and we have a restaurantId, try without it
          if (!result && restaurantId) {
            inventoryQuery = {
              _id: ingredient.inventoryItemId,
              currentQuantity: { $gte: ingredient.totalQuantity }
            };
            
            result = await Inventory.findOneAndUpdate(
              inventoryQuery,
              { $inc: { currentQuantity: -ingredient.totalQuantity } },
              { new: true }
            );
          }
          
          if (!result) {
            throw new Error(`Failed to deduct ${ingredient.itemName} from inventory - insufficient quantity or item not found`);
          }
          
          console.log(`Successfully deducted ${ingredient.totalQuantity} ${ingredient.unit} of 
            ${ingredient.itemName}. After: ${result.currentQuantity}`);
          
          deductionResults.push({
            item: ingredient.itemName,
            deducted: ingredient.totalQuantity,
            unit: ingredient.unit,
            afterQuantity: result.currentQuantity
          });
          
        } catch (deductionError) {
          console.error(`Error deducting ${ingredient.itemName}:`, deductionError);
          throw deductionError;
        }
      }
      
      // Mark as deducted only after successful inventory deduction
      plan.isInventoryDeducted = true;
      await plan.save();
      
      console.log(`Successfully deducted inventory for plan ${plan.planId}:`, deductionResults);
      
      return res.json({
        message: 'Portion plan executed and inventory deducted successfully',
        plan,
        deductionResults
      });
    }

    res.json({
      message: 'Grocery list generated successfully',
      plan
    });
  } catch (error) {
    console.error('Execute portion plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const generatePDF = async (req, res) => {
  try {
    const plan = await PortionPlan.findById(req.params.id)
      .populate('mainMeal.recipeId', 'name category')
      .populate('curries.recipeId', 'name category');

    if (!plan) {
      return res.status(404).json({ message: 'Portion plan not found' });
    }

    const now = new Date();

    // --- Get user from auth (like Inventory PDF) ---
    const userId = req.user?.userId;
    let user = null;
    if (userId && userId !== 'admin') {
      try {
        user = await User.findById(userId).lean();
      } catch (err) {
        console.error('Error fetching user for PDF:', err);
      }
    }

    // --- Restaurant details fallbacks (same style as inventory PDF) ---
    const restaurantName =
  user?.restaurantName || user?.businessName || user?.name || '';

const restaurantAddress =
  user?.restaurantAddress || user?.address || user?.location || '123 Main Street, Colombo, Sri Lanka';

const restaurantPhone =
  user?.restaurantPhone || user?.phone || user?.phoneNumber || user?.contactNumber || '+94 11 234 5678';

console.log('PDF Restaurant Info:', {
  name: restaurantName,
  address: restaurantAddress,
  phone: restaurantPhone
});

    // --- PDF setup ---
// --- PDF setup ---
const doc = new PDFDocument({ margin: 40, size: 'A4' });
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="portion-plan-${plan.planId}.pdf"`);
doc.pipe(res);

// --- Header: Logo left, everything else right ---
const margin = 40;
const pageWidth = doc.page.width;
const headerY = 30;

// Logo (left)
  const logoPath = path.join(
    '/Users/primeshofficial/Documents/PUREPORTION/The-Pure-Portion/backend/assets/logo.png'
  );
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, margin, headerY, { width: 120 });
}

// Right-aligned block start X
const rightBlockX = pageWidth - margin - 220; // 220 = block width
let rightY = headerY;

// Title
doc.fontSize(22).font('Helvetica-Bold').text('Portion Plan Report', rightBlockX, rightY, { width: 220, align: 'right' });
rightY += 28;

// Generated date

doc.fontSize(8).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, rightBlockX, rightY, { width: 220, align: 'right' });
rightY += 16;

// Restaurant Info
doc.fontSize(12).font('Helvetica-Bold').text(restaurantName, rightBlockX, rightY, { width: 220, align: 'right' });
rightY += 16;
doc.fontSize(10).font('Helvetica').text(restaurantAddress, rightBlockX, rightY, { width: 220, align: 'right' });
rightY += 16;
doc.text(`Phone: ${restaurantPhone}`, rightBlockX, rightY, { width: 220, align: 'right' });
rightY += 20;

  // --- Summary below header, right-aligned ---
// --- Summary below header, centered ---
const summaryText = `Plan ID: ${plan.planId}   |   People: ${plan.peopleCount}   |   Total Cost: Rs${plan.totalCost.toFixed(2)}   |   Per Person: Rs${plan.costPerPerson.toFixed(2)}`;

doc.moveDown(2); // space after header
doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');

// Use page width and margin to truly center

const textWidth = doc.widthOfString(summaryText);
const xCenter = (pageWidth - textWidth) / 2;

doc.text(summaryText, xCenter, doc.y); // centered manually
doc.moveDown(2);




    // Meals Section
    const startY = doc.y + 4;
    const col1X = 60;
    const col2X = 200;

    // Main Meal
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Main Meal:', col1X, startY);
    doc.fontSize(12).font('Helvetica').fillColor('black').text(plan.mainMeal?.name || 'N/A', col1X + 20, startY + 20);

    // Curries
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Curries:', col2X, startY);
    let curryY = startY + 20;
    plan.curries.forEach((curry) => {
      doc.fontSize(12).font('Helvetica').fillColor('black').text(`• ${curry?.name || 'N/A'}`, col2X + 20, curryY);
      curryY += 16;
    });

    // Ingredients Table
    doc.y = Math.max(startY + 60, curryY + 20);
    doc.moveDown(2);

    let y = doc.y;
    const rowHeight = 18;
    const pageBottom = doc.page.height - 50;

    const drawHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Item', 40, y)
        .text('Quantity', 200, y)
        .text('Unit', 280, y)
        .text('Cost (Rs)', 350, y, { width: 100, align: 'right' });
      y += rowHeight;
    };

    const addPageIfNeeded = (rowHeightNeeded) => {
      if (y + rowHeightNeeded > pageBottom) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
    };

    const drawRow = (ingredient, alternate = false) => {
      const rowActualHeight = rowHeight;
      addPageIfNeeded(rowActualHeight);

      if (alternate) doc.rect(35, y - 3, 520, rowActualHeight).fill('#f4f4f4');

      doc.fillColor('black').font('Helvetica')  
        .text(ingredient.itemName || '', 40, y)
        .text((ingredient.totalQuantity || 0).toFixed(3), 200, y)
        .text(ingredient.unit || '', 280, y)
        .text(`Rs${(ingredient.totalCost || 0).toFixed(2)}`, 350, y, { width: 100, align: 'right' });

      y += rowActualHeight;
    };

    drawHeader();
    plan.totalIngredients.forEach((ingredient, index) => {
      drawRow(ingredient, index % 2 === 0);
    });

    // Signature
    doc.moveDown(4);
    const signatureY = Math.max(y + 40, doc.page.height - 120);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text("______________________", 60, signatureY);
    doc.text("Manager's Signature", 80, signatureY + 15);

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};


// Delete portion plan
const deletePortionPlan = async (req, res) => {
  try {
    const plan = await PortionPlan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Portion plan not found' });
    }

    res.json({
      message: 'Portion plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete portion plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPortionPlan,
  getAllPortionPlans,
  getPortionPlanById,
  executePortionPlan,
  generatePDF,
  deletePortionPlan
};