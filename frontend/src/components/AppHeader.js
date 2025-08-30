import React, { useState } from 'react';
import '../styles/GlobalTheme.css';
import '../styles/AppHeader.css';

const AppHeader = ({ user, onLogout, onMenuToggle }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    if (onLogout) onLogout();
    window.location.href = '/login';
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <img 
            src="/uploads/PURE(1).png" 
            alt="PurePortion Logo" 
            className="logo-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="logo-text">
            <h1 className="logo-title">PurePortion</h1>
            <p className="logo-subtitle">Smart Food Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="main-navigation">
          <ul className="nav-menu">
            <li className="nav-item">
              <a href="/dashboard" className="nav-link">
                <span className="nav-icon">📊</span>
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="/recipes" className="nav-link">
                <span className="nav-icon">🍛</span>
                Recipes
              </a>
            </li>
            <li className="nav-item">
              <a href="/leftovers" className="nav-link">
                <span className="nav-icon">♻️</span>
                Leftovers
              </a>
            </li>
          </ul>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={onMenuToggle}
          >
            ☰
          </button>
        </nav>

        {/* User Section */}
        <div className="user-section">
          <div className="header-actions">
            <button className="notification-btn">
              <span className="nav-icon">🔔</span>
              <span className="notification-badge"></span>
            </button>
          </div>

          <div 
            className="user-info"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <div className="user-avatar">
              {getUserInitials(user?.name || 'User')}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'Guest User'}</p>
              <p className="user-role">{user?.userType || 'user'}</p>
            </div>
            
            {/* Dropdown Menu */}
            <div className={`user-dropdown ${showUserDropdown ? 'show' : ''}`}>
              <a href="/profile" className="dropdown-item">
                👤 Profile Settings
              </a>
              <a href="/settings" className="dropdown-item">
                ⚙️ Account Settings
              </a>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;