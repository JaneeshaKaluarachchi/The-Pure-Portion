import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Register.css';

const HouseholdRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    familyMembers: '',
    password: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

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

  // Field validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          error = 'Only letters and spaces are allowed';
        }
        break;

      case 'phone':
        if (!/^\d{10}$/.test(value)) {
          error = 'Phone number must be 10 digits';
        }
        break;

      case 'familyMembers':
        if (value < 1 || value >= 30) {
          error = 'Family members must be between 1 and 29';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // validate on change
    setFieldErrors({
      ...fieldErrors,
      [name]: validateField(name, value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ✅ validate all fields before submit
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'password' && key !== 'confirmPassword') {
        const err = validateField(key, formData[key]);
        if (err) newErrors[key] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await register(dataToSend, 'household');
      navigate('/login', {
        state: { message: 'Registration successful! Please login.' }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

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
        <h2>Household Registration</h2>
        <p>Join PurePortion to manage your family's meals efficiently</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label className='formtext'>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter first name"
              />
              {fieldErrors.firstName && (
                <span className="error-message">{fieldErrors.firstName}</span>
              )}
            </div>
            <div className="form-group">
              <label className='formtext'>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter last name"
              />
              {fieldErrors.lastName && (
                <span className="error-message">{fieldErrors.lastName}</span>
              )}
            </div>
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

          <div className="form-group">
            <label className='formtext'>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter 10-digit phone number"
            />
            {fieldErrors.phone && (
              <span className="error-message">{fieldErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label className='formtext'>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              required
              placeholder="Enter complete address"
            />
          </div>

          <div className="form-group">
            <label className='formtext'>Number of Family Members *</label>
            <input
              type="number"
              name="familyMembers"
              value={formData.familyMembers}
              onChange={handleChange}
              min="1"
              required
              placeholder="Enter number of family members"
            />
            {fieldErrors.familyMembers && (
              <span className="error-message">{fieldErrors.familyMembers}</span>
            )}
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

          <button type="submit" disabled={loading} className="register-btn">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="form-links">
          <Link to="/register/restaurant">Register as Restaurant</Link>
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default HouseholdRegister;