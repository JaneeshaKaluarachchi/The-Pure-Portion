const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const staffRoutes = require('./routes/staffRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const portionRoutes = require('./routes/portionRoutes');
const leftoverRoutes = require('./routes/leftoverRoutes');
const financeRoutes = require('./routes/financeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const RestaurantSettings =  require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅🎉 Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌🔥 MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance',attendanceRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/portions', portionRoutes);
app.use('/api/leftovers', leftoverRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/settings',RestaurantSettings);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);


// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'PurePortion Backend API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});