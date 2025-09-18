import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/FinanceDashboard.css";
import StaffTileSelector from './StaffTileSelector';
import LoadingScreen from './LoadingScreen';

const FinanceDashboard = () => {
  const [dailyProfit, setDailyProfit] = useState(null);
  const [monthlyProfit, setMonthlyProfit] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [transactionType, setTransactionType] = useState('staff_payment');
  const [staffPerformanceData, setStaffPerformanceData] = useState(null);
  const [showBonusCalculator, setShowBonusCalculator] = useState(false);
  const [showStaffPayment, setShowStaffPayment] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

  const [recordForm, setRecordForm] = useState({
    type: "income",
    category: "sales",
    amount: "",
    description: "",
    staffId: ""
  });

  const [bonusForm, setBonusForm] = useState({
    staffId: "",
    calculationType: "fixed",
    ratePerUnit: "",
    fixedAmount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    reason: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    staffId: "",
    basicSalary: "",
    overtime: 0,
    allowances: 0,
    deductions: 0,
    paymentMethod: "bank_transfer",
    notes: ""
  });

  const [loanForm, setLoanForm] = useState({
    staffId: "",
    loanAmount: "",
    interestRate: 0,
    loanTerm: 12,
    purpose: ""
  });

  const categoryOptions = {
    income: ['sales', 'catering', 'delivery', 'other_income'],
    expense: ['rent', 'utilities', 'marketing', 'maintenance', 'supplies', 'other_expense'],
    staff_payment: ['salary'],
    bonus: ['bonus'],
    loan: ['loan_disbursement'],
    loan_repayment: ['loan_payment']
  };

  useEffect(() => {
    fetchFinanceData();
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error("Error fetching staff list:", err);
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [dailyRes, monthlyRes, summaryRes, recordsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/finance/daily-profit", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/finance/monthly-profit", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/finance/summary", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/finance/records", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setDailyProfit(dailyRes.data);
      setMonthlyProfit(monthlyRes.data);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data.records || []);
    } catch (err) {
      console.error("Error fetching finance data:", err);
      setError("Failed to fetch finance data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffPerformanceData = async (staffId, month, year) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/finance/staff-performance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { staffId, month, year }
      });
      setStaffPerformanceData(res.data.data);
    } catch (err) {
      console.error("Error fetching staff performance data:", err);
      alert("Failed to fetch staff performance data");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setRecordForm({
        ...recordForm,
        type: value,
        category: categoryOptions[value]?.[0] || "",
        staffId: ""
      });
    } else {
      setRecordForm({ ...recordForm, [name]: value });
    }
  };

  const addFinanceRecord = async (e) => {
    e.preventDefault();

    if (!recordForm.amount || !recordForm.category || !recordForm.description) {
      alert("Please fill in amount, category, and description");
      return;
    }

    // Check if staffId is required for this transaction type
    if (['staff_payment', 'bonus', 'loan', 'loan_repayment'].includes(recordForm.type) && !recordForm.staffId) {
      alert("Please select a staff member for this transaction type");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/finance/records",
        recordForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRecords([response.data.record, ...records]);
        setRecordForm({ type: "income", category: "sales", amount: "", description: "", staffId: "" });
        alert("Finance record added successfully!");
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error adding record:", err);
      alert("Failed to add finance record: " + (err.response?.data?.message || err.message));
    }
  };

  const processStaffPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.staffId || !paymentForm.basicSalary) {
      alert("Please select staff and enter basic salary");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/finance/staff-payment",
        paymentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Staff payment processed successfully!");
        setPaymentForm({
          staffId: "",
          basicSalary: "",
          overtime: 0,
          allowances: 0,
          deductions: 0,
          paymentMethod: "bank_transfer",
          notes: ""
        });
        setShowStaffPayment(false);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("Failed to process payment: " + (err.response?.data?.message || err.message));
    }
  };

  const giveBonus = async (e) => {
    e.preventDefault();
    
    if (!bonusForm.staffId) {
      alert("Please select a staff member");
      return;
    }

    if (bonusForm.calculationType === 'fixed' && !bonusForm.fixedAmount) {
      alert("Please enter fixed bonus amount");
      return;
    }

    if (bonusForm.calculationType !== 'fixed' && !bonusForm.ratePerUnit) {
      alert("Please enter rate per unit");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/finance/bonus",
        bonusForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Bonus given successfully!");
        setBonusForm({
          staffId: "",
          calculationType: "fixed",
          ratePerUnit: "",
          fixedAmount: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          reason: ""
        });
        setShowBonusCalculator(false);
        setStaffPerformanceData(null);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error giving bonus:", err);
      alert("Failed to give bonus: " + (err.response?.data?.message || err.message));
    }
  };

  const createLoan = async (e) => {
    e.preventDefault();
    
    if (!loanForm.staffId || !loanForm.loanAmount || !loanForm.purpose) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/finance/loans",
        loanForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Loan created successfully!");
        setLoanForm({
          staffId: "",
          loanAmount: "",
          interestRate: 0,
          loanTerm: 12,
          purpose: ""
        });
        setShowLoanForm(false);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error creating loan:", err);
      alert("Failed to create loan: " + (err.response?.data?.message || err.message));
    }
  };

  const downloadPDFReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/finance/report/pdf", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finance-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report");
    }
  };

  const deleteFinanceRecord = async (recordId) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;

  try {
    const token = localStorage.getItem("token");

    // Make DELETE request to backend
    const response = await axios.delete(
      `http://localhost:5000/api/finance/records/${recordId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      // Remove the deleted record from state
      setRecords(prevRecords => prevRecords.filter(record => record._id !== recordId));
      alert("Record deleted successfully!");
    } else {
      alert("Failed to delete record: " + (response.data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Error deleting record:", err.response?.data || err.message);
    alert("Failed to delete record: " + (err.response?.data?.message || err.message));
  }
};




  const resetDashboard = () => {
    setDailyProfit(null);
    setMonthlyProfit(null);
    setSummary(null);
    setRecords([]);
    setError("");
    fetchFinanceData();
  };

  if (loading) return <LoadingScreen />;
  
  const formatLKR = (value) => `Rs ${Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

  return (
    <div className="finance-dashboard">
      <h2>📊 Finance Dashboard</h2>
      {error && <div className="error-message">{error}</div>}


      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h4>Today's Profit</h4>
          <p className={dailyProfit?.data?.profit >= 0 ? 'positive' : 'negative'}>
            {formatLKR(dailyProfit?.data?.profit)}
          </p>
          <small>Income: {formatLKR(dailyProfit?.data?.totalIncome)}</small>
          <small>Expenses: {formatLKR(dailyProfit?.data?.totalExpenses)}</small>
        </div>
        <div className="card">
          <h4>Monthly Profit</h4>
          <p className={monthlyProfit?.data?.profit >= 0 ? 'positive' : 'negative'}>
            {formatLKR(monthlyProfit?.data?.profit)}
          </p>
          <small>Income: {formatLKR(monthlyProfit?.data?.totalIncome)}</small>
          <small>Expenses: {formatLKR(monthlyProfit?.data?.totalExpenses)}</small>
        </div>
        <div className="card">
          <h4>Today's Income</h4>
          <p className="positive">{formatLKR(summary?.summary?.today?.income)}</p>
        </div>
        <div className="card">
          <h4>Today's Expenses</h4>
          <p className="negative">{formatLKR(summary?.summary?.today?.expenses)}</p>
        </div>
      </div>


      {/* Staff Payment Modal */}
      {showStaffPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💰 Process Staff Payment</h3>
            <form onSubmit={processStaffPayment}>
              <div className="staff-selector">
                <label>Select Staff:</label>
                <div className="staff-tiles">
                  {staffList.map(staff => (
                    <div
                      key={staff._id}
                      className={`staff-tile ${paymentForm.staffId === staff._id ? 'selected' : ''}`}
                      onClick={() => setPaymentForm({ ...paymentForm, staffId: staff._id })}
                    >
                      <img
                        src={staff.photoUrl || "https://via.placeholder.com/80"}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="staff-photo"
                      />
                      <div className="staff-details">
                        <strong>{staff.firstName} {staff.lastName}</strong>
                        <small>{staff.position}</small>
                        <small>Salary: {formatLKR(staff.salary)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Basic Salary (LKR):</label>
                  <input
                    type="number"
                    value={paymentForm.basicSalary}
                    onChange={(e) => setPaymentForm({ ...paymentForm, basicSalary: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Overtime (LKR):</label>
                  <input
                    type="number"
                    value={paymentForm.overtime}
                    onChange={(e) => setPaymentForm({ ...paymentForm, overtime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Allowances (LKR):</label>
                  <input
                    type="number"
                    value={paymentForm.allowances}
                    onChange={(e) => setPaymentForm({ ...paymentForm, allowances: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Deductions (LKR):</label>
                  <input
                    type="number"
                    value={paymentForm.deductions}
                    onChange={(e) => setPaymentForm({ ...paymentForm, deductions: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="submit-btn">Process Payment</button>
                <button type="button" onClick={() => setShowStaffPayment(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Calculator Modal */}
      {showBonusCalculator && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🎁 Bonus Calculator</h3>
            <form onSubmit={giveBonus}>
              <div className="staff-selector">
                <label>Select Staff:</label>
                <div className="staff-tiles">
                  {staffList.map(staff => (
                    <div
                      key={staff._id}
                      className={`staff-tile ${bonusForm.staffId === staff._id ? 'selected' : ''}`}
                      onClick={() => {
                        setBonusForm({ ...bonusForm, staffId: staff._id });
                        if (bonusForm.calculationType !== 'fixed') {
                          fetchStaffPerformanceData(staff._id, bonusForm.month, bonusForm.year);
                        }
                      }}
                    >
                      <img
                        src={staff.photoUrl || "https://via.placeholder.com/80"}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="staff-photo"
                      />
                      <div className="staff-details">
                        <strong>{staff.firstName} {staff.lastName}</strong>
                        <small>{staff.position}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Calculation Type:</label>
                  <select
                    value={bonusForm.calculationType}
                    onChange={(e) => {
                      setBonusForm({ ...bonusForm, calculationType: e.target.value });
                      if (e.target.value !== 'fixed' && bonusForm.staffId) {
                        fetchStaffPerformanceData(bonusForm.staffId, bonusForm.month, bonusForm.year);
                      }
                    }}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="attendance">Based on Attendance</option>
                    <option value="overtime">Based on Overtime</option>
                  </select>
                </div>
              </div>

              {bonusForm.calculationType === 'fixed' ? (
                <div className="form-group">
                  <label>Fixed Amount (LKR):</label>
                  <input
                    type="number"
                    value={bonusForm.fixedAmount}
                    onChange={(e) => setBonusForm({ ...bonusForm, fixedAmount: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Month:</label>
                      <select
                        value={bonusForm.month}
                        onChange={(e) => setBonusForm({ ...bonusForm, month: e.target.value })}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Year:</label>
                      <input
                        type="number"
                        value={bonusForm.year}
                        onChange={(e) => setBonusForm({ ...bonusForm, year: e.target.value })}
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Rate per {bonusForm.calculationType === 'attendance' ? 'Day' : 'Hour'} (LKR):</label>
                    <input
                      type="number"
                      value={bonusForm.ratePerUnit}
                      onChange={(e) => setBonusForm({ ...bonusForm, ratePerUnit: e.target.value })}
                      required
                    />
                  </div>

                  {staffPerformanceData && (
                    <div className="performance-display">
                      <h4>Performance Data for {staffPerformanceData.staff.firstName} {staffPerformanceData.staff.lastName}</h4>
                      <p>Present Days: {staffPerformanceData.performance.presentDays}</p>
                      <p>Attendance %: {staffPerformanceData.performance.attendancePercentage}%</p>
                      <p>Overtime Hours: {staffPerformanceData.performance.totalOvertimeHours}</p>
                      {bonusForm.ratePerUnit && (
                        <p className="calculated-bonus">
                          Calculated Bonus: {formatLKR(
                            bonusForm.calculationType === 'attendance' 
                              ? staffPerformanceData.performance.presentDays * bonusForm.ratePerUnit
                              : staffPerformanceData.performance.totalOvertimeHours * bonusForm.ratePerUnit
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Reason:</label>
                <input
                  type="text"
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                  placeholder="Reason for bonus..."
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="submit-btn">Give Bonus</button>
                <button type="button" onClick={() => {
                  setShowBonusCalculator(false);
                  setStaffPerformanceData(null);
                }} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* Additional Summary Info */}
      {summary?.summary && (
        <div className="additional-summary">
          <div className="summary-section">
            <h4>📋 Staff Finance</h4>
            <p>Total Staff: {summary.summary.staff?.totalStaff || 0}</p>
            <p>Monthly Salary Budget: {formatLKR(summary.summary.staff?.monthlySalaryBudget)}</p>
          </div>
          <div className="summary-section">
            <h4>📦 Inventory</h4>
            <p>Current Value: {formatLKR(summary.summary.inventory?.currentValue)}</p>
          </div>
        </div>
      )}

      {/* Add Record Form */}
      <div className="record-form">
        <h3>Add Finance Record</h3>
        {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-btn" onClick={() => setShowStaffPayment(true)}>
          💰 Staff Payment
        </button>
        <button className="action-btn" onClick={() => setShowBonusCalculator(true)}>
          🎁 Give Bonus
        </button>
        <button className="action-btn" onClick={downloadPDFReport}>
          📄 Download Report
        </button>
      </div>
        <form onSubmit={addFinanceRecord}>
          <div className="form-row">
            <div className="form-group">
              <label>Type:</label>
              <select name="type" value={recordForm.type} onChange={handleFormChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select name="category" value={recordForm.category} onChange={handleFormChange}>
                {categoryOptions[recordForm.type]?.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {['staff_payment', 'bonus', 'loan_repayment'].includes(recordForm.type) && (
            <div className="staff-tile-container">
              <label>Select Staff:</label>
              <div className="staff-tiles">
                {staffList.map(staff => (
                  <div
                    key={staff._id}
                    className={`staff-tile ${recordForm.staffId === staff._id ? 'selected' : ''}`}
                    onClick={() => setRecordForm({ ...recordForm, staffId: staff._id })}
                  >
                    <img
                      src={staff.photoUrl || "https://via.placeholder.com/80"}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      className="staff-photo"
                    />
                    <div className="staff-details">
                      <strong>{staff.firstName} {staff.lastName}</strong>
                      <small>{staff.position}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Amount (LKR):</label>
              <input
                type="number"
                name="amount"
                value={recordForm.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={recordForm.description}
                onChange={handleFormChange}
                placeholder="Enter description"
                required
              />
            </div>
          </div>

          <button type="submit" className="add-btn">
            ➕ Add Record
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="records-section">
        <div className="section-header">
          <h3>Recent Finance Records</h3>
          <button className="reset-btn" onClick={resetDashboard}>
            🔄 Refresh
          </button>
        </div>

        {records.length > 0 ? (
          <div className="table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount (LKR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map(record => (
                  <tr key={record._id || record.recordId}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td><span className={`type-badge ${record.type}`}>{record.type.replace('_', ' ')}</span></td>
                    <td>{record.category.replace('_', ' ')}</td>
                    <td>
                      {record.description}
                      {record.staffId && (
                        <div className="record-staff-info">
                          <img
                            src={record.staffId.photoUrl || "https://via.placeholder.com/40"}
                            alt={`${record.staffId.firstName} ${record.staffId.lastName}`}
                            className="staff-photo-mini"
                          />
                          <small>{record.staffId.firstName} {record.staffId.lastName}</small>
                        </div>
                      )}
                    </td>
                    <td className={record.type === 'income' ? 'positive' : 'negative'}>
                      {record.type === 'income' ? '+' : '-'}{formatLKR(record.amount)}
                    </td>
                    <td>
  <span className={`status-badge ${record.status || 'completed'}`}>
    {record.status || 'completed'}
  </span>
  <button
    className="delete-btn"
    onClick={() => deleteFinanceRecord(record._id || record.recordId)}
  >
    🗑️ Delete
  </button>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No finance records found.</p>
            <small>Add your first record using the form above.</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;