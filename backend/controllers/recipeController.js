const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

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
          unit: inventoryItem.unit,
          costPerUnit: inventoryItem.costPerUnit,
          totalCost: Number(ingredient.quantity) * inventoryItem.costPerUnit
        };
      })
    );

    const recipeData = {
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
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
      subcategory: req.body.subcategory || req.body.category,
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
  quantity: Number(ingredient.quantity),   // from frontend
  unit: ingredient.unit || inventoryItem.unit, // use user-selected if available
  costPerUnit: inventoryItem.costPerUnit,
  totalCost: Number(ingredient.quantity) * inventoryItem.costPerUnit
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
      const availableQuantity = ingredient.inventoryItemId.currentQuantity;
      const isAvailable = availableQuantity >= requiredQuantity;
      
      return {
        itemName: ingredient.itemName,
        required: requiredQuantity,
        available: availableQuantity,
        unit: ingredient.unit,
        isAvailable,
        shortage: isAvailable ? 0 : requiredQuantity - availableQuantity
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

module.exports = {
  addRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  checkIngredientAvailability,
  scaleRecipe,
  getRecipeStats
};