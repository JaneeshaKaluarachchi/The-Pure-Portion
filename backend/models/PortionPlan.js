const mongoose = require('mongoose');

const portionPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    unique: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  mainMeal: {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true
    },
    name: String,
    servings: Number
  },
  curries: [{
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true
    },
    name: String,
    servings: Number
  }],
  peopleCount: {
    type: Number,
    required: true,
    min: 1
  },
  totalIngredients: [{
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    itemName: String,
    totalQuantity: Number,
    unit: String,
    costPerUnit: Number,
    totalCost: Number
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  costPerPerson: {
    type: Number,
    default: 0
  },
  userType: {
    type: String,
    enum: ['restaurant', 'household'],
    default: 'restaurant'
  },
  isInventoryDeducted: {
    type: Boolean,
    default: false
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

// Auto-generate planId before validation
portionPlanSchema.pre('validate', async function(next) {
  if (this.isNew && !this.planId) {
    try {
      const lastPlan = await this.constructor.findOne().sort({ createdAt: -1 });
      if (lastPlan && lastPlan.planId) {
        const lastId = parseInt(lastPlan.planId.split('-')[1]);
        this.planId = `PLAN-${(lastId + 1).toString().padStart(4, '0')}`;
      } else {
        this.planId = 'PLAN-0001';
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Calculate totals before saving
portionPlanSchema.pre('save', function(next) {
  this.totalCost = this.totalIngredients.reduce((total, ingredient) => {
    return total + ingredient.totalCost;
  }, 0);
  
  this.costPerPerson = this.peopleCount > 0 ? this.totalCost / this.peopleCount : 0;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PortionPlan', portionPlanSchema);