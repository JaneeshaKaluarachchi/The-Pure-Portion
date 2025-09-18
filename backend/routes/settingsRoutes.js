const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Protected routes - require authentication
router.use(auth);

// Settings routes
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;