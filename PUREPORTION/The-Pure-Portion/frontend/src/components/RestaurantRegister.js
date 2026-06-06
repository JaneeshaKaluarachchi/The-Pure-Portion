import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Register.css';
import LoadingScreen from './LoadingScreen';

const RestaurantRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
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

  //Validation state
  const [errors, setErrors] = useState({
    restaurantName: '',
    restaurantPhone: '',
    businessRegistrationNo: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: ''
  });

  // Initialize component with enhanced animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    // Create enhanced floating particles
    const timer2 = setTimeout(() => {
      createEnhancedParticles();
    }, 600);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  // Create enhanced floating particles
  const createEnhancedParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 15,
        animationDuration: Math.random() * 8 + 12,
        size: Math.random() * 6 + 2,
        opacity: Math.random() * 0.4 + 0.3
      });
    }
    setParticles(newParticles);
  };

  // Enhanced mouse move effect
  const handleMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    
    setMousePosition({ x, y });
    
    // Update CSS custom properties for interactive background
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setFormData({
      ...formData,
      [fieldName]: fieldValue
    });

    validateField(fieldName, fieldValue);
  };

  //create a validation handler
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'restaurantName':
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          error = "Only letters and spaces are allowed";
        }
        break;

      case 'restaurantPhone':
        if (!/^\d{10}$/.test(value)) {
          error = "Phone must be exactly 10 digits (numbers only)";
        }
        break;

      case 'businessRegistrationNo':
        if (/[^a-zA-Z0-9\s]/.test(value)) {
          error = "Special characters are not allowed";
        }

        break;

      case 'ownerFirstName':
      case 'ownerLastName':
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          error = "Only letters and spaces are allowed";
        }
        break;

      case 'ownerPhone':
        if (!/^\d{10}$/.test(value)) {
          error = "Phone must be exactly 10 digits (numbers only)";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
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

  if (loading) {
    return <LoadingScreen />; // show spinner
  }

  return (
    <div 
      className={`register-container ${isLoaded ? 'loaded' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* Enhanced Floating Particles */}
      <div className="particles-container">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="floating-particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity
            }}
          />
        ))}
      </div>

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
              <label className='formtext'>Restaurant Name *</label>
              <input
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                required
                placeholder="Enter restaurant name"
              />
              {errors.restaurantName && <small className="error-message">{errors.restaurantName}</small>}
            </div>

            <div className="form-group">
              <label className='formtext'>Restaurant Type *</label>
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
              <label className='formtext'>Restaurant Address *</label>
              <textarea
                name="restaurantAddress"
                value={formData.restaurantAddress}
                onChange={handleChange}
                rows="3"
                required
                placeholder="Enter complete restaurant address"
              />
            </div>

            <div className="form-group">
              <label className='formtext'>Restaurant Phone *</label>
              <input
                type="tel"
                name="restaurantPhone"
                value={formData.restaurantPhone}
                onChange={handleChange}
                required
                placeholder="Enter 10-digit phone number"
              />
              {errors.restaurantPhone && <small className="error-message">{errors.restaurantPhone}</small>}
            </div>

            <div className="form-group">
              <label className='formtext'>Business Registration Number *</label>
              <input
                type="text"
                name="businessRegistrationNo"
                value={formData.businessRegistrationNo}
                onChange={handleChange}
                required
                placeholder="Enter business registration number"
              />
              {errors.businessRegistrationNo && (
                <small className="error-message">{errors.businessRegistrationNo}</small>
              )}
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
                <label className='formtext'>Owner First Name *</label>
                <input
                  type="text"
                  name="ownerFirstName"
                  value={formData.ownerFirstName}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                />
                {errors.ownerFirstName && (
                  <small className="error-message">{errors.ownerFirstName}</small>
                )}
              </div>
              <div className="form-group">
                <label className='formtext'>Owner Last Name *</label>
                <input
                  type="text"
                  name="ownerLastName"
                  value={formData.ownerLastName}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                />
                {errors.ownerLastName && (
                  <small className="error-message">{errors.ownerLastName}</small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className='formtext'>Owner Phone *</label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                required
                placeholder="Enter 10-digit phone number"
              />
              {errors.ownerPhone && (
                <small className="error-message">{errors.ownerPhone}</small>
              )}
            </div>

            <div className="form-group">
              <label className='formtext'>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className='formtext'>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create password"
                />
              </div>
              <div className="form-group">
                <label className='formtext'>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="form-buttons" >
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