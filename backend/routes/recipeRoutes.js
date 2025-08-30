const express = require('express');
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/recipes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recipe-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
  fileSize: 10 * 1024 * 1024 // 10MB
}

});

// Ensure upload directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/recipes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image upload endpoint
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/recipes/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Get all recipes with filtering and searching
router.get('/', auth, async (req, res) => {
  try {
    const { category, cuisine, search, status = 'active' } = req.query;
    
    let query = { status };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (cuisine && cuisine !== 'all') {
      query.cuisine = cuisine;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ingredients.itemName': { $regex: search, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      recipes,
      total: recipes.length
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
});

// Get recipe by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Error fetching recipe', error: error.message });
  }
});

// Create new recipe
router.post('/', auth, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const recipe = new Recipe(recipeData);
    await recipe.save();
    
    res.status(201).json({
      message: 'Recipe created successfully',
      recipe
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(400).json({ message: 'Error creating recipe', error: error.message });
  }
});

// Update recipe
router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Update recipe fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        recipe[key] = req.body[key];
      }
    });
    
    recipe.updatedAt = new Date();
    await recipe.save();
    
    res.json({
      message: 'Recipe updated successfully',
      recipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(400).json({ message: 'Error updating recipe', error: error.message });
  }
});

// Delete recipe
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    await Recipe.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Error deleting recipe', error: error.message });
  }
});

// Get recipe statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalRecipes = await Recipe.countDocuments({ status: 'active' });
    
    const categoryStats = await Recipe.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const subcategoryStats = await Recipe.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } }
    ]);
    
    const cuisineStats = await Recipe.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$cuisine', count: { $sum: 1 } } }
    ]);
    
    const statusStats = await Recipe.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const averages = await Recipe.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          avgCostPerServing: { $avg: '$costPerServing' },
          avgTotalTime: { $avg: { $add: ['$prepTime', '$cookTime'] } },
          avgIngredientCount: { $avg: { $size: '$ingredients' } }
        }
      }
    ]);
    
    res.json({
      totalRecipes,
      categoryStats,
      subcategoryStats,
      cuisineStats,
      statusStats,
      averages: averages[0] || {}
    });
  } catch (error) {
    console.error('Error fetching recipe stats:', error);
    res.status(500).json({ message: 'Error fetching recipe stats', error: error.message });
  }
});

// Scale recipe for different serving sizes
router.post('/:id/scale', auth, async (req, res) => {
  try {
    const { servings } = req.body;
    
    if (!servings || servings <= 0) {
      return res.status(400).json({ message: 'Valid serving size required' });
    }
    
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const scalingFactor = servings / recipe.servings;
    
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient.toObject(),
      quantity: ingredient.quantity * scalingFactor
    }));
    
    const scaledRecipe = {
      ...recipe.toObject(),
      servings,
      ingredients: scaledIngredients,
      costPerServing: recipe.costPerServing,
      totalCost: recipe.costPerServing * servings
    };
    
    res.json({
      message: 'Recipe scaled successfully',
      scaledRecipe,
      scalingFactor
    });
  } catch (error) {
    console.error('Error scaling recipe:', error);
    res.status(500).json({ message: 'Error scaling recipe', error: error.message });
  }
});

// Get ingredients needed for a recipe (for shopping list)
router.get('/:id/ingredients', auth, async (req, res) => {
  try {
    const { servings = 1 } = req.query;
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const scalingFactor = servings / recipe.servings;
    
    const ingredients = recipe.ingredients.map(ingredient => ({
      inventoryItemId: ingredient.inventoryItemId,
      itemName: ingredient.itemName,
      quantityNeeded: ingredient.quantity * scalingFactor,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      totalCost: ingredient.quantity * ingredient.costPerUnit * scalingFactor
    }));
    
    res.json({
      recipeId: recipe.recipeId,
      recipeName: recipe.name,
      servings: parseInt(servings),
      ingredients,
      totalCost: ingredients.reduce((sum, ing) => sum + ing.totalCost, 0)
    });
  } catch (error) {
    console.error('Error fetching recipe ingredients:', error);
    res.status(500).json({ message: 'Error fetching recipe ingredients', error: error.message });
  }
});

module.exports = router;