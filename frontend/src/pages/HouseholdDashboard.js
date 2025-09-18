import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Profile from '../components/Profile';
import '../styles/Dashboard.css';
import RecipeManagement from '../components/RecipeManagement';
import PortionCalculator from '../components/PortionCalculator';
import LeftoverManagement from '../components/LeftoverManagement';
import StaffManagement from '../components/StaffManagement';
import FinanceManagement from '../components/FinanceDashboard';

const HouseholdDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'staff-management', label: 'Staff Management', icon: '🥗' },
    { id: 'portion-calculation', label: 'Portion Calculator', icon: '🍽️' },
    { id: 'recipe-management', label: 'Recipe Management', icon: '🍛' },
    { id: 'leftover-management', label: 'Manage Leftovers', icon: '♻️' },
    { id: 'finance-management', label: 'Finance Management', icon: '💰' }
  ];

      
       
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <Profile />;
      case 'portion-calculation':
        return <PortionCalculator />;
      case 'recipe-management':
        return <RecipeManagement />;
      case 'leftover-management':
        return <LeftoverManagement />;
      case 'staff-management':
        return <StaffManagement />;
      case 'finance-management':
        return <FinanceManagement />;
      default:
        return (
          <div className="dashboard-overview">
            <h2>Welcome to Your Household Dashboard</h2>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>🍽️ Meal Planning</h3>
                <p>Plan meals for your family efficiently</p>
                <span className="card-value">0 meals planned</span>
              </div>
              <div className="dashboard-card">
                <h3>♻️ Food Waste Reduced</h3>
                <p>Track your food waste reduction</p>
                <span className="card-value">0 kg saved</span>
              </div>
              <div className="dashboard-card">
                <h3>💰 Money Saved</h3>
                <p>See how much you've saved</p>
                <span className="card-value">$0 saved</span>
              </div>
              <div className="dashboard-card">
                <h3>📊 Analytics</h3>
                <p>View your cooking patterns</p>
                <span className="card-value">View Reports</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuItems={menuItems}
      />
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default HouseholdDashboard;