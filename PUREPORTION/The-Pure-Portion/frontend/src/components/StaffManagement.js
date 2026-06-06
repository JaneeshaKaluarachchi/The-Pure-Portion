import React, { useState, useEffect } from "react";
import axios from "axios";
import AttendanceManagement from "./AttendanceManagement";
import "../styles/StaffManagement.css";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [stats, setStats] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showAttendance, setShowAttendance] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    department: "",
    salary: "",
    salaryType: "monthly",
    hireDate: "",
    workSchedule: "full-time",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    bankDetails: {
      accountNumber: "",
      bankName: "",
      branchCode: "",
    },
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/staff");
      setStaff(response.data.staff);
    } catch (error) {
      setMessage("Failed to fetch staff members");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/staff/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested fields like emergencyContact and bankDetails
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
      if (name === "emergencyContact.name") {
        const regex = /^[A-Za-z\s]*$/; // only letters and spaces
        let error = "";
        if (!regex.test(value)) {
          error = "Name can only contain letters";
        }

        setFormErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }

      // Validations
      let error = "";

      // Only letters validation
      if (
        name === "emergencyContact.relationship" ||
        name === "bankDetails.bankName"
      ) {
        if (value && /[^a-zA-Z\s]/.test(value)) {
          error = "Only letters are allowed";
        }
      }

      // Only numbers validation
      if (name === "bankDetails.accountNumber") {
        if (value && /[^0-9]/.test(value)) {
          error = "Only numbers are allowed";
        }
      }

      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
      // Nested validations
      if (parent === "emergencyContact" && child === "phone") {
        const phoneRegex = /^[0-9]{0,10}$/;
        setFormErrors((prev) => ({
          ...prev,
          [name]: phoneRegex.test(value)
            ? ""
            : "Phone must be numeric and max 10 digits",
        }));
      }
      if (parent === "bankDetails") {
        if (child === "accountNumber") {
          const accRegex = /^[0-9]*$/;
          setFormErrors((prev) => ({
            ...prev,
            [name]: accRegex.test(value)
              ? ""
              : "Account number must be numeric",
          }));
        }
        if (child === "branchCode") {
          const branchRegex = /^[A-Za-z]*$/;
          setFormErrors((prev) => ({
            ...prev,
            [name]: branchRegex.test(value)
              ? ""
              : "Branch code must be letters only",
          }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Validations
      // Names
      if (["firstName", "lastName"].includes(name)) {
        const nameRegex = /^[A-Za-z]*$/;
        setFormErrors((prev) => ({
          ...prev,
          [name]: nameRegex.test(value) ? "" : "Name can only contain letters",
        }));
      }

      // Salary
      if (name === "salary") {
        const salaryNum = Number(value);
        const salaryRegex = /^[0-9]*$/;
        setFormErrors((prev) => ({
          ...prev,
          [name]: !salaryRegex.test(value)
            ? "Salary must be numeric"
            : salaryNum <= 0 || salaryNum > 1000000
            ? "Salary must be >0 and ≤1,000,000"
            : "",
        }));
      }
      if (name === "emergencyContact.phone") {
        const regex = /^[0-9]{0,10}$/; // only numbers, max 10 digits
        let error = "";
        if (!regex.test(value)) {
          error = "Phone number must contain only numbers (max 10 digits)";
        } else if (value.length !== 10) {
          error = "Phone number must be exactly 10 digits";
        }

        setFormErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }

      // Phone
      if (name === "phone") {
        const phoneRegex = /^[0-9]{0,10}$/;
        setFormErrors((prev) => ({
          ...prev,
          [name]: phoneRegex.test(value)
            ? ""
            : "Phone must be numeric and max 10 digits",
        }));
      }
      if (name === "firstName" || name === "lastName") {
        const nameRegex = /^[A-Za-z]*$/;
        setFormErrors((prev) => ({
          ...prev,
          [name]: nameRegex.test(value) ? "" : "Name can only contain letters",
        }));
      }
      // Hire Date
      if (name === "hireDate") {
        const today = new Date();
        const minDate = new Date(today.setMonth(today.getMonth() - 3));
        const maxDate = new Date(today.setMonth(today.getMonth() + 6)); // adjust for previous setMonth
        const hireDate = new Date(value);
        setFormErrors((prev) => ({
          ...prev,
          [name]:
            hireDate < minDate || hireDate > maxDate
              ? "Hire date must be within ±3 months of today"
              : "",
        }));
      }
    }
  };

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const formDataToSend = new FormData();

    // Append all form fields
    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === "object" && formData[key] !== null) {
        Object.keys(formData[key]).forEach((subKey) => {
          if (formData[key][subKey]) {
            formDataToSend.append(`${key}.${subKey}`, formData[key][subKey]);
          }
        });
      } else if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append image if selected
    if (selectedImage) {
      formDataToSend.append("profileImage", selectedImage);
    }

    try {
      if (editingStaff) {
        await axios.put(`/api/staff/${editingStaff._id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Staff member updated successfully!");
      } else {
        await axios.post("/api/staff", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Staff member added successfully!");
      }

      resetForm();
      fetchStaff();
      fetchStats();
    } catch (error) {
      setMessage(error.response?.data?.message || "Operation failed");
    }
    setLoading(false);
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      address: staffMember.address,
      position: staffMember.position,
      department: staffMember.department,
      salary: staffMember.salary,
      salaryType: staffMember.salaryType,
      hireDate: staffMember.hireDate ? staffMember.hireDate.split("T")[0] : "",
      workSchedule: staffMember.workSchedule,
      emergencyContact: staffMember.emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
      bankDetails: staffMember.bankDetails || {
        accountNumber: "",
        bankName: "",
        branchCode: "",
      },
    });
    setShowAddForm(true);
  };

  const handleDelete = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await axios.delete(`/api/staff/${staffId}`);
        setMessage("Staff member deleted successfully!");
        fetchStaff();
        fetchStats();
      } catch (error) {
        setMessage("Failed to delete staff member");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      position: "",
      department: "",
      salary: "",
      salaryType: "monthly",
      hireDate: "",
      workSchedule: "full-time",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      bankDetails: {
        accountNumber: "",
        bankName: "",
        branchCode: "",
      },
    });
    setSelectedImage(null);
    setEditingStaff(null);
    setShowAddForm(false);
  };

  // If showing attendance management, render that component
  if (showAttendance) {
    return (
      <div>
        <div style={{ marginBottom: "30px" }}>
          <button
            onClick={() => setShowAttendance(false)}
            style={{
              padding: "10px 20px",
              margin:"20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ← Back to Staff Management
          </button>
        </div>
        <AttendanceManagement />
      </div>
    );
  }

  return (
    <div className="staff-management">
      <div className="staff-header">
        <h2>Staff Management</h2>
        <div className="header-buttons">
          <button
            className="attendance-manage-btn"
            onClick={() => setShowAttendance(true)}
          >
            📋 Attendance Manage
          </button>
          <button
            className="add-staff-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "❌ Cancel" : "➕ Add Staff"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("successfully") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      {/* Staff Statistics */}
      <div className="staff-stats">
        <div className="stat-card">
          <h3>Total Staff</h3>
          <div className="stat-value">{stats.totalStaff || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Monthly Salary Cost</h3>
          <div className="stat-value">
            Rs. {stats.totalMonthlySalary?.toLocaleString() || 0}
          </div>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <div className="stat-value">{stats.departmentStats?.length || 0}</div>
        </div>
      </div>

      {/* Add/Edit Staff Form */}
      {showAddForm && (
        <div className="staff-form-container">
          <h3>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</h3>
          <form onSubmit={handleSubmit} className="staff-form">
            {/* Profile Image */}
            <div className="form-section">
              <h4>Profile Photo</h4>
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="profileImage"
                />
                <label htmlFor="profileImage" className="image-upload-label">
                  {selectedImage ? selectedImage.name : "Choose Profile Photo"}
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.firstName && (
                    <span className="error-text">{formErrors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.lastName && (
                    <span className="error-text">{formErrors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.phone && (
                    <span className="error-text">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  required
                />
              </div>
            </div>

            {/* Job Information */}
            <div className="form-section">
              <h4>Job Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Position *</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Position</option>
                    <option value="chef">Chef</option>
                    <option value="sous-chef">Sous Chef</option>
                    <option value="cook">Cook</option>
                    <option value="waiter">Waiter</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="helper">Helper</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="service">Service</option>
                    <option value="management">Management</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Salary *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.salary && (
                    <span className="error-text">{formErrors.salary}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Salary Type *</label>
                  <select
                    name="salaryType"
                    value={formData.salaryType}
                    onChange={handleChange}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hire Date *</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.hireDate && (
                    <span className="error-text">{formErrors.hireDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Work Schedule *</label>
                  <select
                    name="workSchedule"
                    value={formData.workSchedule}
                    onChange={handleChange}
                    required
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="form-section">
              <h4>Emergency Contact</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                  />
                  {formErrors["emergencyContact.name"] && (
                    <span className="error-text">
                      {formErrors["emergencyContact.name"]}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                  />
                  {formErrors["emergencyContact.phone"] && (
                    <span className="error-text">
                      {formErrors["emergencyContact.phone"]}
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
                {formErrors["emergencyContact.relationship"] && (
                  <span className="error-text">
                    {formErrors["emergencyContact.relationship"]}
                  </span>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="form-section">
              <h4>Bank Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="bankDetails.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleChange}
                  />
                  {formErrors["bankDetails.accountNumber"] && (
                    <span className="error-text">
                      {formErrors["bankDetails.accountNumber"]}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="bankDetails.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleChange}
                  />
                  {formErrors["bankDetails.bankName"] && (
                    <span className="error-text">
                      {formErrors["bankDetails.bankName"]}
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Branch Code</label>
                <input
                  type="text"
                  name="bankDetails.branchCode"
                  value={formData.bankDetails.branchCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="save-btn">
                {loading
                  ? "Saving..."
                  : editingStaff
                  ? "Update Staff"
                  : "Add Staff"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="staff-list-container">
        <h3>Staff Members</h3>
        {loading && <div className="loading">Loading staff members...</div>}

        {!loading && staff.length === 0 && (
          <div className="no-data">
            No staff members found. Add your first staff member above.
          </div>
        )}

        {!loading && staff.length > 0 && (
          <div className="staff-grid">
            {staff.map((member) => (
              <div key={member._id} className="staff-card">
                <div className="staff-image">
                  {member.profileImage ? (
                    <img
                      src={`/uploads/staff-images/${member.profileImage}`}
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
                  <p className="staff-id">{member.staffId}</p>
                  <p className="position">{member.position}</p>
                  <p className="department">{member.department}</p>
                  <p className="salary">
                    Rs. {member.salary.toLocaleString()}/{member.salaryType}
                  </p>
                  <p className="hire-date">
                    Since: {new Date(member.hireDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="staff-actions">
                  <button
                    onClick={() => handleEdit(member)}
                    className="edit-bottn"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="delete-bottn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
