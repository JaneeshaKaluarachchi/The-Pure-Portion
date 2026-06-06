const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'recipe-suggestion', 'ingredient-analysis', 'nutrition-info'],
    default: 'text'
  },
  context: {
    leftovers: [{
      name: String,
      quantity: Number,
      unit: String
    }],
    suggestedRecipes: [{
      name: String,
      difficulty: String,
      cookTime: String,
      ingredients: [String]
    }]
  },
  metadata: {
    responseTime: Number,
    confidence: Number,
    source: String
  }
}, {
  timestamps: true
});

// Auto-delete messages older than 30 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);