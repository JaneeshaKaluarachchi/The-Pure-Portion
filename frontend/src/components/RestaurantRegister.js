import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Register.css';
import LoadingScreen from './LoadingScreen';

const RestaurantRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Restaurant details
    restaurantName: '',
    restaurantType: '',
    restaurantAddress: '',
    restaurantPhone: '',
    businessRegistrationNo: '',
    // Owner details
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await register(dataToSend, 'restaurant');
      navigate('/login', { 
        state: { message: 'Registration successful! Please login.' }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />; // show spinner
  }
  
  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Restaurant & Catering Registration</h2>
        <div className="step-indicator">
          <span className={step === 1 ? 'active' : ''}>Step 1: Restaurant Details</span>
          <span className={step === 2 ? 'active' : ''}>Step 2: Owner Details</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleNext} className="register-form">
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Restaurant Type *</label>
              <select
                name="restaurantType"
                value={formData.restaurantType}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="restaurant">Restaurant</option>
                <option value="catering">Catering Service</option>
                <option value="cafe">Cafe</option>
                <option value="fast-food">Fast Food</option>
                <option value="hotel">Hotel</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Restaurant Address *</label>
              <textarea
                name="restaurantAddress"
                value={formData.restaurantAddress}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Restaurant Phone *</label>
              <input
                type="tel"
                name="restaurantPhone"
                value={formData.restaurantPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Business Registration Number *</label>
              <input
                type="text"
                name="businessRegistrationNo"
                value={formData.businessRegistrationNo}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="register-btn">
              Next: Owner Details
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label>Owner First Name *</label>
                <input
                  type="text"
                  name="ownerFirstName"
                  value={formData.ownerFirstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Owner Last Name *</label>
                <input
                  type="text"
                  name="ownerLastName"
                  value={formData.ownerLastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Owner Phone *</label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                required
              />
            </div>

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

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={handleBack} className="back-btn">
                Back
              </button>
              <button type="submit" disabled={loading} className="register-btn">
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="form-links">
          <Link to="/register/household">Register as Household</Link>
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegister;