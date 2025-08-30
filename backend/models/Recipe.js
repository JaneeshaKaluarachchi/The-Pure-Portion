const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  }
});

const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 }, // in grams
  carbs: { type: Number, default: 0 }, // in grams
  fat: { type: Number, default: 0 }, // in grams
  fiber: { type: Number, default: 0 }, // in grams
  sugar: { type: Number, default: 0 } // in grams
});

const recipeSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  recipeId: {
    type: String,
    unique: true, // auto-generated
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['curry', 'rice', 'bread', 'soup', 'salad', 'dessert', 'beverage', 'appetizer', 'main-course', 'side-dish', 'breakfast', 'snack', 'other']
  },
  cuisine: {
    type: String,
    enum: ['sri-lankan', 'american', 'italian', 'chinese', 'indian', 'mexican', 'french', 'japanese', 'thai', 'mediterranean', 'other'],
    default: 'sri-lankan'
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    default: 4
  },
  prepTime: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  cookTime: {
    type: Number, // in minutes
    required: true,
    default: 30
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  ingredients: [ingredientSchema],
  instructions: [{
    step: Number,
    description: String,
    timeRequired: Number // in minutes
  }],
  nutrition: nutritionSchema,
  totalCost: {
    type: Number,
    default: 0
  },
  costPerServing: {
    type: Number,
    default: 0
  },
  suggestedPrice: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 300 // 300% markup as default
  },
  tags: [String],
  imageUrl: {
    type: String,
    default: ''
  },
  allergens: [{
    type: String,
    enum: ['dairy', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 'wheat', 'soy', 'sesame']
  }],
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isDairyFree: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive'],
    default: 'draft'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate recipeId before validation
recipeSchema.pre('validate', async function(next) {
  if (this.isNew && !this.recipeId) {
    try {
      const lastRecipe = await this.constructor.findOne({ restaurantId: this.restaurantId }).sort({ createdAt: -1 });
      if (lastRecipe && lastRecipe.recipeId) {
        const lastId = parseInt(lastRecipe.recipeId.split('-')[1]);
        this.recipeId = `RCP-${(lastId + 1).toString().padStart(4, '0')}`;
      } else {
        this.recipeId = 'RCP-0001';
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Calculate costs before saving
recipeSchema.pre('save', function(next) {
  // Calculate total cost and cost per serving
  this.totalCost = this.ingredients.reduce((total, ingredient) => {
    ingredient.totalCost = ingredient.quantity * ingredient.costPerUnit;
    return total + ingredient.totalCost;
  }, 0);
  
  this.costPerServing = this.servings > 0 ? this.totalCost / this.servings : 0;
  
  // Calculate suggested price based on profit margin
  this.suggestedPrice = this.costPerServing * (this.profitMargin / 100);
  
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
recipeSchema.index({ restaurantId: 1, category: 1 });
recipeSchema.index({ restaurantId: 1, status: 1 });
recipeSchema.index({ restaurantId: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);