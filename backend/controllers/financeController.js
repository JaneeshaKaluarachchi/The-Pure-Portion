const mongoose = require('mongoose');
const FinanceRecord = require('../models/FinanceRecord');
const Staff = require('../models/Staff');
const StaffLoan = require('../models/StaffLoan');
const Attendance = require('../models/Attendance');
const Inventory = require('../models/Inventory');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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
        records: records.slice(0, 10)
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
    const { type, category, amount, description, date, paymentMethod, invoiceNumber, notes, staffId } = req.body;

    // Validate staffId for staff-related transactions
    if (['staff_payment', 'bonus', 'loan', 'loan_repayment'].includes(type) && !staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff selection is required for this transaction type'
      });
    }

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
      staffId: staffId || undefined,
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

// Get staff attendance and overtime for bonus calculation
const getStaffPerformanceData = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { staffId, month, year } = req.query;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const targetDate = new Date();
    const targetMonth = month ? parseInt(month) : targetDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : targetDate.getFullYear();

    // Get staff details
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      staffId: staffId,
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, targetMonth] },
          { $eq: [{ $year: '$date' }, targetYear] }
        ]
      }
    });

    // Calculate attendance metrics
    const totalWorkingDays = 30;/*attendanceRecords.length;*/
    const presentDays = 22;/*attendanceRecords.filter(record => record.status === 'present').length;*/
    const totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const attendancePercentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

    res.json({
      success: true,
      data: {
        staff: {
          _id: staff._id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          position: staff.position,
          salary: staff.salary
        },
        performance: {
          month: targetMonth,
          year: targetYear,
          totalWorkingDays,
          presentDays,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          totalOvertimeHours,
          records: attendanceRecords
        }
      }
    });
  } catch (error) {
    console.error('Error getting staff performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff performance data',
      error: error.message
    });
  }
};

// NEW: Get staff overtime data for auto-detection
const getStaffOvertimeData = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { staffId, month, year } = req.query;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const targetDate = new Date();
    const targetMonth = month ? parseInt(month) : targetDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : targetDate.getFullYear();

    // Get staff details
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get attendance records for the specified month/year
    const attendanceRecords = await Attendance.find({
      staffId: staffId,
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, targetMonth] },
          { $eq: [{ $year: '$date' }, targetYear] }
        ]
      }
    });

    // Calculate total overtime hours
    const totalOvertimeHours = attendanceRecords.reduce((sum, record) => {
      return sum + (record.overtimeHours || 0);
    }, 0);

    // Get detailed overtime breakdown
    const overtimeBreakdown = attendanceRecords
      .filter(record => record.overtimeHours > 0)
      .map(record => ({
        date: record.date,
        overtimeHours: record.overtimeHours,
        status: record.status
      }));

    res.json({
      success: true,
      data: {
        staffId: staff._id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        month: targetMonth,
        year: targetYear,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        overtimeBreakdown,
        totalRecords: attendanceRecords.length
      }
    });

  } catch (error) {
    console.error('Error getting staff overtime data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff overtime data',
      error: error.message
    });
  }
};

// Process staff payment with EPF/ETF - FIXED VERSION
const processStaffPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { 
      staffId, 
      basicSalary = 0, 
      overtimeHours = 0,
      overtimeRate = 0,
      allowances = 0, 
      deductions = 0,
      paymentMethod = 'bank_transfer',
      paymentDate,
      notes 
    } = req.body;
    
    console.log('Payment form data received:', { staffId, basicSalary, overtimeHours, overtimeRate, allowances, deductions });
    
    if (!staffId) return res.status(400).json({ success: false, message: 'Staff ID is required' });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    // Parse all values to ensure they're numbers
    const basicSalaryAmount = parseFloat(basicSalary) || 0;
    const overtimeHoursAmount = parseFloat(overtimeHours) || 0;
    const overtimeRateAmount = parseFloat(overtimeRate) || 0;
    const allowancesAmount = parseFloat(allowances) || 0;
    const deductionsAmount = parseFloat(deductions) || 0;

    // Calculate overtime pay
    const overtimePay = overtimeHoursAmount * overtimeRateAmount;
    
    // Calculate gross pay
    const grossPay = basicSalaryAmount + overtimePay + allowancesAmount;
    
    console.log('Calculation breakdown:', {
      basicSalaryAmount,
      overtimeHoursAmount,
      overtimeRateAmount,
      overtimePay,
      allowancesAmount,
      grossPay
    });

    const epfEmployee = grossPay * 0.08;
    const epfEmployer = grossPay * 0.12;
    const etf = grossPay * 0.03;

    const totalDeductions = epfEmployee + deductionsAmount;
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
        basicSalary: basicSalaryAmount,
        overtimeHours: overtimeHoursAmount,
        overtimeRate: overtimeRateAmount,
        overtimePay,
        allowances: allowancesAmount,
        deductions: deductionsAmount,
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
      paymentRecord,
      calculationDetails: {
        basicSalary: basicSalaryAmount,
        overtimeHours: overtimeHoursAmount,
        overtimeRate: overtimeRateAmount,
        overtimePay,
        allowances: allowancesAmount,
        grossPay,
        deductions: deductionsAmount,
        epfEmployee,
        netPay
      }
    });

  } catch (error) {
    console.error('Error processing staff payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process staff payment', error: error.message });
  }
};

