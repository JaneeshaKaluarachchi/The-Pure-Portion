import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/StaffFinanceManagement.css";
import LoadingScreen from "./LoadingScreen";
import jsPDF from "jspdf";
import "jspdf-autotable";

const StaffFinanceManagement = ({ isModal = false }) => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [editForm, setEditForm] = useState({
    basicSalary: "",
    salaryType: "monthly",
    allowances: "",
    taxDeductions: "",
    bankAccount: "",
    bankName: "",
    notes: "",
  });

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(response.data.staff || []);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (staffId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/finance/staff-payments/${staffId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPaymentHistory(response.data.payments || []);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setPaymentHistory([]);
    }
  };

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    fetchPaymentHistory(staff._id);
  };

  const openEditModal = (staff) => {
    setEditForm({
      basicSalary: staff.salary || "",
      salaryType: staff.salaryType || "monthly",
      allowances: "", // Not in Staff model, kept for UI
      taxDeductions: "", // Not in Staff model, kept for UI
      bankAccount: staff.bankDetails?.accountNumber || "",
      bankName: staff.bankDetails?.bankName || "",
      notes: "", // Not in Staff model, kept for UI
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const token = localStorage.getItem("token");
      
      // Prepare update data matching the Staff model structure
      const updateData = {
        salary: parseFloat(editForm.basicSalary),
        salaryType: editForm.salaryType,
        bankDetails: {
          accountNumber: editForm.bankAccount || "",
          bankName: editForm.bankName || "",
          branchCode: ""
        }
      };

      console.log("Sending update data:", updateData);

      const response = await axios.put(
        `http://localhost:5000/api/staff/${selectedStaff._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Update response:", response.data);

      alert("Staff finance details updated successfully!");
      setShowEditModal(false);
      fetchStaffData();
      
      // Update selected staff with the response data
      if (response.data.staff) {
        setSelectedStaff(response.data.staff);
      } else {
        // Manually update if no staff object in response
        const updatedStaff = {
          ...selectedStaff,
          salary: parseFloat(editForm.basicSalary),
          salaryType: editForm.salaryType,
          bankDetails: {
            accountNumber: editForm.bankAccount || "",
            bankName: editForm.bankName || "",
            branchCode: ""
          }
        };
        setSelectedStaff(updatedStaff);
      }
    } catch (err) {
      console.error("Error updating staff:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to update staff details: " + (err.response?.data?.message || err.message));
    }
  };

  const generatePaymentReceipt = async (payment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/finance/payment-receipt/${payment._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payment-receipt-${payment._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error generating receipt:", err);
      alert("Failed to generate receipt");
    }
  };

  const generateFullPaymentHistory = async () => {
    if (!selectedStaff) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/finance/payment-history-pdf/${selectedStaff._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payment-history-${selectedStaff.firstName}-${selectedStaff.lastName}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error generating payment history PDF:", err);
      alert("Failed to generate payment history PDF");
    }
  };

  // Keep old jsPDF function for backup (commented out)
  const generatePaymentReceiptOld = (payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text("Pure Portions Restaurant", pageWidth / 2, 30, { align: "center" });

    // Receipt Number and Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Receipt #: ${payment._id.slice(-8).toUpperCase()}`, 20, 55);
    doc.text(
      `Date: ${new Date(payment.date || payment.createdAt).toLocaleDateString()}`,
      pageWidth - 20,
      55,
      { align: "right" }
    );

    // Employee Information
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 65, pageWidth - 30, 45, "F");
    
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Employee Information", 20, 75);
    
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Name: ${selectedStaff.firstName} ${selectedStaff.lastName}`, 20, 85);
    doc.text(`Position: ${selectedStaff.position}`, 20, 93);
    doc.text(`Department: ${selectedStaff.department || "General"}`, 20, 101);
    
    if (selectedStaff.bankDetails?.accountNumber) {
      doc.text(`Bank: ${selectedStaff.bankDetails.bankName || "N/A"}`, pageWidth - 20, 85, { align: "right" });
      doc.text(`Account: ${selectedStaff.bankDetails.accountNumber}`, pageWidth - 20, 93, { align: "right" });
    }

    // Payment Period
    doc.setFillColor(37, 99, 235);
    doc.rect(15, 120, pageWidth - 30, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.text("Payment Period", 20, 126);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    const monthName = new Date(0, (payment.paymentMonth || 1) - 1).toLocaleString("default", { month: "long" });
    doc.text(`${monthName} ${payment.paymentYear || new Date().getFullYear()}`, 20, 136);

    // Payment Details Table
    const tableData = [
      ["Basic Salary", `Rs ${(payment.basicSalary || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`],
      ["Allowances", `Rs ${(payment.allowances || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`],
      ["Overtime Pay", `Rs ${((payment.overtimeHours || 0) * (payment.overtimeRate || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`],
    ];

    if (payment.overtimeHours) {
      tableData.push([
        `  (${payment.overtimeHours} hours @ Rs ${payment.overtimeRate}/hr)`,
        "",
      ]);
    }

    const grossPay = (payment.basicSalary || 0) + (payment.allowances || 0) + 
                     ((payment.overtimeHours || 0) * (payment.overtimeRate || 0));
    
    tableData.push(
      ["Gross Pay", `Rs ${grossPay.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`],
      ["Deductions", `Rs ${(payment.deductions || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`]
    );

    const netPay = grossPay - (payment.deductions || 0);

    doc.autoTable({
      startY: 145,
      head: [["Description", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 11 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: "right" },
      },
    });

    // Net Payment
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(34, 197, 94);
    doc.rect(15, finalY, pageWidth - 30, 15, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("NET PAYMENT", 20, finalY + 10);
    doc.text(
      `Rs ${netPay.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`,
      pageWidth - 20,
      finalY + 10,
      { align: "right" }
    );

    // Payment Method
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Payment Method: ${payment.paymentMethod?.replace("_", " ").toUpperCase() || "N/A"}`, 20, finalY + 25);

    // Notes
    if (payment.notes) {
      doc.setFontSize(10);
      doc.text("Notes:", 20, finalY + 35);
      doc.setFont(undefined, "italic");
      const splitNotes = doc.splitTextToSize(payment.notes, pageWidth - 40);
      doc.text(splitNotes, 20, finalY + 42);
    }

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, footerY, {
      align: "center",
    });

    // Save PDF
    doc.save(
      `Payment_Receipt_${selectedStaff.firstName}_${selectedStaff.lastName}_${monthName}_${payment.paymentYear}.pdf`
    );
  };

  const formatLKR = (value) =>
    `Rs ${Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="staff-finance-management">
      {/* Header */}
      <div className="page-header">
        {!isModal && (
          <button className="back-button" onClick={() => navigate(-1)} title="Go back">
            <span className="back-icon">←</span>
            <span className="back-text">Back</span>
          </button>
        )}
        <div className="header-content">
          <h1 className="page-title">
            <span className="icon">👥</span>
            Staff Finance Management
          </h1>
          <p className="page-subtitle">
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-value">{staffList.length}</span>
            <span className="stat-label">Total Staff</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">
              {formatLKR(staffList.reduce((sum, s) => sum + (s.salary || 0), 0))}
            </span>
            <span className="stat-label">Monthly Budget</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-layout">
        {/* Staff List */}
        <div className="staff-list-panel">
          <div className="panel-header">
            <h2>Staff Members</h2>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="staff-list">
            {filteredStaff.map((staff) => (
              <div
                key={staff._id}
                className={`staff-item ${
                  selectedStaff?._id === staff._id ? "active" : ""
                }`}
                onClick={() => handleStaffClick(staff)}
              >
                <div className="staff-photo-small">
                  {staff.profileImage ? (
                    <img
                      src={`http://localhost:5000/uploads/staff-images/${staff.profileImage}`}
                      alt={`${staff.firstName} ${staff.lastName}`}
                    />
                  ) : (
                    <div className="avatar-small">
                      {staff.firstName.charAt(0)}
                      {staff.lastName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="staff-info-small">
                  <h4>
                    {staff.firstName} {staff.lastName}
                  </h4>
                  <p className="position">{staff.position}</p>
                  <p className="salary">{formatLKR(staff.salary)}/mo</p>
                </div>
                {selectedStaff?._id === staff._id && (
                  <div className="active-indicator">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Staff Details */}
        {selectedStaff ? (
          <div className="staff-details-panel">
            <div className="staff-profile-card">
              {/* Profile Header with Photo and Info */}
              <div className="profile-header-section">
                {/* Profile Photo */}
                <div className="profile-photo-container">
                  {selectedStaff.profileImage ? (
                    <img
                      src={`http://localhost:5000/uploads/staff-images/${selectedStaff.profileImage}`}
                      alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`}
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-photo avatar-large">
                      {selectedStaff.firstName.charAt(0)}
                      {selectedStaff.lastName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Staff Info - Vertical Stack */}
                <div className="staff-info-vertical">
                  <h2 className="staff-name">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h2>
                  <p className="staff-position">{selectedStaff.position}</p>
                  <p className="staff-department">
                    {selectedStaff.department || "General"}
                  </p>
                </div>

                {/* Edit Button - Top Right Corner */}
                <button
                  className="edit-btn-corner"
                  onClick={() => openEditModal(selectedStaff)}
                >
                  <span className="btn-icon">✏️</span>
                  <span className="btn-text">Edit Finance Details</span>
                </button>
              </div>

              {/* Finance Details */}
              <div className="finance-details-grid">
                <div className="detail-card">
                  <span className="detail-icon">💰</span>
                  <div className="detail-content">
                    <span className="detail-label">Basic Salary</span>
                    <span className="detail-value">
                      {formatLKR(selectedStaff.salary)}
                    </span>
                    <span className="detail-meta">
                      per {selectedStaff.salaryType || "month"}
                    </span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">⌛</span>
                  <div className="detail-content">
                    <span className="detail-label">Work Schedule</span>
                    <span className="detail-value">
                      {selectedStaff.workSchedule || "Full-time"}
                    </span>
                    <span className="detail-meta">employment type</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">📅</span>
                  <div className="detail-content">
                    <span className="detail-label">Hire Date</span>
                    <span className="detail-value">
                      {new Date(selectedStaff.hireDate).toLocaleDateString()}
                    </span>
                    <span className="detail-meta">joined date</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">🏦</span>
                  <div className="detail-content">
                    <span className="detail-label">Bank Account</span>
                    <span className="detail-value">
                      {selectedStaff.bankDetails?.accountNumber || "Not set"}
                    </span>
                    <span className="detail-meta">
                      {selectedStaff.bankDetails?.bankName || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="contact-section">
                <h4>📞 Contact Information</h4>
                <div className="contact-grid">
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    <span className="contact-value">{selectedStaff.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Phone:</span>
                    <span className="contact-value">{selectedStaff.phone}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Address:</span>
                    <span className="contact-value">{selectedStaff.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="payment-history-section">
              <div className="payment-history-header">
                <h3>💳 Payment History</h3>
                {paymentHistory.length > 0 && (
                  <button
                    className="download-all-btn"
                    onClick={generateFullPaymentHistory}
                  >
                    <span className="btn-icon">📥</span>
                    <span className="   btn-text">Download Complete History</span>
                  </button>
                )}
              </div>
              {paymentHistory.length > 0 ? (
                <div className="payment-list">
                  {paymentHistory.map((payment) => (
                    <div key={payment._id} className="payment-card">
                      <div className="payment-header">
                        <div className="payment-period">
                          <span className="month" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {payment.type === 'bonus' && <span style={{ background: '#fde68a', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🎁 BONUS</span>}
                            {new Date(0, (payment.paymentMonth || 1) - 1).toLocaleString(
                              "default",
                              { month: "long" }
                            )}{" "}
                            {payment.paymentYear}
                          </span>
                          <span className="date">
                            {payment.type === 'bonus' ? 'Given' : 'Paid'}: {new Date(payment.date || payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          className="download-receipt-btn"
                          onClick={() => generatePaymentReceipt(payment)}
                        >
                          📄 Download Receipt
                        </button>
                      </div>

                      <div className="payment-breakdown">
                        {/* Check if this is a bonus record */}
                        {payment.type === 'bonus' ? (
                          <>
                            {/* Bonus Section */}
                            <div className="breakdown-section-title" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' }}>
                              <span>🎁 BONUS PAYMENT</span>
                            </div>
                            
                            {payment.bonusDetails?.calculationType === 'fixed' && (
                              <div className="breakdown-item">
                                <span>Fixed Bonus Amount:</span>
                                <span>{formatLKR(payment.bonusDetails?.amount || 0)}</span>
                              </div>
                            )}
                            
                            {payment.bonusDetails?.calculationType === 'attendance' && (
                              <>
                                <div className="breakdown-item">
                                  <span>Attendance Days:</span>
                                  <span>{payment.bonusDetails?.attendanceDays || 0} days</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Rate per Day:</span>
                                  <span>{formatLKR(payment.bonusDetails?.ratePerUnit || 0)}</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Calculated:</span>
                                  <span>{formatLKR((payment.bonusDetails?.attendanceDays || 0) * (payment.bonusDetails?.ratePerUnit || 0))}</span>
                                </div>
                              </>
                            )}
                            
                            {payment.bonusDetails?.calculationType === 'overtime' && (
                              <>
                                <div className="breakdown-item">
                                  <span>Overtime Hours:</span>
                                  <span>{payment.bonusDetails?.overtimeHours || 0} hrs</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Rate per Hour:</span>
                                  <span>{formatLKR(payment.bonusDetails?.ratePerUnit || 0)}</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Calculated:</span>
                                  <span>{formatLKR((payment.bonusDetails?.overtimeHours || 0) * (payment.bonusDetails?.ratePerUnit || 0))}</span>
                                </div>
                              </>
                            )}
                            
                            {(payment.bonusDetails?.allowances || 0) > 0 && (
                              <div className="breakdown-item">
                                <span>Additional Allowances:</span>
                                <span>{formatLKR(payment.bonusDetails?.allowances || 0)}</span>
                              </div>
                            )}
                            
                            {payment.notes && (
                              <div className="breakdown-item" style={{ fontStyle: 'italic', color: '#6b7280' }}>
                                <span>Reason:</span>
                                <span>{payment.notes}</span>
                              </div>
                            )}
                            
                            {/* Total Bonus */}
                            <div className="breakdown-item total" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderLeft: '4px solid #f59e0b' }}>
                              <span><strong>🎁 Total Bonus:</strong></span>
                              <span>
                                <strong>{formatLKR(payment.amount || 0)}</strong>
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Regular Payment - Earnings Section */}
                            <div className="breakdown-section-title earnings-title">
                              <span>📊 EARNINGS</span>
                            </div>
                            <div className="breakdown-item">
                              <span>Basic Salary:</span>
                              <span>{formatLKR(payment.payrollDetails?.basicSalary || payment.basicSalary || 0)}</span>
                            </div>
                            {(payment.payrollDetails?.allowances || payment.allowances || 0) > 0 && (
                              <div className="breakdown-item">
                                <span>Allowances:</span>
                                <span>{formatLKR(payment.payrollDetails?.allowances || payment.allowances || 0)}</span>
                              </div>
                            )}
                            {(payment.payrollDetails?.overtimeHours || payment.overtimeHours || 0) > 0 && (
                              <div className="breakdown-item">
                                <span>
                                  Overtime ({payment.payrollDetails?.overtimeHours || payment.overtimeHours || 0} hrs @ {formatLKR(payment.payrollDetails?.overtimeRate || payment.overtimeRate || 0)}/hr):
                                </span>
                                <span>
                                  {formatLKR(payment.payrollDetails?.overtimePay || 
                                    ((payment.payrollDetails?.overtimeHours || payment.overtimeHours || 0) * 
                                    (payment.payrollDetails?.overtimeRate || payment.overtimeRate || 0))
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="breakdown-item gross-pay">
                              <span><strong>Gross Pay:</strong></span>
                              <span><strong>{formatLKR(payment.payrollDetails?.grossPay || 0)}</strong></span>
                            </div>

                            {/* Deductions Section */}
                            <div className="breakdown-section-title deductions-title">
                              <span>💰 DEDUCTIONS</span>
                            </div>
                            {(payment.payrollDetails?.epfEmployee || 0) > 0 && (
                              <div className="breakdown-item deduction">
                                <span>EPF Employee (8%):</span>
                                <span>-{formatLKR(payment.payrollDetails?.epfEmployee || 0)}</span>
                              </div>
                            )}
                            {(payment.payrollDetails?.deductions || payment.deductions || 0) > 0 && (
                              <div className="breakdown-item deduction">
                                <span>Other Deductions:</span>
                                <span>-{formatLKR(payment.payrollDetails?.deductions || payment.deductions || 0)}</span>
                              </div>
                            )}

                            {/* Net Payment */}
                            <div className="breakdown-item total">
                              <span><strong>💵 Net Payment:</strong></span>
                              <span>
                                <strong>{formatLKR(payment.payrollDetails?.netPay || payment.amount || 0)}</strong>
                              </span>
                            </div>

                            {/* Employer Contributions (Informational) */}
                            {((payment.payrollDetails?.epfEmployer || 0) > 0 || (payment.payrollDetails?.etf || 0) > 0) && (
                              <div className="breakdown-item employer-contribution">
                                <span style={{ fontSize: '0.85em', color: '#7f8c8d' }}>
                                  ℹ️ Employer: EPF (12%): {formatLKR(payment.payrollDetails?.epfEmployer || 0)} | ETF (3%): {formatLKR(payment.payrollDetails?.etf || 0)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="payment-method">
                        <span className="method-badge">
                          {payment.paymentMethod?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-payments">
                  <p>No payment history available for this staff member.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-content">
              <span className="icon">👈</span>
              <h3>Select a Staff Member</h3>
              <p>Click on a staff member from the list to view their finance details</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay1">
          <div className="modal1 edit-modal">
            <div className="modal-header">
              <h3>Edit Finance Details</h3>
              <p className="modal-subtitle">
                Update salary and payment information for{" "}
                {selectedStaff?.firstName} {selectedStaff?.lastName}
              </p>
            </div>

            <form onSubmit={handleUpdateStaff}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Basic Salary (LKR) *</label>
                  <input
                    type="number"
                    value={editForm.basicSalary}
                    onChange={(e) =>
                      setEditForm({ ...editForm, basicSalary: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter basic salary"
                  />
                </div>

                <div className="form-group">
                  <label>Salary Type *</label>
                  <select
                    value={editForm.salaryType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, salaryType: e.target.value })
                    }
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bankName: e.target.value })
                    }
                    placeholder="e.g., Bank of Ceylon"
                  />
                </div>

                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input
                    type="text"
                    value={editForm.bankAccount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bankAccount: e.target.value })
                    }
                    placeholder="Enter account number"
                  />
                </div>
              </div>

              <div className="info-note">
                <strong>Note:</strong> Only salary and bank details can be updated here. 
                Other staff information can be updated from the main staff management page.
              </div>

              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffFinanceManagement;
