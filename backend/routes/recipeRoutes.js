const express = require('express');
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

const {
  addRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  checkIngredientAvailability,
  scaleRecipe,
  getRecipeStats
} = require('../controllers/recipeController');

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

// Protected routes - require authentication
router.use(auth);

// Image upload endpoint
router.post('/upload-image', upload.single('image'), async (req, res) => {
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

// Recipe CRUD routes
router.post('/', addRecipe);
router.get('/', getAllRecipes);
router.get('/stats', getRecipeStats);
router.get('/:id', getRecipeById);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

// Recipe utility routes
router.get('/:id/availability', checkIngredientAvailability);
router.post('/:id/scale', scaleRecipe);

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