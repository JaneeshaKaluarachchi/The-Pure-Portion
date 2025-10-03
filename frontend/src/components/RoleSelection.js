import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoleSelection.css';
import logo from '../styles/images/p.png';
import hoverSoundFile from '../styles/sounds/hover-sound.mp3';
import LoadingScreen from './LoadingScreen';
import houselogo from '../styles/images/12.png';
import restalogo from '../styles/images/restaurant.png';

const RoleSelection = () => {
  const navigate = useNavigate();
  const hoverSound = new Audio(hoverSoundFile);
  
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);
  const [buttonHover, setButtonHover] = useState({ household: false, restaurant: false });
  const [isNavigating, setIsNavigating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [activeBackground, setActiveBackground] = useState(null);

  // Initialize component with enhanced animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setIsLoaded(true);
    }, 2000);
    
    // Create enhanced floating particles
    const timer2 = setTimeout(() => {
      createEnhancedParticles();
    }, 2300);
    
    // Add keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !isNavigating) {
        // Default to household selection on Enter
        handleRoleSelection('household');
      } else if (e.key === 'Escape') {
        document.activeElement?.blur();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isNavigating]);

  // Create enhanced floating particles
  const createEnhancedParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
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

  // Enhanced role selection handler
  const handleRoleSelection = useCallback(async (role) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    const button = document.querySelector(`.${role}-btn`);
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Play sound effect
    try {
      hoverSound.currentTime = 0;
      await hoverSound.play();
    } catch (error) {
      console.log('Sound play failed:', error);
    }
    
    // Add click animation
    button?.classList.add('btn-clicked');
    
    // Show loading overlay with delay
    setTimeout(() => {
      loadingOverlay?.classList.add('active');
    }, 200);
    
    // Navigate after smooth transition
    setTimeout(() => {
      button?.classList.remove('btn-clicked');
      navigate(`/register/${role}`);
    }, 1200);
  }, [navigate, isNavigating, hoverSound]);

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

  // Enhanced button hover handlers with background image effects
  const handleButtonHover = useCallback((buttonType, isHovering) => {
    setButtonHover(prev => ({ ...prev, [buttonType]: isHovering }));
    
    if (isHovering) {
      setActiveBackground(buttonType);
      // Add background-active class to card
      const card = document.querySelector('.role-selection-card');
      card?.classList.add('background-active');
      
      try {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(() => {});
      } catch (error) {
        console.log('Hover sound failed:', error);
      }
    } else {
      // Only remove background if no button is being hovered
      setTimeout(() => {
        if (!buttonHover.household && !buttonHover.restaurant) {
          setActiveBackground(null);
          const card = document.querySelector('.role-selection-card');
          card?.classList.remove('background-active');
        }
      }, 100);
    }
  }, [hoverSound, buttonHover]);

  // Logo click handler for easter egg
  const handleLogoClick = useCallback(() => {
    const logo = document.querySelector('.role-selection-logo');
    logo?.classList.add('logo-clicked');
    
    // Create celebration particles
    for (let i = 0; i < 8; i++) {
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div 
      className={`role-selection-container ${isLoaded ? 'loaded' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* Hover Background Images */}
      <div className={`hover-background household ${activeBackground === 'household' ? 'active' : ''}`}></div>
      <div className={`hover-background restaurant ${activeBackground === 'restaurant' ? 'active' : ''}`}></div>

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

      <div className="role-selection-card">
        <img 
          src={logo} 
          alt="PurePortion Logo" 
          className="role-selection-logo"
          onClick={handleLogoClick}
        />
        <h1>Welcome to PurePortion</h1>
        <p>Reduce food waste, save money, and plan meals efficiently</p>
        
        <div className="role-buttons">
          <button 
            className={`role-btn household-btn ${buttonHover.household ? 'hover-active' : ''}`}
            onClick={() => handleRoleSelection('household')}
            onMouseEnter={() => handleButtonHover('household', true)}
            onMouseLeave={() => handleButtonHover('household', false)}
            onFocus={() => handleButtonHover('household', true)}
            onBlur={() => handleButtonHover('household', false)}
            disabled={isNavigating}
          >
            <div className="btn-icon"><img class='logos' src={houselogo}></img></div>
            <h3>Household User</h3>
            <p>Plan meals for your family and reduce food waste at home</p>
          </button>

          <button 
            className={`role-btn restaurant-btn ${buttonHover.restaurant ? 'hover-active' : ''}`}
            onClick={() => handleRoleSelection('restaurant')}
            onMouseEnter={() => handleButtonHover('restaurant', true)}
            onMouseLeave={() => handleButtonHover('restaurant', false)}
            onFocus={() => handleButtonHover('restaurant', true)}
            onBlur={() => handleButtonHover('restaurant', false)}
            disabled={isNavigating}
          >
             <div className="btn-icon"><img class='logos' src={restalogo}></img></div>
            <h3>Restaurant & Catering</h3>
            <p>Manage inventory, staff, reduce food waste in your business</p>
          </button>
        </div>
        
        <div className="login-link">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>

      {/* Enhanced Loading Overlay */}
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
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

  .btn-clicked {
    transform: scale(0.95) !important;
    transition: transform 0.1s ease !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = celebrationStyles;
  document.head.appendChild(styleSheet);
}

export default RoleSelection;