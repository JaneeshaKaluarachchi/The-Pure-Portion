const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function for unit conversion
const convertUnits = (quantity, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return quantity;
  
  // Conversion rates to base units (kg for weight, l for volume)
  const weightConversions = {
    'g': 0.001,    // g to kg
    'kg': 1,       // kg to kg
    'lb': 0.453592, // lb to kg
    'oz': 0.0283495 // oz to kg
  };
  
  const volumeConversions = {
    'ml': 0.001,   // ml to l
    'l': 1,        // l to l
    'cup': 0.236588, // cup to l
    'tbsp': 0.0147868, // tbsp to l
    'tsp': 0.00492892  // tsp to l
  };
  
  const countConversions = {
    'pieces': 1,
    'pcs': 1,
    'dozen': 12,
    'packs': 1,
    'bottles': 1,
    'cans': 1,
    'boxes': 1
  };
  
  // Determine conversion type
  let conversions = null;
  if (weightConversions[fromUnit] && weightConversions[toUnit]) {
    conversions = weightConversions;
  } else if (volumeConversions[fromUnit] && volumeConversions[toUnit]) {
    conversions = volumeConversions;
  } else if (countConversions[fromUnit] && countConversions[toUnit]) {
    conversions = countConversions;
  }
  
  if (!conversions) {
    console.warn(`Cannot convert from ${fromUnit} to ${toUnit}`);
    return quantity; // Return original if conversion not possible
  }
  
  // Convert: fromUnit -> base -> toUnit
  const baseQuantity = quantity * conversions[fromUnit];
  return baseQuantity / conversions[toUnit];
};

