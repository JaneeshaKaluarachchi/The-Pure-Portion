const mongoose = require('mongoose');
const FinanceRecord = require('../models/FinanceRecord');
const Staff = require('../models/Staff');
const StaffLoan = require('../models/StaffLoan');
const Inventory = require('../models/Inventory');

// Get daily profit
const getDailyProfit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await FinanceRecord.find({
      restaurantId: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('staffId', 'firstName lastName position');

    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expenses = records.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);
    const profit = income - expenses;

    const breakdown = {
      income: {
        sales: records.filter(r => r.category === 'sales').reduce((sum, r) => sum + r.amount, 0),
        catering: records.filter(r => r.category === 'catering').reduce((sum, r) => sum + r.amount, 0),
        delivery: records.filter(r => r.category === 'delivery').reduce((sum, r) => sum + r.amount, 0),
        other: records.filter(r => r.category === 'other_income').reduce((sum, r) => sum + r.amount, 0)
      },
      expenses: {
        staff: records.filter(r => ['staff_payment', 'bonus'].includes(r.type)).reduce((sum, r) => sum + r.amount, 0),
        inventory: records.filter(r => r.type === 'inventory_cost').reduce((sum, r) => sum + r.amount, 0),
        utilities: records.filter(r => r.category === 'utilities').reduce((sum, r) => sum + r.amount, 0),
        rent: records.filter(r => r.category === 'rent').reduce((sum, r) => sum + r.amount, 0),
        other: records.filter(r => r.type === 'expense' && !['utilities', 'rent'].includes(r.category)).reduce((sum, r) => sum + r.amount, 0)
      }
    };

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        totalIncome: income,
        totalExpenses: expenses,
        profit,
        breakdown,
        records: records.slice(0, 10) // Latest 10 records
      }
    });
  } catch (error) {
    console.error('Error getting daily profit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily profit',
      error: error.message
    });
  }
};

// Get monthly profit
const getMonthlyProfit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { month, year } = req.query;
    
    const targetDate = new Date();
    const targetMonth = month ? parseInt(month) : targetDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : targetDate.getFullYear();

    const records = await FinanceRecord.find({
      restaurantId: userId,
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, targetMonth] },
          { $eq: [{ $year: '$date' }, targetYear] }
        ]
      }
    }).populate('staffId', 'firstName lastName position');

    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expenses = records.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);
    const profit = income - expenses;

    // Daily breakdown for the month
    const dailyData = {};
    records.forEach(record => {
      const day = record.date.getDate();
      if (!dailyData[day]) {
        dailyData[day] = { income: 0, expenses: 0, profit: 0 };
      }
      if (record.type === 'income') {
        dailyData[day].income += record.amount;
      } else {
        dailyData[day].expenses += record.amount;
      }
      dailyData[day].profit = dailyData[day].income - dailyData[day].expenses;
    });

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        totalIncome: income,
        totalExpenses: expenses,
        profit,
        dailyBreakdown: dailyData,
        recordCount: records.length
      }
    });
  } catch (error) {
    console.error('Error getting monthly profit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly profit',
      error: error.message
    });
  }
};

// Add finance record
const addFinanceRecord = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { type, category, amount, description, date, paymentMethod, invoiceNumber, notes } = req.body;

    const financeRecord = new FinanceRecord({
      restaurantId: userId,
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      invoiceNumber,
      notes,
      createdBy: userId
    });

    await financeRecord.save();

    res.json({
      success: true,
      message: 'Finance record added successfully',
      record: financeRecord
    });
  } catch (error) {
    console.error('Error adding finance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add finance record',
      error: error.message
    });
  }
};

