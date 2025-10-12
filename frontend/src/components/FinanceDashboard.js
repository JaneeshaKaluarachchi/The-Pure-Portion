import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/FinanceDashboard.css";
import StaffTileSelector from "./StaffTileSelector";
import LoadingScreen from "./LoadingScreen";
import StaffFinanceManagement from "./StaffFinanceManagement";

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [amountError, setAmountError] = useState("");
  const [dailyProfit, setDailyProfit] = useState(null);
  const [monthlyProfit, setMonthlyProfit] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [transactionType, setTransactionType] = useState("staff_payment");
  const [staffPerformanceData, setStaffPerformanceData] = useState(null);
  const [showBonusCalculator, setShowBonusCalculator] = useState(false);
  const [showStaffPayment, setShowStaffPayment] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showStaffFinanceModal, setShowStaffFinanceModal] = useState(false);
  const [loadingOvertimeData, setLoadingOvertimeData] = useState(false);
  const [errors, setErrors] = useState({
    basicSalary: "",
    overtimeHours: "",
    overtimeRate: "",
    allowances: "",
    deductions: "",
  });
  const [recordForm, setRecordForm] = useState({
    type: "income",
    category: "sales",
    amount: "",
    description: "",
    staffId: "",
  });

  const [bonusForm, setBonusForm] = useState({
    staffId: "",
    calculationType: "fixed",
    ratePerUnit: "",
    fixedAmount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    reason: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    staffId: "",
    basicSalary: "",
    overtimeHours: "",
    overtimeRate: "",
    allowances: "",
    deductions: "",
    paymentMethod: "bank_transfer",
    notes: "",
    paymentMonth: new Date().getMonth() + 1,
    paymentYear: new Date().getFullYear(),
  });

  const [loanForm, setLoanForm] = useState({
    staffId: "",
    loanAmount: "",
    interestRate: 0,
    loanTerm: 12,
    purpose: "",
  });

  // Portion Plan States
  const [showPortionPlanModal, setShowPortionPlanModal] = useState(false);
  const [executedPortionPlans, setExecutedPortionPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [profitMargin, setProfitMargin] = useState(40);
  const [customProfit, setCustomProfit] = useState("");
  const [addedPortionPlanIds, setAddedPortionPlanIds] = useState(() => {
    // Load from localStorage on component mount
    const saved = localStorage.getItem('addedPortionPlanIds');
    return saved ? JSON.parse(saved) : [];
  });

  const categoryOptions = {
    income: ["sales", "catering", "delivery", "other_income"],
    expense: [
      "rent",
      "utilities",
      "marketing",
      "maintenance",
      "supplies",
      "other_expense",
    ],
    staff_payment: ["salary"],
    bonus: ["bonus"],
    loan: ["loan_disbursement"],
    loan_repayment: ["loan_payment"],
  };

  useEffect(() => {
    fetchFinanceData();
    fetchStaffList();
    fetchExecutedPortionPlans();
  }, [addedPortionPlanIds]);

  // Save addedPortionPlanIds to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('addedPortionPlanIds', JSON.stringify(addedPortionPlanIds));
  }, [addedPortionPlanIds]);

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

  const fetchExecutedPortionPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/portions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter only executed plans that haven't been added yet
      const executed = (res.data.plans || []).filter(
        plan => plan.isInventoryDeducted && !addedPortionPlanIds.includes(plan._id)
      );
      setExecutedPortionPlans(executed);
    } catch (err) {
      console.error("Error fetching portion plans:", err);
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [dailyRes, monthlyRes, summaryRes, recordsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/finance/daily-profit", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/finance/monthly-profit", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/finance/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/finance/records", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDailyProfit(dailyRes.data);
      setMonthlyProfit(monthlyRes.data);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data.records || []);
    } catch (err) {
      console.error("Error fetching finance data:", err);
      setError(
        "Failed to fetch finance data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffPerformanceData = async (staffId, month, year) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/finance/staff-performance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { staffId, month, year },
        }
      );
      setStaffPerformanceData(res.data.data);
    } catch (err) {
      console.error("Error fetching staff performance data:", err);
      alert("Failed to fetch staff performance data");
    }
  };

  // NEW: Function to auto-fetch overtime data for selected staff
  const fetchStaffOvertimeData = async (staffId, month, year) => {
    try {
      setLoadingOvertimeData(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/finance/staff-overtime`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { staffId, month, year },
        }
      );

      if (res.data.success) {
        const overtimeData = res.data.data;
        setPaymentForm((prev) => ({
          ...prev,
          overtimeHours: overtimeData.totalOvertimeHours.toString(),
          // You can set a default overtime rate or leave it for user input
          overtimeRate: prev.overtimeRate || "500", // Default rate, can be customized
        }));
      }
    } catch (err) {
      console.error("Error fetching overtime data:", err);
      // Don't show alert for this, just log the error
    } finally {
      setLoadingOvertimeData(false);
    }
  };

  const handleNumberChange = (field, value) => {
    const numberRegex = /^[0-9]*\.?[0-9]*$/;

    if (value === "" || numberRegex.test(value)) {
      setPaymentForm({ ...paymentForm, [field]: value });
      setErrors({ ...errors, [field]: "" });
    } else {
      setErrors({ ...errors, [field]: "⚠ Please enter a valid number" });
    }
  };

  // NEW: Handle staff selection with auto overtime detection
  const handleStaffSelection = (staffId) => {
    setPaymentForm({ ...paymentForm, staffId });

    // Auto-fetch overtime data for the selected staff
    if (staffId) {
      fetchStaffOvertimeData(
        staffId,
        paymentForm.paymentMonth,
        paymentForm.paymentYear
      );
    }
  };

  // NEW: Handle month/year change with auto overtime update
  const handlePaymentPeriodChange = (field, value) => {
    const updatedForm = { ...paymentForm, [field]: value };
    setPaymentForm(updatedForm);

    // Re-fetch overtime data if staff is selected
    if (updatedForm.staffId) {
      fetchStaffOvertimeData(
        updatedForm.staffId,
        updatedForm.paymentMonth,
        updatedForm.paymentYear
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setRecordForm({
        ...recordForm,
        type: value,
        category: categoryOptions[value]?.[0] || "",
        staffId: "",
      });
    } else if (name === "amount") {
      // Allow only numbers with optional decimal
      const numberRegex = /^[0-9]*\.?[0-9]*$/;

      if (value === "" || numberRegex.test(value)) {
        setRecordForm({ ...recordForm, [name]: value });
        setAmountError("");
      } else {
        setAmountError("⚠ Please enter a valid number");
      }
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
    if (
      ["staff_payment", "bonus", "loan", "loan_repayment"].includes(
        recordForm.type
      ) &&
      !recordForm.staffId
    ) {
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
        setRecordForm({
          type: "income",
          category: "sales",
          amount: "",
          description: "",
          staffId: "",
        });
        alert("Finance record added successfully!");
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error adding record:", err);
      alert(
        "Failed to add finance record: " +
          (err.response?.data?.message || err.message)
      );
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
          overtimeHours: "",
          overtimeRate: "",
          allowances: "",
          deductions: "",
          paymentMethod: "bank_transfer",
          notes: "",
          paymentMonth: new Date().getMonth() + 1,
          paymentYear: new Date().getFullYear(),
        });
        setShowStaffPayment(false);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      alert(
        "Failed to process payment: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const giveBonus = async (e) => {
    e.preventDefault();

    if (!bonusForm.staffId) {
      alert("Please select a staff member");
      return;
    }

    if (bonusForm.calculationType === "fixed" && !bonusForm.fixedAmount) {
      alert("Please enter fixed bonus amount");
      return;
    }

    if (bonusForm.calculationType !== "fixed" && !bonusForm.ratePerUnit) {
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
          reason: "",
        });
        setShowBonusCalculator(false);
        setStaffPerformanceData(null);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error giving bonus:", err);
      alert(
        "Failed to give bonus: " + (err.response?.data?.message || err.message)
      );
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
          purpose: "",
        });
        setShowLoanForm(false);
        fetchFinanceData();
      }
    } catch (err) {
      console.error("Error creating loan:", err);
      alert(
        "Failed to create loan: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const downloadPDFReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/finance/report/pdf",
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `finance-report-${Date.now()}.pdf`);
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
        setRecords((prevRecords) =>
          prevRecords.filter((record) => record._id !== recordId)
        );
        alert("Record deleted successfully!");
      } else {
        alert(
          "Failed to delete record: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error(
        "Error deleting record:",
        err.response?.data || err.message
      );
      alert(
        "Failed to delete record: " +
          (err.response?.data?.message || err.message)
      );
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

  const handlePortionPlanSelect = (plan) => {
    setSelectedPlan(plan);
    setProfitMargin(40); // Default 40%
    setCustomProfit("");
  };

  const calculateSellingPrice = () => {
    if (!selectedPlan) return 0;
    const margin = customProfit !== "" ? parseFloat(customProfit) : profitMargin;
    const cost = selectedPlan.totalCost || 0;
    return cost + (cost * margin / 100);
  };

  const calculateProfit = () => {
    if (!selectedPlan) return 0;
    const margin = customProfit !== "" ? parseFloat(customProfit) : profitMargin;
    const cost = selectedPlan.totalCost || 0;
    return cost * margin / 100;
  };

  const addPortionPlanToRecord = () => {
    if (!selectedPlan) return;

    const sellingPrice = calculateSellingPrice();
    const profit = calculateProfit();
    const margin = customProfit !== "" ? customProfit : profitMargin;

    setRecordForm({
      type: "income",
      category: "sales",
      amount: sellingPrice.toFixed(2),
      description: `${selectedPlan.name} (${selectedPlan.peopleCount} ppl, +${margin}% profit)`,
      staffId: "",
    });

    // Mark this plan as added so it won't appear again
    setAddedPortionPlanIds(prev => [...prev, selectedPlan._id]);

    setShowPortionPlanModal(false);
    setSelectedPlan(null);
    setProfitMargin(40);
    setCustomProfit("");

    // Show success notification
    alert(`✅ ${selectedPlan.name} added to record with ${margin}% profit margin!`);
  };

  if (loading) return <LoadingScreen />;

  const formatLKR = (value) =>
    `Rs ${Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;

  return (
    <div className="finance-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="icon-wrapper">💳</span>
            Finance Dashboard
          </h1>
          <p className="dashboard-subtitle">Manage your restaurant's financial operations</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={resetDashboard}>
            <span className="btn-icon">🔄</span>
            Refresh
          </button>
          <button className="pdf-btn" onClick={downloadPDFReport}>
            <span className="btn-icon">📄</span>
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Summary Cards - Enhanced Design */}
      <div className="summary-cards">
        <div className={`card ${dailyProfit?.data?.profit >= 0 ? 'card-success' : 'card-danger'}`}>
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h4>Today's Profit</h4>
            <p className={dailyProfit?.data?.profit >= 0 ? "positive" : "negative"}>
              {formatLKR(dailyProfit?.data?.profit)}
            </p>
            <div className="card-details">
              <span className="detail-item">
                <span className="detail-label">Income:</span>
                <span className="detail-value income">{formatLKR(dailyProfit?.data?.totalIncome)}</span>
              </span>
              <span className="detail-item">
                <span className="detail-label">Expenses:</span>
                <span className="detail-value expense">{formatLKR(dailyProfit?.data?.totalExpenses)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className={`card ${monthlyProfit?.data?.profit >= 0 ? 'card-success' : 'card-danger'}`}>
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h4>Monthly Profit</h4>
            <p className={monthlyProfit?.data?.profit >= 0 ? "positive" : "negative"}>
              {formatLKR(monthlyProfit?.data?.profit)}
            </p>
            <div className="card-details">
              <span className="detail-item">
                <span className="detail-label">Income:</span>
                <span className="detail-value income">{formatLKR(monthlyProfit?.data?.totalIncome)}</span>
              </span>
              <span className="detail-item">
                <span className="detail-label">Expenses:</span>
                <span className="detail-value expense">{formatLKR(monthlyProfit?.data?.totalExpenses)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="card card-info">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h4>Today's Income</h4>
            <p className="positive">
              {formatLKR(summary?.summary?.today?.income)}
            </p>
            <div className="card-footer">
              <span className="trend-up">↗ Income Stream</span>
            </div>
          </div>
        </div>

        <div className="card card-warning">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h4>Today's Expenses</h4>
            <p className="negative">
              {formatLKR(summary?.summary?.today?.expenses)}
            </p>
            <div className="card-footer">
              <span className="trend-down">↘ Outgoing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Payment Modal */}
      {showStaffPayment && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <div className="modal-header">
              <h3>💰 Process Staff Payment</h3>
            </div>
            <form onSubmit={processStaffPayment}>
              <div className="staff-selector-clean">
                <label className="section-label">Select Staff Member</label>
                <div className="staff-list-clean">
                  {staffList.map((staff) => (
                    <div
                      key={staff._id}
                      className={`staff-card-clean ${
                        paymentForm.staffId === staff._id ? "selected" : ""
                      }`}
                      onClick={() => handleStaffSelection(staff._id)}
                    >
                      <div className="staff-photo-clean">
                        {staff.profileImage ? (
                          <img
                            src={`http://localhost:5000/uploads/staff-images/${staff.profileImage}`}
                            alt={`${staff.firstName} ${staff.lastName}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="default-avatar-clean" 
                          style={{ display: staff.profileImage ? 'none' : 'flex' }}
                        >
                          {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                        </div>
                      </div>
                      <div className="staff-info-clean">
                        <h4 className="staff-name">{staff.firstName} {staff.lastName}</h4>
                        <p className="staff-position">{staff.position}</p>
                        <p className="staff-department">{staff.department || 'General'}</p>
                        <p className="staff-salary">Base Salary: {formatLKR(staff.salary)}</p>
                      </div>
                      {paymentForm.staffId === staff._id && (
                        <div className="selected-indicator">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Period Selection */}
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Month:</label>
                  <select
                    value={paymentForm.paymentMonth}
                    onChange={(e) =>
                      handlePaymentPeriodChange(
                        "paymentMonth",
                        parseInt(e.target.value)
                      )
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Year:</label>
                  <input
                    type="number"
                    value={paymentForm.paymentYear}
                    onChange={(e) =>
                      handlePaymentPeriodChange(
                        "paymentYear",
                        parseInt(e.target.value)
                      )
                    }
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Basic Salary (LKR):</label>
                  <input
                    type="text"
                    value={paymentForm.basicSalary}
                    onChange={(e) =>
                      handleNumberChange("basicSalary", e.target.value)
                    }
                    className={errors.basicSalary ? "input-error" : ""}
                    required
                  />
                  {errors.basicSalary && (
                    <p className="error-text">{errors.basicSalary}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Allowances (LKR):</label>
                  <input
                    type="text"
                    value={paymentForm.allowances}
                    onChange={(e) =>
                      handleNumberChange("allowances", e.target.value)
                    }
                    className={errors.allowances ? "input-error" : ""}
                  />
                  {errors.allowances && (
                    <p className="error-text">{errors.allowances}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deductions (LKR):</label>
                  <input
                    type="text"
                    value={paymentForm.deductions}
                    onChange={(e) =>
                      handleNumberChange("deductions", e.target.value)
                    }
                    className={errors.deductions ? "input-error" : ""}
                  />
                  {errors.deductions && (
                    <p className="error-text">{errors.deductions}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Display calculated overtime pay */}
              {paymentForm.overtimeHours && paymentForm.overtimeRate && (
                <div className="calculation-display">
                  <p>
                    <strong>
                      Overtime Pay:{" "}
                      {formatLKR(
                        (parseFloat(paymentForm.overtimeHours) || 0) *
                          (parseFloat(paymentForm.overtimeRate) || 0)
                      )}
                    </strong>
                  </p>
                  <p>
                    <strong>
                      Gross Pay:{" "}
                      {formatLKR(
                        (parseFloat(paymentForm.basicSalary) || 0) +
                          (parseFloat(paymentForm.overtimeHours) || 0) *
                            (parseFloat(paymentForm.overtimeRate) || 0) +
                          (parseFloat(paymentForm.allowances) || 0)
                      )}
                    </strong>
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  Process Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowStaffPayment(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Calculator Modal */}
      {showBonusCalculator && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <div className="modal-header">
              <h3>🎁 Bonus Calculator</h3>
            </div>
            <form onSubmit={giveBonus}>
              <div className="staff-selector-clean">
                <label className="section-label">Select Staff Member</label>
                <div className="staff-list-clean">
                  {staffList.map((staff) => (
                    <div
                      key={staff._id}
                      className={`staff-card-clean ${
                        bonusForm.staffId === staff._id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setBonusForm({ ...bonusForm, staffId: staff._id });
                        if (bonusForm.calculationType !== "fixed") {
                          fetchStaffPerformanceData(
                            staff._id,
                            bonusForm.month,
                            bonusForm.year
                          );
                        }
                      }}
                    >
                      <div className="staff-photo-clean">
                        {staff.profileImage ? (
                          <img
                            src={`http://localhost:5000/uploads/staff-images/${staff.profileImage}`}
                            alt={`${staff.firstName} ${staff.lastName}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="default-avatar-clean" 
                          style={{ display: staff.profileImage ? 'none' : 'flex' }}
                        >
                          {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                        </div>
                      </div>
                      <div className="staff-info-clean">
                        <h4 className="staff-name">{staff.firstName} {staff.lastName}</h4>
                        <p className="staff-position">{staff.position}</p>
                        <p className="staff-department">{staff.department || 'General'}</p>
                        <p className="staff-salary">Base Salary: {formatLKR(staff.salary)}</p>
                      </div>
                      {bonusForm.staffId === staff._id && (
                        <div className="selected-indicator">✓</div>
                      )}
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
                      setBonusForm({
                        ...bonusForm,
                        calculationType: e.target.value,
                      });
                      if (e.target.value !== "fixed" && bonusForm.staffId) {
                        fetchStaffPerformanceData(
                          bonusForm.staffId,
                          bonusForm.month,
                          bonusForm.year
                        );
                      }
                    }}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="attendance">Based on Attendance</option>
                    <option value="overtime">Based on Overtime</option>
                  </select>
                </div>
              </div>

              {bonusForm.calculationType === "fixed" ? (
                <div className="form-group">
                  <label>Fixed Amount (LKR):</label>
                  <input
                    type="text" // changed from number to text for better regex validation
                    value={bonusForm.fixedAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numberRegex = /^[0-9]*\.?[0-9]*$/;

                      if (value === "" || numberRegex.test(value)) {
                        setBonusForm({ ...bonusForm, fixedAmount: value });
                        setErrors((prev) => ({ ...prev, fixedAmount: "" }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          fixedAmount: "⚠ Please enter a valid number",
                        }));
                      }
                    }}
                    className={errors.fixedAmount ? "input-error" : ""}
                    required
                  />
                  {errors.fixedAmount && (
                    <p className="error-text">{errors.fixedAmount}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Month:</label>
                      <select
                        value={bonusForm.month}
                        onChange={(e) =>
                          setBonusForm({ ...bonusForm, month: parseInt(e.target.value, 10) })
                        }
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString("default", {
                              month: "long",
                            })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Year:</label>
                      <input
                        type="number"
                        value={bonusForm.year}
                        onChange={(e) =>
                          setBonusForm({ ...bonusForm, year: parseInt(e.target.value, 10) })
                        }
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Rate per{" "}
                      {bonusForm.calculationType === "attendance"
                        ? "Day"
                        : "Hour"}{" "}
                      (LKR):
                    </label>
                    <input
                      type="text" // Use text to apply regex validation
                      value={bonusForm.ratePerUnit}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberRegex = /^[0-9]*\.?[0-9]*$/; // allows decimals

                        if (value === "" || numberRegex.test(value)) {
                          setBonusForm({ ...bonusForm, ratePerUnit: value });
                          setErrors((prev) => ({ ...prev, ratePerUnit: "" }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            ratePerUnit: "⚠ Please enter a valid number",
                          }));
                        }
                      }}
                      className={errors.ratePerUnit ? "input-error" : ""}
                      required
                    />
                    {errors.ratePerUnit && (
                      <p className="error-text">{errors.ratePerUnit}</p>
                    )}
                  </div>

                  {staffPerformanceData && (
                    <div className="performance-display">
                      <h4>
                        Performance Data for{" "}
                        {staffPerformanceData.staff.firstName}{" "}
                        {staffPerformanceData.staff.lastName}
                      </h4>
                      <p>
                        Present Days:{" "}
                        {staffPerformanceData.performance.presentDays}
                      </p>
                      <p>
                        Attendance %:{" "}
                        {staffPerformanceData.performance.attendancePercentage}%
                      </p>
                      <p>
                        Overtime Hours:{" "}
                        {staffPerformanceData.performance.totalOvertimeHours}
                      </p>
                      {bonusForm.ratePerUnit && (
                        <p className="calculated-bonus">
                          Calculated Bonus:{" "}
                          {formatLKR(
                            bonusForm.calculationType === "attendance"
                              ? staffPerformanceData.performance.presentDays *
                                  bonusForm.ratePerUnit
                              : staffPerformanceData.performance
                                  .totalOvertimeHours * bonusForm.ratePerUnit
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
                  onChange={(e) =>
                    setBonusForm({ ...bonusForm, reason: e.target.value })
                  }
                  placeholder="Reason for bonus..."
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  Give Bonus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBonusCalculator(false);
                    setStaffPerformanceData(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Summary Info - Compact */}
      {summary?.summary && (
        <div className="additional-summary-compact">
          <div 
            className="summary-item clickable" 
            onClick={() => setShowStaffFinanceModal(true)}
            title="Click to view staff finance management"
          >
            <span className="summary-icon">👥</span>
            <div className="summary-info">
              <span className="summary-label">Total Staff</span>
              <span className="summary-value">{summary.summary.staff?.totalStaff || 0}</span>
            </div>
            <span className="arrow-icon">→</span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">💰</span>
            <div className="summary-info">
              <span className="summary-label">Monthly Salary Budget</span>
              <span className="summary-value salary-budget">
                {formatLKR(summary.summary.staff?.monthlySalaryBudget)}
              </span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">📦</span>
            <div className="summary-info">
              <span className="summary-label">Inventory Value</span>
              <span className="summary-value inventory-value">
                {formatLKR(summary.summary.inventory?.currentValue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="quick-actions-panel">
        <h3 className="panel-title">
          <span className="title-icon">⚡</span>
          Quick Actions
        </h3>
        <div className="action-buttons">
          <button
            className="action-btn staff-payment-btn"
            onClick={() => setShowStaffPayment(true)}
          >
            <span className="btn-icon">💰</span>
            <span className="btn-text">
              <strong>Staff Payment</strong>
              <small>Process salary payments</small>
            </span>
          </button>
          <button
            className="action-btn bonus-btn"
            onClick={() => setShowBonusCalculator(true)}
          >
            <span className="btn-icon">🎁</span>
            <span className="btn-text">
              <strong>Give Bonus</strong>
              <small>Reward your team</small>
            </span>
          </button>
        </div>
      </div>

      {/* Add Record Form - Enhanced */}
      <div className="record-form">
        <div className="form-header-with-button">
          <h3 className="form-title">
            <span className="title-icon">➕</span>
            Add Finance Record
          </h3>
          {executedPortionPlans.length > 0 && (
            <button
              type="button"
              className="portion-plan-btn"
              onClick={() => setShowPortionPlanModal(true)}
            >
              <span className="btn-icon">🍽️</span>
              <span className="btn-text">Add from Portion Plan</span>
            </button>
          )}
        </div>
        <form onSubmit={addFinanceRecord}>
          <div className="form-row">
            <div className="form-group1">
              <label>Type:</label>
              <select
                name="type"
                value={recordForm.type}
                onChange={handleFormChange}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group1">
              <label>Category:</label>
              <select
                name="category"
                value={recordForm.category}
                onChange={handleFormChange}
              >
                {categoryOptions[recordForm.type]?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {["staff_payment", "bonus", "loan_repayment"].includes(
            recordForm.type
          ) && (
            <div className="staff-selection">
              <label>Select Staff:</label>

              {!loading && staffList.length > 0 ? (
                <div className="staff-grid">
                  {staffList.map((member) => (
                    <div
                      key={member._id}
                      className={`staff-card ${
                        recordForm.staffId === member._id ? "selected" : ""
                      }`}
                      onClick={() =>
                        setRecordForm({ ...recordForm, staffId: member._id })
                      }
                    >
                      <div className="staff-image">
                        {member.profileImage ? (
                          <img
                            src={`http://localhost:5000/uploads/staff-images/${member.profileImage}`}
                            alt={`${member.firstName} ${member.lastName}`}
                          />
                        ) : (
                          <div className="default-avatar">
                            {member.firstName.charAt(0)}
                            {member.lastName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="staff-info">
                        <h4>
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="position">{member.position}</p>
                        <p className="department">{member.department}</p>
                        <p className="salary">
                          Rs. {member.salary.toLocaleString()}/
                          {member.salaryType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No staff available</p>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Amount (LKR):</label>
              <input
                type="text" // changed to text for better regex control
                name="amount"
                value={recordForm.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                className={amountError ? "input-error" : ""}
              />
              {amountError && <p className="error-text">{amountError}</p>}
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

            <style>
              {`
          .input-error {
            border: 2px solid red;
          }
          .error-text {
            color: red;
            font-size: 14px;
            margin-top: 4px;
          }
          .calculation-display {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #007bff;
          }
          .calculation-display p {
            margin: 5px 0;
            color: #333;
          }
          .loading-indicator {
            color: #007bff;
            font-size: 12px;
          }
        `}
            </style>
          </div>

          <button type="submit" className="add-btn">
            ➕ Add Record
          </button>
        </form>
      </div>

      {/* Records Table - Enhanced */}
      <div className="records-section">
        <div className="section-header-row">
          <h3 className="section-title">
            <span className="title-icon">📋</span>
            Recent Finance Records
          </h3>
          <div className="header-meta">
            <span className="record-count">{records.length} Records</span>
          </div>
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
                {records.slice(0, 20).map((record) => (
                  <tr key={record._id || record.recordId}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`type-badge ${record.type}`}>
                        {record.type.replace("_", " ")}
                      </span>
                    </td>
                    <td>{record.category.replace("_", " ")}</td>
                    <td>{record.description}</td>
                    <td
                      className={
                        record.type === "income" ? "positive" : "negative"
                      }
                    >
                      {record.type === "income" ? "+" : "-"}
                      {formatLKR(record.amount)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          record.status || "completed"
                        }`}
                      >
                        {record.status || "completed"}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteFinanceRecord(record._id || record.recordId)
                        }
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

      {/* Staff Finance Management Modal */}
      {showStaffFinanceModal && (
        <div className="staff-finance-modal-overlay" onClick={() => setShowStaffFinanceModal(false)}>
          <div className="staff-finance-modal-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="staff-finance-close-btn"
              onClick={() => setShowStaffFinanceModal(false)}
            >
              ✕
            </button>
            <StaffFinanceManagement isModal={true} />
          </div>
        </div>
      )}

      {/* Portion Plan Selection Modal */}
      {showPortionPlanModal && (
        <div className="modal-overlay" onClick={() => {
          setShowPortionPlanModal(false);
          setSelectedPlan(null);
          setProfitMargin(40);
          setCustomProfit("");
        }}>
          <div className="modal portion-plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-content">
                <h3>🍽️ Add Portion Plan to Finance</h3>
                <p className="modal-subtitle">
                  Select a plan, set profit margin, and add to income records
                </p>
              </div>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowPortionPlanModal(false);
                  setSelectedPlan(null);
                  setProfitMargin(40);
                  setCustomProfit("");
                }}
              >
                ✕
              </button>
            </div>

            {executedPortionPlans.length > 0 ? (
              <>
                <div className="portion-plans-list">
                  {executedPortionPlans.map((plan) => (
                    <div
                      key={plan._id}
                      className={`portion-plan-card ${
                        selectedPlan?._id === plan._id ? "selected" : ""
                      }`}
                      onClick={() => handlePortionPlanSelect(plan)}
                    >
                      <div className="plan-header">
                        <div className="plan-title-section">
                          <h4 className="plan-name">{plan.name}</h4>
                          <span className="plan-id-badge">{plan.planId}</span>
                        </div>
                        {selectedPlan?._id === plan._id && (
                          <div className="selected-badge">✓ Selected</div>
                        )}
                      </div>
                      
                      <div className="plan-body">
                        <div className="plan-info-grid">
                          <div className="info-item">
                            <span className="info-icon">👥</span>
                            <div className="info-content">
                              <span className="info-label">People</span>
                              <span className="info-value">{plan.peopleCount}</span>
                            </div>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-icon">💰</span>
                            <div className="info-content">
                              <span className="info-label">Total Cost</span>
                              <span className="info-value cost-highlight">
                                {formatLKR(plan.totalCost)}
                              </span>
                            </div>
                          </div>

                          <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div className="info-content">
                              <span className="info-label">Created</span>
                              <span className="info-value">
                                {new Date(plan.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="plan-menu-details">
                          <div className="menu-item">
                            <span className="menu-icon">🍛</span>
                            <span className="menu-label">Main:</span>
                            <span className="menu-value">{plan.mainMeal.name}</span>
                          </div>
                          <div className="menu-item">
                            <span className="menu-icon">🥘</span>
                            <span className="menu-label">Curries:</span>
                            <span className="menu-value">
                              {plan.curries.map(c => c.name).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="plan-footer">
                        <span className="select-hint">
                          {selectedPlan?._id === plan._id 
                            ? "Set profit margin below →" 
                            : "Click to select"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPlan && (
                  <div className="profit-calculator">
                    <div className="calculator-header">
                      <h4 className="calculator-title">💵 Set Your Profit Margin</h4>
                      <p className="calculator-subtitle">Choose a preset or enter custom percentage</p>
                    </div>
                    
                    <div className="margin-selector">
                      <label className="selector-label">Quick Margins:</label>
                      <div className="profit-margin-buttons">
                        <button
                          type="button"
                          className={`margin-btn ${profitMargin === 40 && customProfit === "" ? "active" : ""}`}
                          onClick={() => {
                            setProfitMargin(40);
                            setCustomProfit("");
                          }}
                        >
                          <span className="margin-value">40%</span>
                          <span className="margin-label">Standard</span>
                        </button>
                        <button
                          type="button"
                          className={`margin-btn ${profitMargin === 60 && customProfit === "" ? "active" : ""}`}
                          onClick={() => {
                            setProfitMargin(60);
                            setCustomProfit("");
                          }}
                        >
                          <span className="margin-value">60%</span>
                          <span className="margin-label">Premium</span>
                        </button>
                        <button
                          type="button"
                          className={`margin-btn ${profitMargin === 80 && customProfit === "" ? "active" : ""}`}
                          onClick={() => {
                            setProfitMargin(80);
                            setCustomProfit("");
                          }}
                        >
                          <span className="margin-value">80%</span>
                          <span className="margin-label">Luxury</span>
                        </button>
                      </div>
                    </div>

                    <div className="custom-profit-section">
                      <label className="selector-label">Or Enter Custom:</label>
                      <div className="custom-input-wrapper">
                        <input
                          type="number"
                          value={customProfit}
                          onChange={(e) => setCustomProfit(e.target.value)}
                          placeholder="e.g., 45"
                          min="0"
                          max="1000"
                          step="0.1"
                          className="custom-profit-input"
                        />
                        <span className="input-suffix">%</span>
                      </div>
                    </div>

                    <div className="calculation-summary">
                      <div className="summary-header">
                        <h5>📊 Calculation Breakdown</h5>
                      </div>
                      <div className="summary-row cost-row">
                        <span className="summary-label">
                          <span className="label-icon">📦</span>
                          Cost Price
                        </span>
                        <span className="summary-value">{formatLKR(selectedPlan.totalCost)}</span>
                      </div>
                      <div className="summary-row profit-row">
                        <span className="summary-label">
                          <span className="label-icon">📈</span>
                          Profit ({customProfit !== "" ? customProfit : profitMargin}%)
                        </span>
                        <span className="summary-value profit-value">
                          +{formatLKR(calculateProfit())}
                        </span>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-row total-row">
                        <span className="summary-label">
                          <span className="label-icon">💰</span>
                          Final Selling Price
                        </span>
                        <span className="summary-value selling-price">
                          {formatLKR(calculateSellingPrice())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-plans-message">
                <div className="no-plans-icon">🍽️</div>
                <h4>No Available Portion Plans</h4>
                <p>All executed portion plans have been added to finance records.</p>
                <p className="hint-text">Execute new portion plans to add them here.</p>
              </div>
            )}

            <div className="modal-buttons">
              {executedPortionPlans.length > 0 && (
                <button
                  type="button"
                  className="submit-btn"
                  onClick={addPortionPlanToRecord}
                  disabled={!selectedPlan}
                >
                  <span className="btn-icon">✓</span>
                  <span className="btn-text">Add to Finance Record</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowPortionPlanModal(false);
                  setSelectedPlan(null);
                  setProfitMargin(40);
                  setCustomProfit("");
                }}
                className="cancel-btn"
              >
                <span className="btn-icon">✕</span>
                <span className="btn-text">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