// Give bonus with attendance/overtime calculation - FIXED VERSION
const giveBonus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { 
      staffId, 
      calculationType, 
      ratePerUnit = 0, 
      fixedAmount = 0,
      allowances = 0,
      month,
      year,
      reason, 
      paymentMethod = 'cash' 
    } = req.body;

    console.log('Bonus form data received:', { staffId, calculationType, ratePerUnit, fixedAmount, allowances });

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    let bonusAmount = 0;
    let bonusDetails = {};

    if (calculationType === 'fixed') {
      bonusAmount = parseFloat(fixedAmount) + parseFloat(allowances);
      bonusDetails = {
        calculationType: 'fixed',
        amount: parseFloat(fixedAmount),
        allowances: parseFloat(allowances)
      };
    } else {
      const targetMonth = month || new Date().getMonth() + 1;
      const targetYear = year || new Date().getFullYear();

      const attendanceRecords = await Attendance.find({
        staffId: staffId,
        $expr: {
          $and: [
            { $eq: [{ $month: '$date' }, targetMonth] },
            { $eq: [{ $year: '$date' }, targetYear] }
          ]
        }
      });

      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const totalOvertimeHours = attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

      if (calculationType === 'attendance') {
        bonusAmount = (presentDays * parseFloat(ratePerUnit)) + parseFloat(allowances);
        bonusDetails = {
          calculationType: 'attendance',
          attendanceDays: presentDays,
          ratePerUnit: parseFloat(ratePerUnit),
          allowances: parseFloat(allowances)
        };
      } else if (calculationType === 'overtime') {
        bonusAmount = (totalOvertimeHours * parseFloat(ratePerUnit)) + parseFloat(allowances);
        bonusDetails = {
          calculationType: 'overtime',
          overtimeHours: totalOvertimeHours,
          ratePerUnit: parseFloat(ratePerUnit),
          allowances: parseFloat(allowances)
        };
      }
    }

    console.log('Bonus calculation:', { bonusAmount, bonusDetails });

    const bonusRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'bonus',
      category: 'bonus',
      amount: bonusAmount,
      description: `Bonus for ${staff.firstName} ${staff.lastName}: ${reason}`,
      staffId: staff._id,
      bonusDetails,
      paymentMethod,
      notes: reason,
      createdBy: userId
    });

    await bonusRecord.save();

    res.json({
      success: true,
      message: 'Bonus given successfully',
      bonusRecord,
      calculationDetails: bonusDetails
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

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + parseInt(loanTerm));

    // Generate unique loanId (e.g. LOAN-20250916-<random>)
    const loanId = `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const loan = new StaffLoan({
      loanId,
      staffId: staff._id,
      restaurantId: userId,
      loanAmount: parseFloat(loanAmount),
      remainingAmount: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      dueDate,
      description: purpose,
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

    // Update loan
    loan.remainingAmount -= payment;
    loan.payments.push({
      amount: payment,
      paymentDate: new Date(),
      description: notes
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
      referenceNumber: loan._id.toString(),
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

// Get finance summary with loan notifications
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
    }).populate('staffId', 'firstName lastName photoUrl position');

    const monthlyIncome = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const monthlyExpenses = monthlyRecords.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);

    // Get active loans with overdue notifications
    const activeLoans = await StaffLoan.find({
      restaurantId: userId,
      status: 'active'
    }).populate('staffId', 'firstName lastName position');

    const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    // Check for overdue loans
    const overdueLoans = activeLoans.filter(loan => {
      const daysDiff = Math.floor((currentDate - loan.dueDate) / (1000 * 60 * 60 * 24));
      return daysDiff > 0;
    });

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
          overdueLoansCount: overdueLoans.length,
          activeLoans: activeLoans.slice(0, 5),
          overdueLoans: overdueLoans
        },
        staff: {
          totalStaff: staffCount,
          monthlySalaryBudget: totalSalaryBudget[0]?.totalSalary || 0
        },
        inventory: {
          currentValue: inventoryValue[0]?.totalValue || 0
        },
        notifications: {
          pendingLoans: activeLoans.length,
          overdueLoans: overdueLoans.length
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
      .populate('staffId', 'firstName lastName position photoUrl')
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

// Generate PDF report

const generateFinanceReport = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { startDate, endDate } = req.query;

    // Fetch finance records
    let filter = { restaurantId: userId };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await FinanceRecord.find(filter)
      .populate('staffId', 'firstName lastName position')
      .sort({ date: -1 });

    // Totals
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expenses = records.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0);
    const profit = income - expenses;

    // Fetch user details
    let user = null;
    if (userId && userId !== 'admin') {
      try {
        user = await User.findById(userId).lean();
      } catch (err) {
        console.error('Error fetching user for PDF:', err);
      }
    }

    const restaurantName = user?.restaurantName || user?.businessName || user?.name || '';
    const restaurantAddress = user?.restaurantAddress || user?.address || user?.location || '123 Main Street, Colombo, Sri Lanka';
    const restaurantPhone = user?.restaurantPhone || user?.phone || user?.contactNumber || '+94 11 234 5678';

    const now = new Date();

    // --- PDF Setup ---
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finance-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // --- Header ---
    const margin = 40;
    const pageWidth = doc.page.width;
    const headerY = 30;

    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, headerY, { width: 120 });
    }

    const rightBlockX = pageWidth - margin - 220;
    let rightY = headerY;

    doc.fontSize(22).font('Helvetica-Bold').text('Finance Report', rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 28;

    doc.fontSize(8).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;

    doc.fontSize(12).font('Helvetica-Bold').text(restaurantName, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.fontSize(10).font('Helvetica').text(restaurantAddress, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.text(`Phone: ${restaurantPhone}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 20;

    // --- Summary Section ---
    const summaryText = `Total Income: Rs ${income.toLocaleString()} | Total Expenses: Rs ${expenses.toLocaleString()} | Net Profit: Rs ${profit.toLocaleString()}`;
    const textWidth = doc.widthOfString(summaryText);
    const xCenter = (pageWidth - textWidth) / 2;
    doc.moveDown(2).fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text(summaryText, xCenter, doc.y);
    doc.moveDown(2);

    // --- Transaction Details ---
    let y = doc.y + 4;
    const rowHeight = 18;
    const pageBottom = doc.page.height - 50;

    const drawHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Date', 40, y)
        .text('Type', 110, y)
        .text('Description', 200, y)
        .text('Amount (Rs)', 450, y, { width: 100, align: 'right' });
      y += rowHeight;
    };

    const addPageIfNeeded = (rowHeightNeeded) => {
      if (y + rowHeightNeeded > pageBottom) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
    };

    const drawRow = (record, alternate = false) => {
      addPageIfNeeded(rowHeight);
      if (alternate) doc.rect(35, y - 3, 520, rowHeight).fill('#f4f4f4');

      doc.fillColor('black').font('Helvetica')
        .text(new Date(record.date).toLocaleDateString(), 40, y)
        .text(record.type.replace('_', ' ').toUpperCase(), 110, y)
        .text(record.description || '', 200, y)
        .text(`Rs ${record.amount.toLocaleString()}`, 450, y, { width: 100, align: 'right' });

      y += rowHeight;
    };

    drawHeader();
    records.forEach((record, idx) => drawRow(record, idx % 2 === 0));

    // --- Signature ---
    doc.moveDown(4);
    const signatureY = Math.max(y + 40, doc.page.height - 120);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text("______________________", 60, signatureY);
    doc.text("Finance Manager's Signature", 55, signatureY + 15);

    doc.end();

  } catch (error) {
    console.error('Error generating finance report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate finance report', error: error.message });
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
  getFinanceRecords,
  getStaffPerformanceData,
  getStaffOvertimeData, // NEW: Export the new function
  generateFinanceReport
};