// Get inventory costs
const getInventoryCosts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const inventoryCosts = await FinanceRecord.find({
      restaurantId: userId,
      type: 'inventory_cost',
      ...dateFilter
    }).sort({ date: -1 });

    const totalCost = inventoryCosts.reduce((sum, record) => sum + record.amount, 0);

    // Get current inventory value
    const currentInventoryValue = await Inventory.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
    ]);

    res.json({
      success: true,
      data: {
        totalInventoryCosts: totalCost,
        currentInventoryValue: currentInventoryValue[0]?.totalValue || 0,
        records: inventoryCosts,
        recordCount: inventoryCosts.length
      }
    });
  } catch (error) {
    console.error('Error getting inventory costs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory costs',
      error: error.message
    });
  }
};

// Process staff payment
const processStaffPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { 
      staffId, 
      basicSalary, 
      overtime = 0, 
      allowances = 0, 
      deductions = 0,
      paymentMethod = 'bank_transfer',
      paymentDate,
      notes 
    } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const grossPay = parseFloat(basicSalary) + parseFloat(overtime) + parseFloat(allowances);
    const epfEmployee = grossPay * 0.08; // 8% EPF employee contribution
    const epfEmployer = grossPay * 0.12; // 12% EPF employer contribution
    const etf = grossPay * 0.03; // 3% ETF
    const totalDeductions = epfEmployee + parseFloat(deductions);
    const netPay = grossPay - totalDeductions;

    const paymentRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'staff_payment',
      category: 'salary',
      amount: netPay,
      description: `Salary payment for ${staff.firstName} ${staff.lastName}`,
      date: paymentDate ? new Date(paymentDate) : new Date(),
      staffId: staff._id,
      payrollDetails: {
        basicSalary: parseFloat(basicSalary),
        overtime: parseFloat(overtime),
        allowances: parseFloat(allowances),
        epfEmployee,
        epfEmployer,
        etf,
        grossPay,
        netPay
      },
      paymentMethod,
      notes,
      createdBy: userId
    });

    await paymentRecord.save();

    res.json({
      success: true,
      message: 'Staff payment processed successfully',
      paymentRecord
    });
  } catch (error) {
    console.error('Error processing staff payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process staff payment',
      error: error.message
    });
  }
};

// Give bonus
const giveBonus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { staffId, amount, reason, paymentMethod = 'cash' } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const bonusRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'bonus',
      category: 'bonus',
      amount: parseFloat(amount),
      description: `Bonus for ${staff.firstName} ${staff.lastName}: ${reason}`,
      staffId: staff._id,
      paymentMethod,
      notes: reason,
      createdBy: userId
    });

    await bonusRecord.save();

    res.json({
      success: true,
      message: 'Bonus given successfully',
      bonusRecord
    });
  } catch (error) {
    console.error('Error giving bonus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to give bonus',
      error: error.message
    });
  }
};

// Create staff loan
const createStaffLoan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { 
      staffId, 
      loanAmount, 
      interestRate = 0, 
      loanTerm, 
      purpose,
      guarantor 
    } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const loan = new StaffLoan({
      staffId: staff._id,
      restaurantId: userId,
      loanAmount: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      loanTerm: parseInt(loanTerm),
      purpose,
      guarantor,
      approvedBy: userId
    });

    await loan.save();

    // Create finance record for loan disbursement
    const loanRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'loan',
      category: 'loan_disbursement',
      amount: parseFloat(loanAmount),
      description: `Loan disbursement to ${staff.firstName} ${staff.lastName}`,
      staffId: staff._id,
      referenceNumber: loan.loanId,
      notes: purpose,
      createdBy: userId
    });

    await loanRecord.save();

    res.json({
      success: true,
      message: 'Staff loan created successfully',
      loan,
      loanRecord
    });
  } catch (error) {
    console.error('Error creating staff loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff loan',
      error: error.message
    });
  }
};

// Get staff loans
const getStaffLoans = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { status, staffId } = req.query;

    let filter = { restaurantId: userId };
    if (status) filter.status = status;
    if (staffId) filter.staffId = staffId;

    const loans = await StaffLoan.find(filter)
      .populate('staffId', 'firstName lastName position')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      loans
    });
  } catch (error) {
    console.error('Error getting staff loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff loans',
      error: error.message
    });
  }
};

