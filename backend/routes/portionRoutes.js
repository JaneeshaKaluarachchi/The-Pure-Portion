const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPortionPlan,
  getAllPortionPlans,
  getPortionPlanById,
  executePortionPlan,
  generatePDF,
  deletePortionPlan
} = require('../controllers/portionController');

// Create portion plan (protected)
router.post('/', auth, createPortionPlan);

// Get all portion plans (protected)
router.get('/', auth, getAllPortionPlans);

// Get portion plan by ID (protected)
router.get('/:id', auth, getPortionPlanById);

// Execute portion plan (deduct inventory for restaurants, protected)
router.post('/:id/execute', auth, executePortionPlan);

// Generate PDF (protected)
router.get('/:id/pdf', auth, generatePDF);

// Delete portion plan (protected)
router.delete('/:id', auth, deletePortionPlan);

module.exports = router;
