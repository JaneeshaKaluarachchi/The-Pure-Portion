const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: String,
    unique: true, // auto-generated
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'grains', 'spices', 'beverages', 'condiments', 'frozen', 'canned', 'other']
  },
  subcategory: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pieces', 'packs', 'bottles', 'cans', 'boxes']
  },
  currentQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  minQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  maxQuantity: {
    type: Number,
    default: null
  },
  costPerUnit: {
    type: Number,
    required: true,
    default: 0
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  location: {
    type: String,
    enum: ['refrigerator', 'freezer', 'pantry', 'storage-room', 'dry-storage'],
    default: 'storage-room'
  },
  expiryDate: {
    type: Date,
    default: null
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  batchNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'expired'],
    default: 'in-stock'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Auto-generate itemId before validation
inventorySchema.pre('validate', async function(next) {
  if (this.isNew && !this.itemId) {
    try {
      const lastItem = await this.constructor.findOne({ restaurantId: this.restaurantId }).sort({ createdAt: -1 });
      if (lastItem && lastItem.itemId) {
        const lastId = parseInt(lastItem.itemId.split('-')[1]);
        this.itemId = `ITEM-${(lastId + 1).toString().padStart(4, '0')}`;
      } else {
        this.itemId = 'ITEM-0001';
      }
    } catch (err) {
      return next(err);
    }
  }
  
  // Auto-update status based on quantity
  if (this.currentQuantity <= 0) {
    this.status = 'out-of-stock';
  } else if (this.currentQuantity <= this.minQuantity) {
    this.status = 'low-stock';
  } else if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'expired';
  } else {
    this.status = 'in-stock';
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
inventorySchema.index({ restaurantId: 1, category: 1 });
inventorySchema.index({ restaurantId: 1, status: 1 });
inventorySchema.index({ restaurantId: 1, expiryDate: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);