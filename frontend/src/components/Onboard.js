import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Onboard.css";
import logo from "../styles/images/p.png"; 
import plate from "../styles/images/123.png"; // Plate image

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);
  const [buttonHover, setButtonHover] = useState({ primary: false, secondary: false });
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Initialize component with enhanced animations
  useEffect(() => {
    // Staggered entrance animation
    const timer1 = setTimeout(() => setIsLoaded(true), 150);
    
    // Create enhanced floating particles
    const timer2 = setTimeout(() => {
      createEnhancedParticles();
    }, 300);
    
    // Add keyboard navigation with enhanced feedback
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !isLoading) {
        handlePrimaryClick();
      } else if (e.key === 'Escape') {
        // Add escape key functionality for accessibility
        document.activeElement?.blur();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isLoading]);

  // Create enhanced floating particles with more variety
  const createEnhancedParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 25; i++) {
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

  // Enhanced button click handlers with loading states
  const handlePrimaryClick = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const button = document.querySelector('.btn.primary');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Add click animation
    button?.classList.add('btn-clicked');
    
    // Show loading overlay with delay for smooth transition
    setTimeout(() => {
      loadingOverlay?.classList.add('active');
    }, 200);
    
    // Simulate loading time for smooth transition
    setTimeout(() => {
      button?.classList.remove('btn-clicked');
      navigate("/role-selection");
    }, 1200);
  }, [navigate, isLoading]);

  const handleSecondaryClick = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const button = document.querySelector('.btn.secondary');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    button?.classList.add('btn-clicked');
    
    setTimeout(() => {
      loadingOverlay?.classList.add('active');
    }, 200);
    
    setTimeout(() => {
      button?.classList.remove('btn-clicked');
      navigate("/login");
    }, 1200);
  }, [navigate, isLoading]);

  // Enhanced mouse move effect with smooth interpolation
  const handleMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    
    setMousePosition({ x, y });
    
    // Update CSS custom properties for interactive background
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  // Enhanced button hover handlers with more sophisticated effects
  const handleButtonHover = useCallback((buttonType, isHovering) => {
    setButtonHover(prev => ({ ...prev, [buttonType]: isHovering }));
    
    // Add subtle haptic feedback simulation through micro-animations
    const button = document.querySelector(`.btn.${buttonType}`);
    if (button && isHovering) {
      button.style.transform = 'translateY(-8px) scale(1.05)';
    }
  }, []);

  // Logo click handler for easter egg
  const handleLogoClick = useCallback(() => {
    const logo = document.querySelector('.logo');
    logo?.classList.add('logo-clicked');
    
    // Create celebration particles
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        createCelebrationParticle();
      }, i * 100);
    }
    
    setTimeout(() => {
      logo?.classList.remove('logo-clicked');
    }, 1000);
  }, []);

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

  return (
    <div 
      className={`onboarding-container ${isLoaded ? 'loaded' : ''}`}
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

      {/* Enhanced Rotating Plate */}
      <div className="plate-wrapper">
        <img 
          src={plate} 
          alt="Plate" 
          className="rotating-plate"
          onLoad={() => console.log('Plate image loaded with enhanced animations')}
        />
      </div>

      {/* Enhanced Interactive Overlay */}
      <div className="overlay"></div>

      {/* Enhanced Main Content */}
      <div className="content">
        {/* Enhanced Logo with Click Interaction */}
        <div className="logo-container">
          <img 
            src={logo} 
            alt="Pure Portion Logo" 
            className="logo"
            onClick={handleLogoClick}
            onLoad={() => console.log('Logo loaded with enhanced animations')}
          />
        </div>

        {/* Enhanced Subtitle with Staggered Animation */}
        <p className="subtitle">
          <span className="subtitle-line">
            Redefining how households, restaurants, and communities
          </span>
          <br />
          <span className="subtitle-line subtitle-line-2">
            share food responsibly.
          </span>
        </p>

        {/* Enhanced Buttons with Advanced Interactions */}
        <div className="buttons">
          <button 
            className={`btn primary ${buttonHover.primary ? 'hover-active' : ''}`}
            onClick={handlePrimaryClick}
            onMouseEnter={() => handleButtonHover('primary', true)}
            onMouseLeave={() => handleButtonHover('primary', false)}
            onFocus={() => handleButtonHover('primary', true)}
            onBlur={() => handleButtonHover('primary', false)}
            disabled={isLoading}
          >
            <span className="btn-text">Get Started</span>
            <span className="btn-icon">→</span>
          </button>
          
          <button 
            className={`btn secondary ${buttonHover.secondary ? 'hover-active' : ''}`}
            onClick={handleSecondaryClick}
            onMouseEnter={() => handleButtonHover('secondary', true)}
            onMouseLeave={() => handleButtonHover('secondary', false)}
            onFocus={() => handleButtonHover('secondary', true)}
            onBlur={() => handleButtonHover('secondary', false)}
            disabled={isLoading}
          >
            <span className="btn-text">Already a Member?</span>
            <span className="btn-icon">↗</span>
          </button>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="progress-indicator">
          <div className="progress-dot active"></div>
          <div className="progress-dot"></div>
          <div className="progress-dot"></div>
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
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = celebrationStyles;
  document.head.appendChild(styleSheet);
}

export default Onboarding;