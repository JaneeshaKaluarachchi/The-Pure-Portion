const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['portion_plan_created', 'insufficient_inventory', 'inventory_restocked', 'restock_available', 'recipe_added_missing_ingredients', 'recipe_ingredients_fulfilled']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  fromModule: {
    type: String,
    required: true,
    enum: ['portion_calculator', 'inventory_management', 'recipe_management']
  },
  toModule: {
    type: String,
    required: true,
    enum: ['portion_calculator', 'inventory_management', 'recipe_management']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedData: {
    portionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PortionPlan'
    },
    missingItems: [{
      itemName: String,
      required: Number,
      available: Number,
      unit: String
    }],
    missingIngredients: [{
      name: String,
      quantity: Number,
      unit: String
    }],
    recipeId: String,
    recipeName: String,
    restockedItems: [{
      itemName: String,
      itemId: String,
      newQuantity: Number,
      unit: String
    }]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
});

// Auto-generate notificationId before validation
notificationSchema.pre('validate', async function(next) {
  if (this.isNew && !this.notificationId) {
    try {
      const lastNotification = await this.constructor.findOne().sort({ createdAt: -1 });
      if (lastNotification && lastNotification.notificationId) {
        const lastId = parseInt(lastNotification.notificationId.split('-')[1]);
        this.notificationId = `NOTIF-${(lastId + 1).toString().padStart(4, '0')}`;
      } else {
        this.notificationId = 'NOTIF-0001';
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Index for better query performance
notificationSchema.index({ restaurantId: 1, isRead: 1 });
notificationSchema.index({ restaurantId: 1, toModule: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);