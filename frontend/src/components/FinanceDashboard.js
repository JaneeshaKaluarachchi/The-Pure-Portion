import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/FinanceDashboard.css";
import StaffTileSelector from './StaffTileSelector';

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

  const [recordForm, setRecordForm] = useState({
    type: "income",
    category: "sales",
    amount: "",
    description: "",
    staffId: ""
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setRecordForm({
        ...recordForm,
        type: value,
        category: categoryOptions[value]?.[0] || "",
        staffId: "" // reset staff if type changes
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

  const resetDashboard = () => {
    setDailyProfit(null);
    setMonthlyProfit(null);
    setSummary(null);
    setRecords([]);
    setError("");
    fetchFinanceData();
  };

  if (loading) return <div className="loading">Loading finance data...</div>;

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

      {/* Additional Summary Info */}
      {summary?.summary && (
        <div className="additional-summary">
          <div className="summary-section">
            <h4>📋 Staff & Loans</h4>
            <p>Total Staff: {summary.summary.staff?.totalStaff || 0}</p>
            <p>Monthly Salary Budget: {formatLKR(summary.summary.staff?.monthlySalaryBudget)}</p>
            <p>Active Loans: {summary.summary.loans?.activeLoansCount || 0}</p>
            <p>Outstanding Amount: {formatLKR(summary.summary.loans?.totalOutstanding)}</p>
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
        <form onSubmit={addFinanceRecord}>
          <div className="form-row">
            <div className="form-group">
              <label>Type:</label>
              <select name="type" value={recordForm.type} onChange={handleFormChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="staff_payment">Staff Payment</option>
                <option value="bonus">Bonus</option>
                <option value="loan">Loan</option>
                <option value="loan_repayment">Loan Repayment</option>
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
                    <td>{record.description}</td>
                    <td className={record.type === 'income' ? 'positive' : 'negative'}>
                      {record.type === 'income' ? '+' : '-'}{formatLKR(record.amount)}
                    </td>
                    <td><span className={`status-badge ${record.status || 'completed'}`}>{record.status || 'completed'}</span></td>
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
