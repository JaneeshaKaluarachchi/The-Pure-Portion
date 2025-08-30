import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoleSelection.css';
import logo from '../styles/images/1.png';
import hoverSoundFile from '../styles/sounds/hover-sound.mp3';
import LoadingScreen from './LoadingScreen';

const RoleSelection = () => {
  const navigate = useNavigate();
  const hoverSound = new Audio(hoverSoundFile);

  const playHoverSound = () => {
    hoverSound.currentTime = 0; // reset sound if hovered quickly
    hoverSound.play();
  };
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />; // show spinner
  }

  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <img src={logo} alt="PurePortion Logo" className="role-selection-logo" />
        <h1>Welcome to PurePortion</h1>
        <p>Reduce food waste, save money, and plan meals efficiently</p>
        
        <div className="role-buttons">
          <button 
            className="role-btn household-btn"
            onMouseEnter={playHoverSound}  // 👈 plays sound on hover
            onClick={() => navigate('/register/household')}
          >
            <div className="btn-icon">🏠</div>
            <h3>Household User</h3>
            <p>Plan meals for your family and reduce food waste at home</p>
          </button>
          
          <button 
            className="role-btn restaurant-btn"
            onMouseEnter={playHoverSound}  // 👈 plays sound on hover
            onClick={() => navigate('/register/restaurant')}
          >
            <div className="btn-icon">🍽️</div>
            <h3>Restaurant & Catering</h3>
            <p>Manage inventory, staff, and reduce food waste in your business</p>
          </button>
        </div>
        
        <div className="login-link">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
