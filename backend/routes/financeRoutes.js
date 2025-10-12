const express = require('express');
const router = express.Router();
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
  getFinanceRecords,
  getStaffPerformanceData,
  generateFinanceReport,
  getStaffPaymentHistory,
  generatePaymentReceipt,
  generatePaymentHistoryPDF
} = require('../controllers/financeController');
const auth = require('../middleware/auth');
const FinanceRecord = require('../models/FinanceRecord'); // import model once at the top

// Finance summary and reports
router.get('/summary', auth, getFinanceSummary);
router.get('/daily-profit', auth, getDailyProfit);
router.get('/monthly-profit', auth, getMonthlyProfit);
router.get('/inventory-costs', auth, getInventoryCosts);
router.get('/records', auth, getFinanceRecords);
router.get('/report/pdf', auth, generateFinanceReport);

// Delete a finance record
router.delete('/records/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const record = await FinanceRecord.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    await record.deleteOne(); // safer than remove()
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Staff performance data for bonus calculation
router.get('/staff-performance', auth, getStaffPerformanceData);

// Finance records
router.post('/records', auth, addFinanceRecord);

// Staff payments and bonuses
router.post('/staff-payment', auth, processStaffPayment);
router.post('/bonus', auth, giveBonus);

// Staff payment history and receipts
router.get('/staff-payments/:staffId', auth, getStaffPaymentHistory);
router.get('/payment-receipt/:paymentId', auth, generatePaymentReceipt);
router.get('/payment-history-pdf/:staffId', auth, generatePaymentHistoryPDF);

// Loans
router.post('/loans', auth, createStaffLoan);
router.get('/loans', auth, getStaffLoans);
router.post('/loans/:loanId/payment', auth, processLoanPayment);

module.exports = router;
