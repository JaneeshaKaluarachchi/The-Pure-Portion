import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Sidebar.css';
import logo from '../styles/images/p.png'; // your logo

const Sidebar = ({ activeSection, setActiveSection, menuItems }) => {
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Enhanced initialization with staggered animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Add keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        document.activeElement?.blur();
      }
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isCollapsed]);

  // Update CSS custom property when collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
  }, [isCollapsed]);

  // Enhanced mouse tracking for interactive effects
  const handleMouseMove = useCallback((e) => {
    const sidebar = e.currentTarget;
    const rect = sidebar.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
    
    // Update CSS custom properties for interactive background
    sidebar.style.setProperty('--mouse-x', `${x}%`);
    sidebar.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  // Enhanced logout handler with animation
  const handleLogout = useCallback(async () => {
    const logoutBtn = document.querySelector('.logout-btn');
    
    // Add click animation
    logoutBtn?.classList.add('btn-clicked');
    
    // Create ripple effect
    createRippleEffect(logoutBtn);
    
    // Delay logout for smooth animation
    setTimeout(() => {
      logout();
    }, 300);
  }, [logout]);

  // Enhanced navigation handler with sound and animation
  const handleNavigation = useCallback((itemId, event) => {
    const navItem = event.currentTarget;
    
    // Add click animation
    navItem.classList.add('nav-clicked');
    
    // Create ripple effect
    createRippleEffect(navItem, event);
    
    // Set active section with slight delay for animation
    setTimeout(() => {
      setActiveSection(itemId);
      navItem.classList.remove('nav-clicked');
    }, 150);
  }, [setActiveSection]);

  // Enhanced toggle handler with animation
  const handleToggle = useCallback(() => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');
    
    // Add animation classes
    toggleBtn?.classList.add('toggle-clicked');
    sidebar?.classList.add('sidebar-transitioning');
    
    // Toggle state
    setIsCollapsed(!isCollapsed);
    
    // Remove animation classes after transition
    setTimeout(() => {
      toggleBtn?.classList.remove('toggle-clicked');
      sidebar?.classList.remove('sidebar-transitioning');
    }, 400);
  }, [isCollapsed]);

  // Create ripple effect on click
  const createRippleEffect = (element, event = null) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event ? event.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
    const y = event ? event.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // Enhanced hover handlers for nav items
  const handleNavHover = useCallback((isHovering, element) => {
    if (!element) return;
    
    if (isHovering) {
      element.style.transform = isCollapsed ? 'translateX(0) scale(1.05)' : 'translateX(5px)';
      
      // Add glow effect
      element.style.boxShadow = isCollapsed 
        ? '0 5px 15px rgba(0, 184, 148, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : '0 5px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    } else {
      element.style.transform = '';
      element.style.boxShadow = '';
    }
  }, [isCollapsed]);

  // Get user display info with enhanced logic
  const getUserDisplayInfo = () => {
    const getInitial = () => {
      if (currentUser.firstName) return currentUser.firstName.charAt(0).toUpperCase();
      if (currentUser.ownerFirstName) return currentUser.ownerFirstName.charAt(0).toUpperCase();
      return currentUser.role === 'admin' ? 'A' : 'U';
    };

    const getName = () => {
      if (currentUser.firstName) return `${currentUser.firstName} ${currentUser.lastName}`;
      if (currentUser.ownerFirstName) return `${currentUser.ownerFirstName} ${currentUser.ownerLastName}`;
      return 'Admin User';
    };

    return { initial: getInitial(), name: getName() };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <div 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isLoaded ? 'loaded' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className="sidebar-header">
        <img 
          src={logo} 
          alt="Logo" 
          className="sidebar-logo"
          onClick={() => {
            // Easter egg: logo click animation
            const logo = document.querySelector('.sidebar-logo');
            logo?.classList.add('logo-clicked');
            setTimeout(() => logo?.classList.remove('logo-clicked'), 1000);
          }}
        />
        <button 
          className="toggle-btn"
          onClick={handleToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

<div className="user-info">
  <div 
    className="user-avatar"
    onClick={() => setActiveSection("profile")} // 👈 Click redirects to Profile
    style={{ cursor: "pointer" }} // optional, makes it look clickable
  >
    {userInfo.initial}
  </div>

  {!isCollapsed && (
    <div className="user-details">
      <span className="user-name">{userInfo.name}</span>
      <span className="user-role">{currentUser.role}</span>
    </div>
  )}
</div>


      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={(e) => handleNavigation(item.id, e)}
            onMouseEnter={(e) => handleNavHover(true, e.currentTarget)}
            onMouseLeave={(e) => handleNavHover(false, e.currentTarget)}
            onFocus={(e) => handleNavHover(true, e.currentTarget)}
            onBlur={(e) => handleNavHover(false, e.currentTarget)}
            title={isCollapsed ? item.label : ''}
            aria-label={item.label}
            style={{ '--delay': `${index * 0.1}s` }}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
          }}
          title="Logout"
          aria-label="Logout"
        >
          <span className="nav-icon">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

// Inject additional styles for enhanced animations
const enhancedStyles = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .nav-clicked {
    transform: scale(0.98) !important;
    transition: transform 0.1s ease !important;
  }
  
  .toggle-clicked {
    transform: scale(0.9) rotate(180deg) !important;
    transition: transform 0.2s ease !important;
  }
  
  .btn-clicked {
    transform: scale(0.95) !important;
    transition: transform 0.1s ease !important;
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
  
  .sidebar-transitioning {
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .sidebar.loaded {
    animation: sidebarSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes sidebarSlideIn {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = enhancedStyles;
  document.head.appendChild(styleSheet);
}

export default Sidebar;