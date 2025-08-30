const express = require('express');
const router = express.Router();
const {
  createPortionPlan,
  getAllPortionPlans,
  getPortionPlanById,
  executePortionPlan,
  generatePDF,
  deletePortionPlan
} = require('../controllers/portionController');

// Create portion plan
router.post('/', createPortionPlan);

// Get all portion plans
router.get('/', getAllPortionPlans);

// Get portion plan by ID
router.get('/:id', getPortionPlanById);

// Execute portion plan (deduct inventory for restaurants)
router.post('/:id/execute', executePortionPlan);

// Generate PDF
router.get('/:id/pdf', generatePDF);

// Delete portion plan
router.delete('/:id', deletePortionPlan);

module.exports = router;