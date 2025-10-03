import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Profile.css";

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: currentUser.firstName || "",
    lastName: currentUser.lastName || "",
    phone: currentUser.phone || "",
    address: currentUser.address || "",
    familyMembers: currentUser.familyMembers || "",
    restaurantName: currentUser.restaurantName || "",
    restaurantType: currentUser.restaurantType || "",
    restaurantAddress: currentUser.restaurantAddress || "",
    restaurantPhone: currentUser.restaurantPhone || "",
    businessRegistrationNo: currentUser.businessRegistrationNo || "",
    ownerFirstName: currentUser.ownerFirstName || "",
    ownerLastName: currentUser.ownerLastName || "",
    ownerPhone: currentUser.ownerPhone || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Live validation for restaurantName
    if (name === "restaurantName") {
      if (!value.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          restaurantName: "Restaurant Name is required",
        }));
      } else if (value.length < 3) {
        setFormErrors((prev) => ({
          ...prev,
          restaurantName: "Must be at least 3 characters",
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, restaurantName: "" }));
      }
    }

    // Live validation for restaurantPhone
    if (name === "restaurantPhone") {
      const phoneRegex = /^[0-9]{10,12}$/; // Accept 10-12 digit numbers
      if (!value.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          restaurantPhone: "Restaurant Phone is required",
        }));
      } else if (!phoneRegex.test(value)) {
        setFormErrors((prev) => ({
          ...prev,
          restaurantPhone: "Enter a valid phone number",
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, restaurantPhone: "" }));
      }
    }
    if (name === "businessRegistrationNo") {
      const regex = /^[a-zA-Z0-9]*$/; // only letters and numbers
      setFormErrors((prev) => ({
        ...prev,
        [name]: regex.test(value) ? "" : "Only letters and numbers are allowed",
      }));
    }
    if (name === "ownerFirstName" || name === "ownerLastName") {
      const regex = /^[a-zA-Z]*$/; // only letters
      setFormErrors((prev) => ({
        ...prev,
        [name]: regex.test(value) ? "" : "Only letters are allowed",
      }));
    }

    if (name === "ownerPhone") {
      const phoneRegex = /^[0-9]{0,10}$/; // only digits, max 10 digits
      setFormErrors((prev) => ({
        ...prev,
        [name]: phoneRegex.test(value)
          ? ""
          : "Phone number must be numeric and up to 10 digits",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateProfile(formData);
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      setMessage("Failed to update profile");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      familyMembers: currentUser.familyMembers || "",
      restaurantName: currentUser.restaurantName || "",
      restaurantType: currentUser.restaurantType || "",
      restaurantAddress: currentUser.restaurantAddress || "",
      restaurantPhone: currentUser.restaurantPhone || "",
      businessRegistrationNo: currentUser.businessRegistrationNo || "",
      ownerFirstName: currentUser.ownerFirstName || "",
      ownerLastName: currentUser.ownerLastName || "",
      ownerPhone: currentUser.ownerPhone || "",
    });
    setIsEditing(false);
  };

  if (currentUser.role === "admin") {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <div className="header-content">
            <div className="profile-avatar admin-avatar">
              <span className="avatar-text">A</span>
              <div className="avatar-ring"></div>
            </div>
            <div className="header-info">
              <h2 className="profile-title">Admin Profile</h2>
              <p className="profile-subtitle">System Administrator Dashboard</p>
            </div>
          </div>
          <div className="admin-badge">
            <span className="badge-text">ADMIN</span>
          </div>
        </div>
        
        <div className="profile-card admin-card">
          <div className="card-header">
            <h3>Account Information</h3>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{currentUser.email}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Role</div>
              <div className="info-value role-admin">System Administrator</div>
            </div>
            <div className="info-item">
              <div className="info-label">Access Level</div>
              <div className="info-value">Full System Access</div>
            </div>
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value status-active">Active</div>
            </div>
          </div>
          <div className="admin-notice">
            <div className="notice-icon">🔒</div>
            <p>Admin profiles are protected and cannot be modified through this interface.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <div className="profile-avatar">
            <span className="avatar-text">
              {currentUser.firstName ? currentUser.firstName.charAt(0) : 
               currentUser.ownerFirstName ? currentUser.ownerFirstName.charAt(0) : 'U'}
            </span>
            <div className="avatar-ring"></div>
          </div>
          <div className="header-info">
            <h2 className="profile-title">My Profile</h2>
            <p className="profile-subtitle">Manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            <span className="btn-text">Edit Profile</span>
            <span className="btn-icon">✏️</span>
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
          <div className="message-icon">
            {message.includes("successfully") ? "✅" : "❌"}
          </div>
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section account-section">
          <div className="section-header">
            <h3>Account Information</h3>
            <div className="section-line"></div>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{currentUser.email}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Account Type</div>
              <div className={`info-value role-${currentUser.role}`}>
                {currentUser.role === 'household' ? 'Household Member' : 'Restaurant Owner'}
              </div>
            </div>
          </div>
        </div>

        {currentUser.role === "household" && (
          <div className="form-section personal-section">
            <div className="section-header">
              <h3>Personal Information</h3>
              <div className="section-line"></div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">First Name</span>
                  {isEditing && <span className="label-required">*</span>}
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    placeholder="Enter your first name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Last Name</span>
                  {isEditing && <span className="label-required">*</span>}
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Phone Number</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Family Members</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="familyMembers"
                    value={formData.familyMembers}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    placeholder="Number of family members"
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label className="form-label">
                  <span className="label-text">Address</span>
                </label>
                <div className="input-wrapper">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`form-textarea ${!isEditing ? 'disabled' : ''}`}
                    placeholder="Enter your full address"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentUser.role === "restaurant" && (
          <>
            <div className="form-section restaurant-section">
              <div className="section-header">
                <h3>Restaurant Information</h3>
                <div className="section-line"></div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Restaurant Name</span>
                    {isEditing && <span className="label-required">*</span>}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.restaurantName ? 'error' : ''}`}
                      placeholder="Enter restaurant name"
                    />
                    {formErrors.restaurantName && (
                      <span className="error-text">{formErrors.restaurantName}</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Restaurant Type</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      name="restaurantType"
                      value={formData.restaurantType}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-select ${!isEditing ? 'disabled' : ''}`}
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="catering">Catering Service</option>
                      <option value="cafe">Cafe</option>
                      <option value="fast-food">Fast Food</option>
                      <option value="hotel">Hotel</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Restaurant Phone</span>
                    {isEditing && <span className="label-required">*</span>}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="tel"
                      name="restaurantPhone"
                      value={formData.restaurantPhone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.restaurantPhone ? 'error' : ''}`}
                      placeholder="Enter restaurant phone"
                    />
                    {formErrors.restaurantPhone && (
                      <span className="error-text">{formErrors.restaurantPhone}</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Business Registration No</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="businessRegistrationNo"
                      value={formData.businessRegistrationNo}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.businessRegistrationNo ? 'error' : ''}`}
                      placeholder="Enter business registration number"
                    />
                    {formErrors.businessRegistrationNo && (
                      <span className="error-text">{formErrors.businessRegistrationNo}</span>
                    )}
                  </div>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="label-text">Restaurant Address</span>
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      name="restaurantAddress"
                      value={formData.restaurantAddress}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-textarea ${!isEditing ? 'disabled' : ''}`}
                      placeholder="Enter restaurant address"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section owner-section">
              <div className="section-header">
                <h3>Owner Information</h3>
                <div className="section-line"></div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Owner First Name</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="ownerFirstName"
                      value={formData.ownerFirstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.ownerFirstName ? 'error' : ''}`}
                      placeholder="Enter owner's first name"
                    />
                    {formErrors.ownerFirstName && (
                      <span className="error-text">{formErrors.ownerFirstName}</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Owner Last Name</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="ownerLastName"
                      value={formData.ownerLastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.ownerLastName ? 'error' : ''}`}
                      placeholder="Enter owner's last name"
                    />
                    {formErrors.ownerLastName && (
                      <span className="error-text">{formErrors.ownerLastName}</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-text">Owner Phone</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'disabled' : ''} ${formErrors.ownerPhone ? 'error' : ''}`}
                      placeholder="Enter owner's phone"
                    />
                    {formErrors.ownerPhone && (
                      <span className="error-text">{formErrors.ownerPhone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isEditing && (
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              <span className="btn-icon">❌</span>
              <span className="btn-text">Cancel</span>
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              <span className="btn-icon">{loading ? "⏳" : "💾"}</span>
              <span className="btn-text">{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;