// Add new recipe
const addRecipe = async (req, res) => {
  try {
    console.log('Add recipe request:', req.body);
    
    const restaurantId = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : null;
    
    // Validate and enrich ingredients with inventory data
    const enrichedIngredients = await Promise.all(
      req.body.ingredients.map(async (ingredient) => {
        const inventoryItem = await Inventory.findOne({
          _id: ingredient.inventoryItemId,
          restaurantId
        });
        
        if (!inventoryItem) {
          throw new Error(`Inventory item not found: ${ingredient.inventoryItemId}`);
        }
        
        return {
          inventoryItemId: ingredient.inventoryItemId,
          itemName: inventoryItem.name,
          quantity: Number(ingredient.quantity),
          unit: ingredient.unit, // User selected unit
          baseUnit: inventoryItem.unit, // Inventory base unit
          costPerUnit: inventoryItem.costPerUnit,
          totalCost: 0 // Will be calculated in pre-save hook
        };
      })
    );

    const recipeData = {
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      subcategory: req.body.subcategory || req.body.category,
      cuisine: req.body.cuisine || 'sri-lankan',
      servings: Number(req.body.servings),
      prepTime: Number(req.body.prepTime) || 30,
      cookTime: Number(req.body.cookTime) || 30,
      difficulty: req.body.difficulty || 'medium',
      ingredients: enrichedIngredients,
      instructions: req.body.instructions || [],
      nutrition: req.body.nutrition || {},
      profitMargin: Number(req.body.profitMargin) || 300,
      tags: req.body.tags || [],
      allergens: req.body.allergens || [],
      isVegetarian: Boolean(req.body.isVegetarian),
      isVegan: Boolean(req.body.isVegan),
      isGlutenFree: Boolean(req.body.isGlutenFree),
      isDairyFree: Boolean(req.body.isDairyFree),
      status: req.body.status || 'active',
      notes: req.body.notes || '',
      imageUrl: req.body.imageUrl || ''
    };

    // Only add restaurantId if user is authenticated
    if (restaurantId) {
      recipeData.restaurantId = restaurantId;
    }

    const recipe = new Recipe(recipeData);
    await recipe.save();

    res.status(201).json({
      message: 'Recipe added successfully',
      recipe
    });
  } catch (error) {
    console.error('Add recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all recipes
const getAllRecipes = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const { category, status, search, cuisine } = req.query;
    
    let filter = { restaurantId };
    
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (cuisine && cuisine !== 'all') filter.cuisine = cuisine;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { recipeId: { $regex: search, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(filter)
      .populate('ingredients.inventoryItemId', 'name unit currentQuantity')
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Recipes retrieved successfully',
      recipes
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single recipe
const getRecipeById = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const recipe = await Recipe.findOne({ _id: req.params.id, restaurantId })
      .populate('ingredients.inventoryItemId', 'name unit currentQuantity');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({
      message: 'Recipe retrieved successfully',
      recipe
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update recipe
const updateRecipe = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const recipeId = req.params.id;

    const recipe = await Recipe.findOne({ _id: recipeId, restaurantId });
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Validate and enrich ingredients if they are being updated
    let enrichedIngredients = recipe.ingredients;
    if (req.body.ingredients) {
      enrichedIngredients = await Promise.all(
        req.body.ingredients.map(async (ingredient) => {
          const inventoryItem = await Inventory.findOne({
            _id: ingredient.inventoryItemId,
            restaurantId
          });
          
          if (!inventoryItem) {
            throw new Error(`Inventory item not found: ${ingredient.inventoryItemId}`);
          }
          
          return {
            inventoryItemId: ingredient.inventoryItemId,
            itemName: inventoryItem.name,
            quantity: Number(ingredient.quantity),
            unit: ingredient.unit, // User selected unit
            baseUnit: inventoryItem.unit, // Inventory base unit
            costPerUnit: inventoryItem.costPerUnit,
            totalCost: 0 // Will be calculated in pre-save hook
          };
        })
      );
    }

    const updateData = {
      ...req.body,
      ingredients: enrichedIngredients,
      servings: req.body.servings ? Number(req.body.servings) : recipe.servings,
      prepTime: req.body.prepTime ? Number(req.body.prepTime) : recipe.prepTime,
      cookTime: req.body.cookTime ? Number(req.body.cookTime) : recipe.cookTime,
      profitMargin: req.body.profitMargin ? Number(req.body.profitMargin) : recipe.profitMargin,
      updatedAt: Date.now()
    };

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      updateData,
      { new: true, runValidators: true }
    ).populate('ingredients.inventoryItemId', 'name unit currentQuantity');

    res.json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete recipe
const deleteRecipe = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const recipeId = req.params.id;

    const recipe = await Recipe.findOne({ _id: recipeId, restaurantId });
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await Recipe.findByIdAndDelete(recipeId);

    res.json({
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check ingredient availability
const checkIngredientAvailability = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const recipeId = req.params.id;
    const { servings } = req.query;

    const recipe = await Recipe.findOne({ _id: recipeId, restaurantId })
      .populate('ingredients.inventoryItemId', 'name unit currentQuantity');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const multiplier = servings ? Number(servings) / recipe.servings : 1;
    
    const availability = recipe.ingredients.map(ingredient => {
      const requiredQuantity = ingredient.quantity * multiplier;
      // Convert required quantity to inventory base unit for comparison
      const requiredInBaseUnit = convertUnits(requiredQuantity, ingredient.unit, ingredient.baseUnit);
      const availableQuantity = ingredient.inventoryItemId.currentQuantity;
      const isAvailable = availableQuantity >= requiredInBaseUnit;
      
      return {
        itemName: ingredient.itemName,
        required: requiredQuantity,
        requiredUnit: ingredient.unit,
        requiredInBaseUnit: requiredInBaseUnit,
        available: availableQuantity,
        availableUnit: ingredient.baseUnit,
        isAvailable,
        shortage: isAvailable ? 0 : requiredInBaseUnit - availableQuantity
      };
    });

    const canMake = availability.every(item => item.isAvailable);
    const shortageItems = availability.filter(item => !item.isAvailable);

    res.json({
      message: 'Ingredient availability checked',
      canMake,
      availability,
      shortageItems,
      servings: Number(servings) || recipe.servings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Scale recipe
const scaleRecipe = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    const recipeId = req.params.id;
    const { servings } = req.body;

    const recipe = await Recipe.findOne({ _id: recipeId, restaurantId });
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const multiplier = Number(servings) / recipe.servings;
    
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient.toObject(),
      quantity: ingredient.quantity * multiplier,
      totalCost: ingredient.totalCost * multiplier
    }));

    const scaledRecipe = {
      ...recipe.toObject(),
      servings: Number(servings),
      ingredients: scaledIngredients,
      totalCost: recipe.totalCost * multiplier,
      costPerServing: recipe.costPerServing // This stays the same per serving
    };

    res.json({
      message: 'Recipe scaled successfully',
      originalServings: recipe.servings,
      newServings: Number(servings),
      multiplier,
      scaledRecipe
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recipe statistics
const getRecipeStats = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    
    // Total recipes count
    const totalRecipes = await Recipe.countDocuments({ restaurantId });
    
    // Recipes by category
    const categoryStats = await Recipe.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Recipes by status
    const statusStats = await Recipe.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Average cost per serving
    const avgCostStats = await Recipe.aggregate([
      { $match: { restaurantId } },
      { 
        $group: { 
          _id: null, 
          avgCostPerServing: { $avg: '$costPerServing' },
          avgTotalCost: { $avg: '$totalCost' }
        } 
      }
    ]);
    
    // Most expensive recipes
    const expensiveRecipes = await Recipe.find({ restaurantId })
      .sort({ costPerServing: -1 })
      .limit(5)
      .select('name recipeId costPerServing category');
    
    // Most complex recipes (by ingredient count)
    const complexRecipes = await Recipe.aggregate([
      { $match: { restaurantId } },
      { $project: { name: 1, recipeId: 1, ingredientCount: { $size: '$ingredients' } } },
      { $sort: { ingredientCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalRecipes,
      categoryStats,
      statusStats,
      averages: avgCostStats[0] || { avgCostPerServing: 0, avgTotalCost: 0 },
      expensiveRecipes,
      complexRecipes
    });
  } catch (error) {
    console.error('Recipe stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate PDF for recipe
const generateRecipePDF = async (req, res) => {
  try {
    console.log('Generating PDF for recipe:', req.params.id);
    
    const recipe = await Recipe.findById(req.params.id)
      .populate('ingredients.inventoryItemId', 'name');

    if (!recipe) {
      console.log('Recipe not found');
      return res.status(404).json({ message: 'Recipe not found' });
    }

    console.log('Recipe found:', recipe.name);
    console.log('Ingredients count:', recipe.ingredients.length);

    const now = new Date();

    // Get user from auth
    const userId = req.user?.userId;
    let user = null;
    if (userId && userId !== 'admin') {
      try {
        user = await User.findById(userId).lean();
      } catch (err) {
        console.error('Error fetching user for PDF:', err);
      }
    }

    // Restaurant details fallbacks
    const restaurantName = user?.restaurantName || user?.businessName || user?.name || 'Pure Portions';
    const restaurantAddress = user?.restaurantAddress || user?.address || user?.location || '123 Main Street, Colombo, Sri Lanka';
    const restaurantPhone = user?.restaurantPhone || user?.phone || user?.phoneNumber || user?.contactNumber || '+94 11 234 5678';

    // PDF setup
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recipe-${recipe.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    doc.pipe(res);

    // --- Header: Logo left, everything else right ---
    const margin = 40;
    const pageWidth = doc.page.width;
    const headerY = 30;

    // Logo (left)
    const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, headerY, { width: 120 });
    }

    // Right-aligned block start X
    const rightBlockX = pageWidth - margin - 220;
    let rightY = headerY;

    // Title
    doc.fontSize(22).font('Helvetica-Bold').text('Recipe Report', rightBlockX, rightY, { width: 220, align: 'right' });
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

    // --- Summary below header, centered ---
    const totalCost = recipe.totalCost || recipe.ingredients.reduce((sum, ing) => sum + (ing.totalCost || ing.cost || 0), 0);
    const summaryText = `Recipe: ${recipe.name}   |   Category: ${recipe.subcategory} `;

    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');

    const textWidth = doc.widthOfString(summaryText);
    const xCenter = (pageWidth - textWidth) / 2;

    doc.text(summaryText, xCenter, doc.y);
    doc.moveDown(1);

    // --- Recipe Image (centered) - BEFORE description ---
    if (recipe.imageUrl) {
      try {
        // Handle both full URLs and relative paths
        let imagePath;
        if (recipe.imageUrl.startsWith('http')) {
          // Full URL - skip for now
          console.log('Skipping HTTP image URL');
        } else {
          // Relative path like /uploads/recipes/...
          const filename = path.basename(recipe.imageUrl);
          imagePath = path.join(__dirname, '..', 'uploads', 'recipes', filename);
          
          console.log('Looking for image at:', imagePath);
          
          if (fs.existsSync(imagePath)) {
            const imgWidth = 200;
            const imgHeight = 200;
            const imgX = (pageWidth - imgWidth) / 2;
            
            doc.image(imagePath, imgX, doc.y, { width: imgWidth, height: imgHeight });
            doc.moveDown(1);
            console.log('Image added successfully');
          } else {
            console.log('Image file not found at:', imagePath);
          }
        }
      } catch (error) {
        console.error('Error loading recipe image:', error);
      }
    }

    // --- Description Section - AFTER image ---
    if (recipe.description) {
      doc.moveDown(12);
      const startY = doc.y;
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Description:', 60, startY);
      doc.fontSize(11).font('Helvetica').fillColor('black').text(recipe.description, 60, startY + 20, { width: pageWidth - 120 });
      doc.moveDown(1.5);
    }

    // --- Ingredients Table ---
    doc.moveDown(1);

    let y = doc.y;
    const rowHeight = 22;
    const pageBottom = doc.page.height - 100;

    const drawHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(40, y - 3, 515, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Item', 45, y + 5)
        .text('Quantity', 220, y + 5)
        .text('Unit', 515, y + 5)
        
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

      if (alternate) doc.rect(40, y - 3, 515, rowActualHeight).fill('#f4f4f4');

      const itemName = ingredient.inventoryItemId?.name || ingredient.itemName || 'Unknown';
      const itemCost = ingredient.totalCost || ingredient.cost || 0;

      doc.fillColor('black').font('Helvetica').fontSize(10)
        .text(itemName, 45, y + 5, { width: 165 })
        .text((ingredient.quantity || 0).toFixed(2), 220, y + 5)
        .text(ingredient.unit || '', 515, y + 5)
        

      y += rowActualHeight;
    };

    drawHeader();
    recipe.ingredients.forEach((ingredient, index) => {
      drawRow(ingredient, index % 2 === 0);
    });

    console.log('PDF generation completed successfully');
    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    console.error('Error stack:', error.stack);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to generate PDF', 
        error: error.message,
        details: error.stack 
      });
    }
  }
};

module.exports = {
  addRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  checkIngredientAvailability,
  scaleRecipe,
  getRecipeStats,
  generateRecipePDF
};