// Process loan payment
const processLoanPayment = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amountPaid, paymentMethod = 'salary_deduction', notes } = req.body;
    const userId = req.user?.id || req.user?._id;

    const loan = await StaffLoan.findById(loanId).populate('staffId', 'firstName lastName position');
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const payment = parseFloat(amountPaid);
    if (payment > loan.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining loan balance'
      });
    }

    // Calculate interest and principal
    const interestAmount = loan.interestRate > 0 ? (loan.remainingAmount * loan.interestRate / 100 / 12) : 0;
    const principalAmount = payment - interestAmount;

    // Update loan
    loan.amountPaid += payment;
    loan.remainingAmount -= payment;
    loan.paymentHistory.push({
      paymentDate: new Date(),
      amountPaid: payment,
      principalAmount,
      interestAmount,
      remainingBalance: loan.remainingAmount,
      paymentMethod,
      notes
    });

    if (loan.remainingAmount <= 0) {
      loan.status = 'completed';
    }

    await loan.save();

    // Create finance record
    const paymentRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'loan_repayment',
      category: 'loan_payment',
      amount: payment,
      description: `Loan repayment from ${loan.staffId.firstName} ${loan.staffId.lastName}`,
      staffId: loan.staffId._id,
      referenceNumber: loan.loanId,
      paymentMethod,
      notes,
      createdBy: userId
    });

    await paymentRecord.save();

    res.json({
      success: true,
      message: 'Loan payment processed successfully',
      loan,
      paymentRecord
    });
  } catch (error) {
    console.error('Error processing loan payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process loan payment',
      error: error.message
    });
  }
};

// Get finance summary
const getFinanceSummary = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get today's data
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecords = await FinanceRecord.find({
      restaurantId: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayIncome = todayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const todayExpenses = todayRecords.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);

    // Get monthly data
    const monthlyRecords = await FinanceRecord.find({
      restaurantId: userId,
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, currentMonth] },
          { $eq: [{ $year: '$date' }, currentYear] }
        ]
      }
    });

    const monthlyIncome = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const monthlyExpenses = monthlyRecords.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);

    // Get active loans
    const activeLoans = await StaffLoan.find({
      restaurantId: userId,
      status: 'active'
    }).populate('staffId', 'firstName lastName position');

    const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

    // Get staff count and total salaries
    const staffCount = await Staff.countDocuments({ restaurantId: userId });
    const totalSalaryBudget = await Staff.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalSalary: { $sum: '$salary' } } }
    ]);

    // Get inventory value
    const inventoryValue = await Inventory.aggregate([
  { $match: { restaurantId: new mongoose.Types.ObjectId(userId) } },
  { 
    $group: { 
      _id: null, 
      totalValue: { $sum: { $multiply: ['$currentQuantity', '$costPerUnit'] } } 
    } 
  }
]);


    res.json({
      success: true,
      summary: {
        today: {
          income: todayIncome,
          expenses: todayExpenses,
          profit: todayIncome - todayExpenses
        },
        thisMonth: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
          profit: monthlyIncome - monthlyExpenses
        },
        loans: {
          activeLoansCount: activeLoans.length,
          totalOutstanding: totalLoanAmount,
          activeLoans: activeLoans.slice(0, 5)
        },
        staff: {
          totalStaff: staffCount,
          monthlySalaryBudget: totalSalaryBudget[0]?.totalSalary || 0
        },
        inventory: {
          currentValue: inventoryValue[0]?.totalValue || 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting finance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get finance summary',
      error: error.message
    });
  }
};

// Get all finance records with pagination
const getFinanceRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    const userId = req.user?.id || req.user?._id;

    let filter = { restaurantId: userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const records = await FinanceRecord.find(filter)
      .populate('staffId', 'firstName lastName position')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FinanceRecord.countDocuments(filter);

    res.json({
      success: true,
      records,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting finance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get finance records',
      error: error.message
    });
  }
};

module.exports = {
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
};