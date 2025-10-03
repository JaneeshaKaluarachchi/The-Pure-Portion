import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Profile from '../components/Profile';
import StaffManagement from '../components/StaffManagement';
import InventoryManagement from '../components/InventoryManagement';
import RecipeManagement from '../components/RecipeManagement';
import PortionCalculator from '../components/PortionCalculator';
import LeftoverManagement from '../components/LeftoverManagement';
import '../styles/Dashboard.css';
import FinanceManagement from '../components/FinanceDashboard';

const RestaurantDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'staff-management', label: 'Staff Management', icon: '👥' },
    { id: 'recipe-management', label: 'Recipe Management', icon: '🍛' },
    { id: 'portion-calculation', label: 'Portion Calculator', icon: '🍽️' },
    { id: 'leftover-management', label: 'Manage Leftovers', icon: '♻️' },
    { id: 'inventory-management', label: 'Inventory Management', icon: '📦' },
    { id: 'finance-management', label: 'Finance Management', icon: '💰' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <Profile />;
      case 'staff-management':
        return <StaffManagement />;
      case 'recipe-management':
        return <RecipeManagement />;
      case 'portion-calculation':
        return <PortionCalculator />;
      case 'leftover-management':
        return <LeftoverManagement />;
      case 'inventory-management':
        return <InventoryManagement />;
      case 'finance-management':
        return <FinanceManagement />;
      
      default:
        // Dashboard overview content
        return (
          <div className="dashboard-overview">
            <h2>Welcome to Your Restaurant Dashboard</h2>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>👥 Staff Members</h3>
                <p>Total active staff</p>
                <span className="card-value">{/* Replace with actual staff count */}0 staff</span>
              </div>
              <div className="dashboard-card">
                <h3>📦 Inventory Items</h3>
                <p>Total items in inventory</p>
                <span className="card-value">{/* Replace with inventory count */}0 items</span>
              </div>
              <div className="dashboard-card">
                <h3>♻️ Food Waste Reduced</h3>
                <p>Monthly waste reduction</p>
                <span className="card-value">{/* Replace with waste reduced */}0 kg saved</span>
              </div>
              <div className="dashboard-card">
                <h3>💰 Monthly Savings</h3>
                <p>Money saved this month</p>
                <span className="card-value">{/* Replace with monthly savings */}$0 saved</span>
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

export default RestaurantDashboard;
