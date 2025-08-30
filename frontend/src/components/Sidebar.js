import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Sidebar.css';
import logo from '../styles/images/1 white.png'; // your logo

const Sidebar = ({ activeSection, setActiveSection, menuItems }) => {
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => logout();

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <button 
          className="toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="user-info">
        {!isCollapsed && (
          <>
            <div className="user-avatar">
              {currentUser.firstName ? 
                currentUser.firstName.charAt(0).toUpperCase() : 
                currentUser.ownerFirstName ? 
                currentUser.ownerFirstName.charAt(0).toUpperCase() :
                currentUser.role === 'admin' ? 'A' : 'U'
              }
            </div>
            <div className="user-details">
              <span className="user-name">
                {currentUser.firstName ? 
                  `${currentUser.firstName} ${currentUser.lastName}` :
                  currentUser.ownerFirstName ?
                  `${currentUser.ownerFirstName} ${currentUser.ownerLastName}` :
                  'Admin User'
                }
              </span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
