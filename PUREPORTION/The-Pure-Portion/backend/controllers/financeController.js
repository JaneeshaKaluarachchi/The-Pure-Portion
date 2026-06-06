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
    const totalWorkingDays = attendanceRecords.length;
    // Count records where status is 'in' or 'out' (not 'absent') as present days
    const presentDays = attendanceRecords.filter(record => record.status === 'in' || record.status === 'out').length;
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
      paymentMonth,
      paymentYear,
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
      paymentMonth: paymentMonth || new Date().getMonth() + 1,
      paymentYear: paymentYear || new Date().getFullYear(),
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

      // Count records where status is 'in' or 'out' (not 'absent') as present days
      const presentDays = attendanceRecords.filter(r => r.status === 'in' || r.status === 'out').length;
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

    // Determine payment month and year - ensure they are numbers
    const bonusMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const bonusYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const bonusRecord = new FinanceRecord({
      restaurantId: userId,
      type: 'bonus',
      category: 'bonus',
      amount: bonusAmount,
      description: `Bonus for ${staff.firstName} ${staff.lastName}: ${reason}`,
      staffId: staff._id,
      bonusDetails,
      paymentMonth: bonusMonth,
      paymentYear: bonusYear,
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

// Get staff payment history
const getStaffPaymentHistory = async (req, res) => {
  try {
    const { staffId } = req.params;
    const userId = req.user?.id || req.user?._id;

    console.log('Fetching payment history for staff:', staffId);

    // Find all finance records for this staff member including payments and bonuses
    const payments = await FinanceRecord.find({
      restaurantId: userId,
      staffId: staffId,
      type: { $in: ['staff_payment', 'bonus'] } // Include both payments and bonuses
    })
      .sort({ date: -1 })
      .limit(50)
      .populate('staffId', 'firstName lastName position');

    console.log(`Found ${payments.length} payment records`);

    res.json({
      success: true,
      payments: payments
    });
  } catch (error) {
    console.error('Get staff payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Generate single payment receipt PDF
const generatePaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const payment = await FinanceRecord.findById(paymentId)
      .populate('staffId', 'firstName lastName position department');

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Get user details for restaurant info
    let user = null;
    if (userId && userId !== 'admin') {
      try {
        user = await User.findById(userId).lean();
      } catch (err) {
        console.error('Error fetching user for PDF:', err);
      }
    }

    const restaurantName = user?.restaurantName || user?.businessName || user?.name || 'Pure Portions';
    const restaurantAddress = user?.restaurantAddress || user?.address || user?.location || '123 Main Street, Colombo, Sri Lanka';
    const restaurantPhone = user?.restaurantPhone || user?.phone || user?.phoneNumber || user?.contactNumber || '+94 11 234 5678';

    const now = new Date();

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payment-receipt-${payment._id}.pdf"`);
    doc.pipe(res);

    // Header setup
    const margin = 40;
    const pageWidth = doc.page.width;
    const headerY = 30;

    // Logo (left)
    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, headerY, { width: 120 });
    }

    // Right-aligned block
    const rightBlockX = pageWidth - margin - 220;
    let rightY = headerY;

    // Title - check if bonus or regular payment
    const isBonus = payment.type === 'bonus';
    const titleText = isBonus ? 'Bonus Receipt' : 'Payment Receipt';
    doc.fontSize(22).font('Helvetica-Bold').text(titleText, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 28;

    // Generated date
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;

    // Restaurant Info
    doc.fontSize(12).font('Helvetica-Bold').text(restaurantName, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.fontSize(10).font('Helvetica').text(restaurantAddress, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.text(`Phone: ${restaurantPhone}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 20;

    // Staff and payment details
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Staff Information', margin, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text(`Name: ${payment.staffId?.firstName} ${payment.staffId?.lastName}`);
    doc.text(`Position: ${payment.staffId?.position || 'N/A'}`);
    doc.text(`Department: ${payment.staffId?.department || 'N/A'}`);
    doc.moveDown(1);

    // Payment period
    const monthName = new Date(0, (payment.paymentMonth || 1) - 1).toLocaleString('default', { month: 'long' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Payment Period', margin, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text(`Month: ${monthName} ${payment.paymentYear || new Date().getFullYear()}`);
    doc.text(`Payment Date: ${new Date(payment.date || payment.createdAt).toLocaleDateString()}`);
    doc.moveDown(2);

    // Payment breakdown table
    let y = doc.y;
    const rowHeight = 25;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
    doc.rect(margin, y, 520, rowHeight).fill(isBonus ? '#f59e0b' : '#34495e');
    doc.fillColor('white')
      .text('Description', margin + 10, y + 8)
      .text('Amount (Rs)', pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
    y += rowHeight;

    // Check if this is a bonus receipt
    if (isBonus) {
      // BONUS RECEIPT DETAILS
      const bonusDetails = payment.bonusDetails || {};
      const calculationType = bonusDetails.calculationType || 'fixed';
      const bonusAllowances = bonusDetails.allowances || 0;

      // Bonus breakdown section
      doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
      doc.rect(margin, y, 520, rowHeight).fill('#fef3c7');
      doc.fillColor('#92400e').text('BONUS PAYMENT', margin + 10, y + 8);
      y += rowHeight;

      let alternate = true;
      const bonusRows = [];

      if (calculationType === 'fixed') {
        bonusRows.push({ label: 'Fixed Bonus Amount', amount: bonusDetails.amount || payment.amount });
      } else if (calculationType === 'attendance') {
        const days = bonusDetails.attendanceDays || 0;
        const rate = bonusDetails.ratePerUnit || 0;
        bonusRows.push({ label: `Attendance Days: ${days} days`, amount: 0, showAmount: false });
        bonusRows.push({ label: `Rate per Day: Rs ${rate.toFixed(2)}`, amount: 0, showAmount: false });
        bonusRows.push({ label: 'Calculated Amount', amount: days * rate });
      } else if (calculationType === 'overtime') {
        const hours = bonusDetails.overtimeHours || 0;
        const rate = bonusDetails.ratePerUnit || 0;
        bonusRows.push({ label: `Overtime Hours: ${hours} hrs`, amount: 0, showAmount: false });
        bonusRows.push({ label: `Rate per Hour: Rs ${rate.toFixed(2)}`, amount: 0, showAmount: false });
        bonusRows.push({ label: 'Calculated Amount', amount: hours * rate });
      }

      if (bonusAllowances > 0) {
        bonusRows.push({ label: 'Additional Allowances', amount: bonusAllowances });
      }

      bonusRows.forEach(row => {
        if (alternate) doc.rect(margin, y, 520, rowHeight).fill('#f4f4f4');
        doc.fillColor('black').font('Helvetica')
          .text(row.label, margin + 20, y + 8);
        if (row.showAmount !== false) {
          doc.text(row.amount.toFixed(2), pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
        }
        y += rowHeight;
        alternate = !alternate;
      });

      // Total Bonus
      doc.fontSize(12).font('Helvetica-Bold').fillColor('white');
      doc.rect(margin, y, 520, rowHeight).fill('#f59e0b');
      doc.fillColor('white')
        .text('TOTAL BONUS', margin + 10, y + 8)
        .text(`Rs ${payment.amount.toFixed(2)}`, pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
      y += rowHeight + 10;

    } else {
      // REGULAR PAYMENT RECEIPT DETAILS
      // Get values from payrollDetails or fallback to root level
      const basicSalary = payment.payrollDetails?.basicSalary || payment.basicSalary || 0;
      const allowances = payment.payrollDetails?.allowances || payment.allowances || 0;
      const overtimeHours = payment.payrollDetails?.overtimeHours || payment.overtimeHours || 0;
      const overtimeRate = payment.payrollDetails?.overtimeRate || payment.overtimeRate || 0;
      const overtimePay = payment.payrollDetails?.overtimePay || (overtimeHours * overtimeRate) || 0;
      const deductions = payment.payrollDetails?.deductions || payment.deductions || 0;
      const epfEmployee = payment.payrollDetails?.epfEmployee || 0;
      const epfEmployer = payment.payrollDetails?.epfEmployer || 0;
      const etf = payment.payrollDetails?.etf || 0;
      const grossPay = payment.payrollDetails?.grossPay || (basicSalary + allowances + overtimePay) || 0;
      const netPay = payment.payrollDetails?.netPay || payment.amount || 0;

      // Table rows - Earnings Section
      const earnings = [
        { label: 'Basic Salary', amount: basicSalary, show: true },
        { label: 'Allowances', amount: allowances, show: allowances > 0 },
        { label: `Overtime (${overtimeHours} hrs @ Rs${overtimeRate}/hr)`, amount: overtimePay, show: overtimePay > 0 }
      ];

      // Gross Pay subtotal
      doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
      doc.text('EARNINGS:', margin + 10, y + 8);
      y += rowHeight;

      let alternate = true;
      earnings.forEach(row => {
        if (row.show) {
          if (alternate) doc.rect(margin, y, 520, rowHeight).fill('#f4f4f4');
          doc.fillColor('black').font('Helvetica')
            .text(row.label, margin + 20, y + 8)
            .text(row.amount.toFixed(2), pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
          y += rowHeight;
          alternate = !alternate;
        }
      });

      // Gross Pay
      doc.fontSize(11).font('Helvetica-Bold').fillColor('white');
      doc.rect(margin, y, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Gross Pay', margin + 20, y + 8)
        .text(grossPay.toFixed(2), pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
      y += rowHeight;

      // Deductions Section
      doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
      doc.text('DEDUCTIONS:', margin + 10, y + 8);
      y += rowHeight;

      const deductionRows = [
        { label: 'EPF (Employee 8%)', amount: epfEmployee, show: epfEmployee > 0 },
        { label: 'Other Deductions', amount: deductions, show: deductions > 0 }
      ];

      alternate = true;
      deductionRows.forEach(row => {
        if (row.show) {
          if (alternate) doc.rect(margin, y, 520, rowHeight).fill('#f4f4f4');
          doc.fillColor('#c0392b').font('Helvetica')
            .text(row.label, margin + 20, y + 8)
            .text(`-${row.amount.toFixed(2)}`, pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
          y += rowHeight;
          alternate = !alternate;
        }
      });

      // Net Payment
      doc.fontSize(12).font('Helvetica-Bold').fillColor('white');
      doc.rect(margin, y, 520, rowHeight).fill('#27ae60');
      doc.fillColor('white')
        .text('NET PAYMENT', margin + 10, y + 8)
        .text(`Rs ${netPay.toFixed(2)}`, pageWidth - margin - 150, y + 8, { width: 140, align: 'right' });
      y += rowHeight + 10;

      // Employer Contributions (informational)
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('EMPLOYER CONTRIBUTIONS (For Information):', margin, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d');
      doc.text(`EPF (Employer 12%): Rs ${epfEmployer.toFixed(2)}`, margin + 20);
      doc.text(`ETF (3%): Rs ${etf.toFixed(2)}`, margin + 20);
      doc.moveDown(0.5);
    } // End of if-else for bonus vs regular payment

    // Payment method
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text(`Payment Method: ${payment.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}`);

    if (payment.notes) {
      doc.moveDown(0.5);
      doc.text(`Notes: ${payment.notes}`);
    }

    // Signature
    doc.moveDown(4);
    const signatureY = Math.max(y + 60, doc.page.height - 120);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text("______________________", 60, signatureY);
    doc.text("Manager's Signature", 80, signatureY + 15);

    doc.end();
  } catch (error) {
    console.error('Generate payment receipt error:', error);
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};

// Generate complete payment history PDF for a staff member
const generatePaymentHistoryPDF = async (req, res) => {
  try {
    const { staffId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const payments = await FinanceRecord.find({
      restaurantId: userId,
      staffId: staffId,
      type: { $in: ['staff_payment', 'bonus'] }
    }).sort({ date: -1 });

    // Get user details
    let user = null;
    if (userId && userId !== 'admin') {
      try {
        user = await User.findById(userId).lean();
      } catch (err) {
        console.error('Error fetching user for PDF:', err);
      }
    }

    const restaurantName = user?.restaurantName || user?.businessName || user?.name || 'Pure Portions';
    const restaurantAddress = user?.restaurantAddress || user?.address || user?.location || '123 Main Street, Colombo, Sri Lanka';
    const restaurantPhone = user?.restaurantPhone || user?.phone || user?.phoneNumber || user?.contactNumber || '+94 11 234 5678';

    const now = new Date();

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payment-history-${staff.firstName}-${staff.lastName}.pdf"`);
    doc.pipe(res);

    // Header setup
    const margin = 40;
    const pageWidth = doc.page.width;
    const headerY = 30;

    // Logo (left)
    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, headerY, { width: 120 });
    }

    // Right-aligned block
    const rightBlockX = pageWidth - margin - 220;
    let rightY = headerY;

    // Title - single line to avoid overlap
    doc.fontSize(18).font('Helvetica-Bold').text('Payment History Report', rightBlockX, rightY, { width: 220, align: 'right', lineBreak: false });
    rightY += 24;

    // Generated date
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;

    // Restaurant Info
    doc.fontSize(12).font('Helvetica-Bold').text(restaurantName, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.fontSize(10).font('Helvetica').text(restaurantAddress, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 16;
    doc.text(`Phone: ${restaurantPhone}`, rightBlockX, rightY, { width: 220, align: 'right' });
    rightY += 20;

    // Staff summary (centered)
    const regularPaymentsCount = payments.filter(p => p.type !== 'bonus').length;
    const bonusesCount = payments.filter(p => p.type === 'bonus').length;
    const summaryText = `Staff: ${staff.firstName} ${staff.lastName}   |   Position: ${staff.position}   |   Payments: ${regularPaymentsCount}   |   Bonuses: ${bonusesCount}`;
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    const textWidth = doc.widthOfString(summaryText);
    const xCenter = (pageWidth - textWidth) / 2;
    doc.text(summaryText, xCenter, doc.y);
    doc.moveDown(2);

    // Payment history table
    let y = doc.y + 10;
    const rowHeight = 18;
    const pageBottom = doc.page.height - 50;

    const drawHeader = () => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
      doc.fillColor('white')
        .text('Date', 40, y)
        .text('Type', 110, y)
        .text('Period', 175, y)
        .text('Gross', 245, y)
        .text('Deductions', 310, y)
        .text('Net Pay', 400, y, { width: 120, align: 'right' });
      y += rowHeight;
    };

    const addPageIfNeeded = (rowHeightNeeded) => {
      if (y + rowHeightNeeded > pageBottom) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
    };

    const drawRow = (payment, alternate = false) => {
      addPageIfNeeded(rowHeight);

      const isBonus = payment.type === 'bonus';
      
      // Use yellow background for bonus rows
      if (isBonus) {
        doc.rect(35, y - 3, 520, rowHeight).fill('#fef3c7');
      } else if (alternate) {
        doc.rect(35, y - 3, 520, rowHeight).fill('#f4f4f4');
      }

      // Get values from payrollDetails or fallback to root level
      const grossPay = payment.payrollDetails?.grossPay || payment.amount || 0;
      const epfEmployee = payment.payrollDetails?.epfEmployee || 0;
      const deductions = payment.payrollDetails?.deductions || payment.deductions || 0;
      const netPay = payment.payrollDetails?.netPay || payment.amount || 0;

      const monthName = new Date(0, (payment.paymentMonth || 1) - 1).toLocaleString('default', { month: 'short' });
      const totalDeductions = isBonus ? 0 : (epfEmployee + deductions);
      const typeText = isBonus ? '🎁 Bonus' : 'Salary';

      doc.fillColor(isBonus ? '#92400e' : 'black').font('Helvetica').fontSize(9)
        .text(new Date(payment.date || payment.createdAt).toLocaleDateString('en-GB'), 40, y)
        .text(typeText, 110, y)
        .text(`${monthName} ${payment.paymentYear || new Date().getFullYear()}`, 175, y)
        .text(`${grossPay.toFixed(0)}`, 245, y)
        .text(`${totalDeductions.toFixed(0)}`, 310, y)
        .text(`Rs ${netPay.toFixed(2)}`, 400, y, { width: 120, align: 'right' });

      y += rowHeight;
    };

    drawHeader();
    payments.forEach((payment, index) => {
      drawRow(payment, index % 2 === 0);
    });

    // Summary totals
    doc.moveDown(2);
    y += 20;
    if (y > pageBottom - 150) {
      doc.addPage();
      y = 50;
    }

    // Separate regular payments and bonuses
    const regularPayments = payments.filter(p => p.type !== 'bonus');
    const bonuses = payments.filter(p => p.type === 'bonus');

    const totalBasicSalary = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.basicSalary || p.basicSalary || 0), 0);
    const totalAllowances = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.allowances || p.allowances || 0), 0);
    const totalOvertime = regularPayments.reduce((sum, p) => sum + ((p.payrollDetails?.overtimeHours || p.overtimeHours || 0) * (p.payrollDetails?.overtimeRate || p.overtimeRate || 0)), 0);
    const totalGrossPay = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.grossPay || 0), 0);
    const totalEpfEmployee = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.epfEmployee || 0), 0);
    const totalEpfEmployer = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.epfEmployer || 0), 0);
    const totalEtf = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.etf || 0), 0);
    const totalDeductions = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.deductions || p.deductions || 0), 0);
    const totalNetPay = regularPayments.reduce((sum, p) => sum + (p.payrollDetails?.netPay || p.amount || 0), 0);
    const totalBonuses = bonuses.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Summary box with border - adjust height based on whether there are bonuses
    const summaryBoxY = y;
    const summaryBoxHeight = bonuses.length > 0 ? 270 : 220;
    doc.rect(40, summaryBoxY, 515, summaryBoxHeight).stroke('#34495e');

    y += 15;
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('PAYMENT SUMMARY', 60, y);
    y += 25;

    // Earnings section
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#27ae60');
    doc.text('EARNINGS:', 60, y);
    y += 18;
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text(`Basic Salary:`, 80, y);
    doc.text(`Rs ${totalBasicSalary.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 16;
    doc.text(`Allowances:`, 80, y);
    doc.text(`Rs ${totalAllowances.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 16;
    doc.text(`Overtime Pay:`, 80, y);
    doc.text(`Rs ${totalOvertime.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 16;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Gross Pay:`, 80, y);
    doc.text(`Rs ${totalGrossPay.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 22;

    // Deductions section
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#c0392b');
    doc.text('DEDUCTIONS:', 60, y);
    y += 18;
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text(`EPF Employee (8%):`, 80, y);
    doc.text(`Rs ${totalEpfEmployee.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 16;
    doc.text(`Other Deductions:`, 80, y);
    doc.text(`Rs ${totalDeductions.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 22;

    // Bonuses section (if any)
    if (bonuses.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#f59e0b');
      doc.text('BONUSES:', 60, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('black');
      doc.text(`Total Bonuses (${bonuses.length}):`, 80, y);
      doc.text(`Rs ${totalBonuses.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
      y += 22;
    }

    // Net payment
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.rect(60, y - 5, 455, 30).fill('#ecf0f1');
    doc.fillColor('#2c3e50');
    doc.text(`TOTAL NET PAYMENT:`, 80, y);
    doc.text(`Rs ${totalNetPay.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    y += 10;
    if (bonuses.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#f59e0b');
      doc.text(`+ TOTAL BONUSES:`, 80, y);
      doc.text(`Rs ${totalBonuses.toFixed(2)}`, 400, y, { width: 120, align: 'right' });
      y += 10;
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#27ae60');
      doc.text(`GRAND TOTAL:`, 80, y);
      doc.text(`Rs ${(totalNetPay + totalBonuses).toFixed(2)}`, 400, y, { width: 120, align: 'right' });
    }
    y += 35;

    // Employer contributions (informational)
    doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d');
    doc.text(`Employer Contributions (EPF 12%): Rs ${totalEpfEmployer.toFixed(2)}  |  ETF (3%): Rs ${totalEtf.toFixed(2)}`, 80, y);

    // Signature
    doc.moveDown(4);
    const signatureY = Math.max(y + 60, doc.page.height - 120);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text("______________________", 60, signatureY);
    doc.text("Manager's Signature", 80, signatureY + 15);

    doc.end();
  } catch (error) {
    console.error('Generate payment history PDF error:', error);
    res.status(500).json({ message: 'Failed to generate payment history PDF', error: error.message });
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
  getStaffOvertimeData,
  generateFinanceReport,
  getStaffPaymentHistory,
  generatePaymentReceipt,
  generatePaymentHistoryPDF
};