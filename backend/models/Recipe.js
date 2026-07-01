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
  baseUnit: {
    type: String,
    required: true // Store the inventory's base unit
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
    required: true
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
    enum: ['curry', 'rice', 'Other', 'soup', 'salad', 'dessert', 'beverage', 'appetizer', 'main-course', 'side-dish', 'breakfast', 'snack', 'other']
  },
  subcategory: {
    type: String,
    default: ''
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
  pendingIngredients: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'g' }
  }],
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

// Shared unit-conversion helper used in cost calculation.
// Mirrors the logic in portionController.js — keep in sync.
const convertUnits = (quantity, fromUnit, toUnit) => {
  const f = (fromUnit || 'g').toLowerCase().trim();
  const t = (toUnit  || 'g').toLowerCase().trim();
  if (f === t) return quantity;

  // Weight factors relative to kg
  const kgFactor = {
    g:0.001, gram:0.001, grams:0.001,
    kg:1, kilogram:1, kilograms:1,
    lb:0.453592, oz:0.0283495, pound:0.453592, pounds:0.453592,
  };
  // Volume factors relative to l
  const lFactor = {
    ml:0.001, l:1, liter:1, liters:1,
    cup:0.236588, tbsp:0.0147868, tsp:0.00492892,
  };
  // Count factors relative to 1 piece
  const pcFactor = {
    pcs:1, piece:1, pieces:1,
    pack:1, packs:1, bottle:1, bottles:1,
    can:1, cans:1, box:1, boxes:1, dozen:12,
  };

  const isW = (u) => u in kgFactor;
  const isV = (u) => u in lFactor;
  const isC = (u) => u in pcFactor;

  // Count ↔ count
  if (isC(f) && isC(t)) return quantity * pcFactor[f] / pcFactor[t];

  // Count ↔ weight/volume: incompatible — return as-is (cost calc best-effort)
  if (isC(f) || isC(t)) {
    console.warn(`Recipe cost: cannot convert "${f}" → "${t}" (count vs weight/volume)`);
    return quantity;
  }

  // Weight ↔ weight
  if (isW(f) && isW(t)) return quantity * kgFactor[f] / kgFactor[t];

  // Volume ↔ volume
  if (isV(f) && isV(t)) return quantity * lFactor[f] / lFactor[t];

  // Cross-category weight ↔ volume: water-density approximation (1 g ≈ 1 ml)
  if (isW(f) && isV(t)) {
    const grams  = quantity * kgFactor[f] * 1000; // qty → kg → grams
    const liters = grams * 0.001;                  // grams ≈ ml → liters
    return liters / lFactor[t];                    // liters → target volume unit
  }
  if (isV(f) && isW(t)) {
    const liters = quantity * lFactor[f];           // qty → liters
    const grams  = liters * 1000;                   // liters → ml ≈ grams
    const inKg   = grams * 0.001;                   // grams → kg
    return inKg / kgFactor[t];                      // kg → target weight unit
  }

  console.warn(`Recipe cost: unknown units "${f}" → "${t}"`);
  return quantity;
};

// Calculate costs before saving
recipeSchema.pre('save', function(next) {
  // Calculate total cost with proper unit conversion
  this.totalCost = this.ingredients.reduce((total, ingredient) => {
    // Convert ingredient quantity to base unit for cost calculation
    const baseQuantity = convertUnits(ingredient.quantity, ingredient.unit, ingredient.baseUnit);
    ingredient.totalCost = baseQuantity * ingredient.costPerUnit;
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