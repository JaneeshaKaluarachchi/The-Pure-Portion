const PortionPlan = require('../models/PortionPlan');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

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
    const mainMealRecipe = await Recipe.findById(mainMeal.recipeId).populate('ingredients.inventoryItemId');
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

    res.status(201).json({
      message: 'Portion plan created successfully',
      portionPlan
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
    
    let filter = {};
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    const plans = await PortionPlan.find(filter)
      .populate('mainMeal.recipeId', 'name category imageUrl')
      .populate('curries.recipeId', 'name category imageUrl')
      .sort({ createdAt: -1 });

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
          
          console.log(`Successfully deducted ${ingredient.totalQuantity} ${ingredient.unit} of ${ingredient.itemName}. After: ${result.currentQuantity}`);
          
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

// Generate PDF for portion plan
const generatePDF = async (req, res) => {
  try {
    const plan = await PortionPlan.findById(req.params.id)
      .populate('mainMeal.recipeId', 'name category')
      .populate('curries.recipeId', 'name category');

    if (!plan) {
      return res.status(404).json({ message: 'Portion plan not found' });
    }

    const doc = new PDFDocument();
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="portion-plan-${plan.planId}.pdf"`);
    
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Portion Plan', 50, 50);
    doc.fontSize(16).text(`Plan ID: ${plan.planId}`, 50, 80);
    doc.fontSize(14).text(`Plan Name: ${plan.name}`, 50, 100);
    doc.text(`People Count: ${plan.peopleCount}`, 50, 120);
    doc.text(`Total Cost: Rs${plan.totalCost.toFixed(2)}`, 50, 140);
    doc.text(`Cost Per Person: Rs${plan.costPerPerson.toFixed(2)}`, 50, 160);

    // Main Meal
    doc.fontSize(16).text('Main Meal:', 50, 200);
    doc.fontSize(12).text(`${plan.mainMeal.name}`, 70, 220);

    // Curries
    doc.fontSize(16).text('Curries:', 50, 250);
    let yPosition = 270;
    plan.curries.forEach(curry => {
      doc.fontSize(12).text(`• ${curry.name}`, 70, yPosition);
      yPosition += 20;
    });

    // Ingredients List
    yPosition += 20;
    doc.fontSize(16).text('Ingredients List:', 50, yPosition);
    yPosition += 30;

    doc.fontSize(10);
    doc.text('Item Name', 50, yPosition);
    doc.text('Quantity', 200, yPosition);
    doc.text('Unit', 280, yPosition);
    doc.text('Total Cost', 350, yPosition);
    yPosition += 20;

    // Draw line
    doc.moveTo(50, yPosition).lineTo(450, yPosition).stroke();
    yPosition += 10;

    plan.totalIngredients.forEach(ingredient => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(ingredient.itemName, 50, yPosition);
      doc.text(ingredient.totalQuantity.toFixed(2), 200, yPosition);
      doc.text(ingredient.unit, 280, yPosition);
      doc.text(`Rs${ingredient.totalCost.toFixed(2)}`, 350, yPosition);
      yPosition += 15;
    });

    // Add footer
    doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, 50, yPosition + 30);
    doc.text(`Plan Type: ${plan.userType === 'restaurant' ? 'Restaurant Plan' : 'Grocery List'}`, 50, yPosition + 45);

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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