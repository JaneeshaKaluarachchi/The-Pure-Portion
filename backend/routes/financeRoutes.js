const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDailyProfit,
  getMonthlyProfit,
  addFinanceRecord,
  getInventoryCosts,
  processStaffPayment,
  giveBonus,
  createStaffLoan,
  getStaffLoans,
  processLoanPayment,
  getFinanceSummary,
  getFinanceRecords
} = require('../controllers/financeController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Finance summary and analytics
router.get('/summary', getFinanceSummary);
router.get('/daily-profit', getDailyProfit);
router.get('/monthly-profit', getMonthlyProfit);
router.get('/inventory-costs', getInventoryCosts);

// Finance records management
router.get('/records', getFinanceRecords);
router.post('/records', addFinanceRecord);

// Staff payments and payroll
router.post('/staff-payment', processStaffPayment);
router.post('/bonus', giveBonus);

// Staff loans management
router.get('/loans', getStaffLoans);
router.post('/loans', createStaffLoan);
router.post('/loans/:loanId/payment', processLoanPayment);

module.exports = router;