import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/LoanManagement.css";

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [loanForm, setLoanForm] = useState({
    staffId: "",
    loanAmount: "",
    interestRate: "0",
    loanTerm: "12",
    purpose: "",
    guarantor: {
      name: "",
      phone: "",
      relationship: ""
    }
  });

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentMethod: "salary_deduction",
    notes: ""
  });

  useEffect(() => {
    fetchLoans();
    fetchStaffList();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/finance/loans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoans(response.data.loans || []);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

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

  const handleLoanFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('guarantor.')) {
      const field = name.split('.')[1];
      setLoanForm({
        ...loanForm,
        guarantor: {
          ...loanForm.guarantor,
          [field]: value
        }
      });
    } else {
      setLoanForm({ ...loanForm, [name]: value });
    }
  };

  const createLoan = async (e) => {
    e.preventDefault();
    
    if (!loanForm.staffId || !loanForm.loanAmount || !loanForm.loanTerm || !loanForm.purpose) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/finance/loans", loanForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert("Loan created successfully!");
        setShowLoanForm(false);
        setLoanForm({
          staffId: "",
          loanAmount: "",
          interestRate: "0",
          loanTerm: "12",
          purpose: "",
          guarantor: { name: "", phone: "", relationship: "" }
        });
        fetchLoans();
      }
    } catch (err) {
      console.error("Error creating loan:", err);
      alert("Failed to create loan: " + (err.response?.data?.message || err.message));
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.amountPaid) {
      alert("Please enter payment amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/finance/loans/${selectedLoan._id}/payment`,
        paymentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Payment processed successfully!");
        setShowPaymentForm(false);
        setSelectedLoan(null);
        setPaymentForm({
          amountPaid: "",
          paymentMethod: "salary_deduction",
          notes: ""
        });
        fetchLoans();
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("Failed to process payment: " + (err.response?.data?.message || err.message));
    }
  };

  const formatLKR = (value) => `Rs ${Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="loading">Loading loans...</div>;

  return (
    <div className="loan-management">
      <div className="header">
        <h2>💰 Loan Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowLoanForm(true)}
        >
          ➕ Create New Loan
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Loan Summary Cards */}
      <div className="loan-summary">
        <div className="summary-card">
          <h4>Active Loans</h4>
          <p className="count">{loans.filter(loan => loan.status === 'active').length}</p>
        </div>
        <div className="summary-card">
          <h4>Total Outstanding</h4>
          <p className="amount">
            {formatLKR(loans.reduce((sum, loan) => sum + (loan.status === 'active' ? loan.remainingAmount : 0), 0))}
          </p>
        </div>
        <div className="summary-card">
          <h4>Completed Loans</h4>
          <p className="count">{loans.filter(loan => loan.status === 'completed').length}</p>
        </div>
        <div className="summary-card">
          <h4>Total Disbursed</h4>
          <p className="amount">
            {formatLKR(loans.reduce((sum, loan) => sum + loan.loanAmount, 0))}
          </p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="loans-table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Staff</th>
              <th>Amount</th>
              <th>Remaining</th>
              <th>Monthly Payment</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => {
              const progress = ((loan.loanAmount - loan.remainingAmount) / loan.loanAmount) * 100;
              return (
                <tr key={loan._id}>
                  <td>{loan.loanId}</td>
                  <td>
                    <div className="staff-info">
                      <img
                        src={loan.staffId?.profileImage ? `http://localhost:5000/uploads/staff-images/${loan.staffId.profileImage}` : "https://via.placeholder.com/40"}
                        alt={`${loan.staffId?.firstName} ${loan.staffId?.lastName}`}
                        className="staff-photo-small"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
                      />
                      <div>
                        <strong>{loan.staffId?.firstName} {loan.staffId?.lastName}</strong>
                        <small>{loan.staffId?.staffId}</small>
                      </div>
                    </div>
                  </td>
                  <td>{formatLKR(loan.loanAmount)}</td>
                  <td>{formatLKR(loan.remainingAmount)}</td>
                  <td>{formatLKR(loan.monthlyInstallment)}</td>
                  <td>
                    <span className={`status-badge ${loan.status}`}>
                      {loan.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                      <span className="progress-text">{progress.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    {loan.status === 'active' && (
                      <button
                        className="btn btn-small btn-success"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowPaymentForm(true);
                          setPaymentForm({
                            amountPaid: loan.monthlyInstallment.toString(),
                            paymentMethod: "salary_deduction",
                            notes: ""
                          });
                        }}
                      >
                        💳 Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Loan Modal */}
      {showLoanForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Loan</h3>
              <button className="close-btn" onClick={() => setShowLoanForm(false)}>×</button>
            </div>
            <form onSubmit={createLoan} className="loan-form">
              <div className="form-group">
                <label>Select Staff:</label>
                <div className="staff-tiles">
                  {staffList.map(staff => (
                    <div
                      key={staff._id}
                      className={`staff-tile ${loanForm.staffId === staff._id ? 'selected' : ''}`}
                      onClick={() => setLoanForm({ ...loanForm, staffId: staff._id })}
                    >
                      <img
                        src={staff.profileImage ? `http://localhost:5000/uploads/staff-images/${staff.profileImage}` : "https://via.placeholder.com/60"}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="staff-photo"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/60"; }}
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
                  <label>Loan Amount (LKR):</label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={loanForm.loanAmount}
                    onChange={handleLoanFormChange}
                    required
                    min="1000"
                    step="100"
                  />
                </div>
                <div className="form-group">
                  <label>Interest Rate (%):</label>
                  <input
                    type="number"
                    name="interestRate"
                    value={loanForm.interestRate}
                    onChange={handleLoanFormChange}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loan Term (Months):</label>
                  <select name="loanTerm" value={loanForm.loanTerm} onChange={handleLoanFormChange}>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Purpose:</label>
                  <input
                    type="text"
                    name="purpose"
                    value={loanForm.purpose}
                    onChange={handleLoanFormChange}
                    required
                    placeholder="e.g., Personal emergency, Education"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Guarantor Information (Optional)</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Guarantor Name:</label>
                    <input
                      type="text"
                      name="guarantor.name"
                      value={loanForm.guarantor.name}
                      onChange={handleLoanFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone:</label>
                    <input
                      type="tel"
                      name="guarantor.phone"
                      value={loanForm.guarantor.phone}
                      onChange={handleLoanFormChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Relationship:</label>
                  <input
                    type="text"
                    name="guarantor.relationship"
                    value={loanForm.guarantor.relationship}
                    onChange={handleLoanFormChange}
                    placeholder="e.g., Father, Friend, Colleague"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLoanForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && selectedLoan && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Process Loan Payment</h3>
              <button className="close-btn" onClick={() => setShowPaymentForm(false)}>×</button>
            </div>
            
            <div className="loan-details">
              <h4>Loan Details</h4>
              <p><strong>Loan ID:</strong> {selectedLoan.loanId}</p>
              <p><strong>Staff:</strong> {selectedLoan.staffId?.firstName} {selectedLoan.staffId?.lastName}</p>
              <p><strong>Remaining Amount:</strong> {formatLKR(selectedLoan.remainingAmount)}</p>
              <p><strong>Monthly Installment:</strong> {formatLKR(selectedLoan.monthlyInstallment)}</p>
            </div>

            <form onSubmit={processPayment} className="payment-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Amount (LKR):</label>
                  <input
                    type="number"
                    name="amountPaid"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    required
                    min="1"
                    max={selectedLoan.remainingAmount}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <option value="salary_deduction">Salary Deduction</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;