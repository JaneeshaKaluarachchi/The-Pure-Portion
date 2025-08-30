const PortionPlan = require('../models/PortionPlan');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// Create portion plan
const createPortionPlan = async (req, res) => {
  try {
    console.log('Create portion plan request:', req.body);
    
    const { name, mainMeal, curries, peopleCount, userType } = req.body;
    const restaurantId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;

    // Validate main meal recipe
    const mainMealRecipe = await Recipe.findById(mainMeal.recipeId);
    if (!mainMealRecipe) {
      return res.status(404).json({ message: 'Main meal recipe not found' });
    }

    // Validate curry recipes
    const curryRecipes = await Recipe.find({ 
      _id: { $in: curries.map(curry => curry.recipeId) } 
    });
    
    if (curryRecipes.length !== curries.length) {
      return res.status(404).json({ message: 'One or more curry recipes not found' });
    }

    // Calculate total ingredients needed
    const ingredientMap = new Map();
    
    // Add main meal ingredients
    const mainMealMultiplier = peopleCount / mainMealRecipe.servings;
    mainMealRecipe.ingredients.forEach(ingredient => {
      const key = ingredient.inventoryItemId.toString();
      const quantity = ingredient.quantity * mainMealMultiplier;
      
      if (ingredientMap.has(key)) {
        ingredientMap.get(key).totalQuantity += quantity;
        ingredientMap.get(key).totalCost += quantity * ingredient.costPerUnit;
      } else {
        ingredientMap.set(key, {
          inventoryItemId: ingredient.inventoryItemId,
          itemName: ingredient.itemName,
          totalQuantity: quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
          totalCost: quantity * ingredient.costPerUnit
        });
      }
    });

    // Add curry ingredients
    for (let i = 0; i < curryRecipes.length; i++) {
      const curry = curryRecipes[i];
      const curryMultiplier = peopleCount / curry.servings;
      
      curry.ingredients.forEach(ingredient => {
        const key = ingredient.inventoryItemId.toString();
        const quantity = ingredient.quantity * curryMultiplier;
        
        if (ingredientMap.has(key)) {
          ingredientMap.get(key).totalQuantity += quantity;
          ingredientMap.get(key).totalCost += quantity * ingredient.costPerUnit;
        } else {
          ingredientMap.set(key, {
            inventoryItemId: ingredient.inventoryItemId,
            itemName: ingredient.itemName,
            totalQuantity: quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            totalCost: quantity * ingredient.costPerUnit
          });
        }
      });
    }

    const totalIngredients = Array.from(ingredientMap.values());

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
      
      // Check inventory availability
      const inventoryChecks = await Promise.all(
        plan.totalIngredients.map(async (ingredient) => {
          const inventoryItem = await Inventory.findOne({
            _id: ingredient.inventoryItemId,
            restaurantId
          });
          
          if (!inventoryItem) {
            return { item: ingredient.itemName, available: false, reason: 'Item not found' };
          }
          
          if (inventoryItem.currentQuantity < ingredient.totalQuantity) {
            return { 
              item: ingredient.itemName, 
              available: false, 
              reason: `Insufficient quantity. Available: ${inventoryItem.currentQuantity} ${ingredient.unit}, Required: ${ingredient.totalQuantity} ${ingredient.unit}` 
            };
          }
          
          return { item: ingredient.itemName, available: true };
        })
      );

      const unavailableItems = inventoryChecks.filter(check => !check.available);
      if (unavailableItems.length > 0) {
        return res.status(400).json({
          message: 'Insufficient inventory',
          unavailableItems
        });
      }

      // Deduct from inventory
      await Promise.all(
        plan.totalIngredients.map(async (ingredient) => {
          await Inventory.findOneAndUpdate(
            { _id: ingredient.inventoryItemId, restaurantId },
            { $inc: { currentQuantity: -ingredient.totalQuantity } }
          );
        })
      );

      // Mark as deducted
      plan.isInventoryDeducted = true;
      await plan.save();
    }

    res.json({
      message: plan.userType === 'restaurant' 
        ? 'Portion plan executed and inventory deducted successfully' 
        : 'Grocery list generated successfully',
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
    doc.text(`Total Cost: $${plan.totalCost.toFixed(2)}`, 50, 140);
    doc.text(`Cost Per Person: $${plan.costPerPerson.toFixed(2)}`, 50, 160);

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
      doc.text(`$${ingredient.totalCost.toFixed(2)}`, 350, yPosition);
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