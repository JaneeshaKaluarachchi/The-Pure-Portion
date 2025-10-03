import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from "./LoadingScreen";
import '../styles/Login.css';
import logo from '../styles/images/p.png';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const successMessage = location.state?.message;

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
    for (let i = 0; i < 12; i++) {
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

  // Logo click handler for easter egg
  const handleLogoClick = useCallback(() => {
    const logo = document.querySelector('.role-selection-logo');
    logo?.classList.add('logo-clicked');
    
    // Create celebration particles
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        createCelebrationParticle();
      }, i * 100);
    }
    
    setTimeout(() => {
      logo?.classList.remove('logo-clicked');
    }, 1000);
  }, [mousePosition]);

  const createCelebrationParticle = () => {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: linear-gradient(45deg, #00b894, #019875);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      left: ${mousePosition.x}%;
      top: ${mousePosition.y}%;
      animation: celebrationPop 1s ease-out forwards;
    `;
    
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      
      // Redirect based on user role
      if (user.role === 'household') {
        navigate('/household-dashboard');
      } else if (user.role === 'restaurant') {
        navigate('/restaurant-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };
  if (loading) return <LoadingScreen />;
  return (
    <div 
      className={`login-container ${isLoaded ? 'loaded' : ''}`}
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

      <div className="login-card">
        <img 
          src={logo} 
          alt="PurePortion Logo" 
          className="role-selection-logo"
          onClick={handleLogoClick}
        />
        <h2>Login to PurePortion</h2>
        <p>Welcome back! Please enter your credentials</p>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className='loginformtext'>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className='loginformtext'>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="form-links">
          <Link to="/role-selection">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
};

// Add celebration particle keyframes to document
const celebrationStyles = `
  @keyframes celebrationPop {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: scale(1.5) rotate(180deg);
      opacity: 0.8;
    }
    100% {
      transform: scale(0) rotate(360deg) translateY(-100px);
      opacity: 0;
    }
  }
  
  .logo-clicked {
    animation: logoClick 1s ease-out !important;
  }
  
  @keyframes logoClick {
    0% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(2deg); }
    50% { transform: scale(1.05) rotate(-1deg); }
    75% { transform: scale(1.02) rotate(0.5deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = celebrationStyles;
  document.head.appendChild(styleSheet);
}

export default Login;