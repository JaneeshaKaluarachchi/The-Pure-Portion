import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Profile.css";

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <h2>Admin Profile</h2>
        </div>
        <div className="profile-info">
          <div className="info-row">
            <label>Email:</label>
            <span>{currentUser.email}</span>
          </div>
          <div className="info-row">
            <label>Role:</label>
            <span>System Administrator</span>
          </div>
          <p>Admin profile cannot be modified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        {!isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            Edit Profile ✏️
          </button>
        )}
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

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Account Information</h3>
          <div className="info-row">
            <label>Email:</label>
            <span>{currentUser.email}</span>
          </div>
          <div className="info-row">
            <label>Role:</label>
            <span>{currentUser.role}</span>
          </div>
        </div>

        {currentUser.role === "household" && (
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Family Members</label>
              <input
                type="number"
                name="familyMembers"
                value={formData.familyMembers}
                onChange={handleChange}
                disabled={!isEditing}
                min="1"
              />
            </div>
          </div>
        )}

        {currentUser.role === "restaurant" && (
          <>
            <div className="form-section">
              <h3>Restaurant Information</h3>
              <div className="form-group">
                <label>Restaurant Name</label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Restaurant Type</label>
                <select
                  name="restaurantType"
                  value={formData.restaurantType}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="catering">Catering Service</option>
                  <option value="cafe">Cafe</option>
                  <option value="fast-food">Fast Food</option>
                  <option value="hotel">Hotel</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Restaurant Address</label>
                <textarea
                  name="restaurantAddress"
                  value={formData.restaurantAddress}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Restaurant Phone</label>
                <input
                  type="tel"
                  name="restaurantPhone"
                  value={formData.restaurantPhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Business Registration No</label>
                <input
                  type="text"
                  name="businessRegistrationNo"
                  value={formData.businessRegistrationNo}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Owner Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Owner First Name</label>
                  <input
                    type="text"
                    name="ownerFirstName"
                    value={formData.ownerFirstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>Owner Last Name</label>
                  <input
                    type="text"
                    name="ownerLastName"
                    value={formData.ownerLastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Owner Phone</label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </>
        )}
        
        {isEditing && (
          <div className="form-buttons">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;
