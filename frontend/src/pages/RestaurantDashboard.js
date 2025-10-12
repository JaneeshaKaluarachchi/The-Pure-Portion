import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [restaurantName, setRestaurantName] = useState('Your Restaurant');
  const [recipes, setRecipes] = useState([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalStaff: 0,
    totalInventoryItems: 0,
    totalRecipes: 0,
    foodWasteReduced: 0,
    monthlySavings: 0,
    lowStockItems: 0,
    expiringItems: 0,
    todayIncome: 0,
    todayExpenses: 0,
    monthlyProfit: 0,
    inventoryValue: 0
  });
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    currentlyIn: 0,
    notClockedIn: 0
  });
  const [currentFinanceIndex, setCurrentFinanceIndex] = useState(0);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardStats();
      fetchRestaurantProfile();
      fetchRecipes();
    }
  }, [activeSection]);

  useEffect(() => {
    if (recipes.length > 0) {
      const interval = setInterval(() => {
        setCurrentRecipeIndex((prevIndex) => 
          prevIndex === recipes.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000); // Change recipe every 3 seconds

      return () => clearInterval(interval);
    }
  }, [recipes]);

  useEffect(() => {
    // Rotate finance stats every 3 seconds (4 stats)
    const interval = setInterval(() => {
      setCurrentFinanceIndex((prevIndex) => (prevIndex + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchRestaurantProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurantName(response.data.restaurantName || 'Your Restaurant');
    } catch (error) {
      console.error('Failed to fetch restaurant profile:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/recipes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(response.data.recipes || []);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch staff stats
      const staffResponse = await axios.get('/api/staff/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch inventory stats
      const inventoryResponse = await axios.get('/api/inventory/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch recipe stats (curries and meals count)
      const recipeResponse = await axios.get('/api/recipes/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch today's profit for income and expenses
      const dailyProfitResponse = await axios.get('/api/finance/daily-profit', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch monthly profit
      const monthlyProfitResponse = await axios.get('/api/finance/monthly-profit', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch today's attendance
      const attendanceResponse = await axios.get('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboardStats({
        totalStaff: staffResponse.data.totalStaff || 0,
        totalInventoryItems: inventoryResponse.data.totalItems || 0,
        totalRecipes: recipeResponse.data.totalRecipes || 0,
        lowStockItems: inventoryResponse.data.alerts?.lowStock || 0,
        expiringItems: inventoryResponse.data.alerts?.expiringSoon || 0,
        inventoryValue: inventoryResponse.data.totalValue || 0,
        todayIncome: dailyProfitResponse.data?.data?.totalIncome || 0,
        todayExpenses: dailyProfitResponse.data?.data?.totalExpenses || 0,
        monthlyProfit: monthlyProfitResponse.data?.data?.profit || 0,
        foodWasteReduced: 0, // This can be calculated from leftover data
        monthlySavings: 0 // This can be calculated from finance data
      });

      setAttendanceStats({
        total: attendanceResponse.data?.summary?.total || 0,
        present: attendanceResponse.data?.summary?.present || 0,
        currentlyIn: attendanceResponse.data?.summary?.currentlyIn || 0,
        notClockedIn: attendanceResponse.data?.summary?.notClockedIn || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const handlePrevRecipe = () => {
    setCurrentRecipeIndex((prevIndex) => 
      prevIndex === 0 ? recipes.length - 1 : prevIndex - 1
    );
  };

  const handleNextRecipe = () => {
    setCurrentRecipeIndex((prevIndex) => 
      prevIndex === recipes.length - 1 ? 0 : prevIndex + 1
    );
  };

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
            <div className="dashboard-overview-container">
              <h2>Welcome to {restaurantName} Dashboard</h2>
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>👥 Staff Members</h3>
                  <p>Total active staff</p>
                  <span className="card-value">{dashboardStats.totalStaff} staff</span>
                </div>
                <div className="dashboard-card">
                  <h3>📦 Inventory Items</h3>
                  <p>Total items in inventory</p>
                  <span className="card-value">{dashboardStats.totalInventoryItems} items</span>
                </div>
                <div className="dashboard-card">
                  <h3>🍛 Total Recipes</h3>
                  <p>Curries and meals</p>
                  <span className="card-value">{dashboardStats.totalRecipes} recipes</span>
                </div>
                <div className="dashboard-card">
                  <h3>♻️ Food Waste Reduced</h3>
                  <p>Monthly waste reduction</p>
                  <span className="card-value">{dashboardStats.foodWasteReduced} kg saved</span>
                </div>
              </div>
            </div>

            {/* Recipe and Inventory Section */}
            <div className="dashboard-dual-section">
              {/* Recipe Carousel Section */}
              <div className="recipe-showcase-section">
                <h3 className="carousel-title">
                  <span className="carousel-icon">🍽️</span>
                  Our Recipes
                </h3>
                
                {recipes.length > 0 ? (
                  <div className="recipe-carousel-vertical">
                    <div className="recipe-image-rotating">
                      {recipes[currentRecipeIndex].imageUrl ? (
                        <img 
                          src={recipes[currentRecipeIndex].imageUrl}
                          alt={recipes[currentRecipeIndex].name}
                          className="recipe-rotating-image"
                        />
                      ) : (
                        <div className="recipe-placeholder">
                          <span className="placeholder-icon">🍛</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="recipe-details-vertical">
                      <h4 className="recipe-name">{recipes[currentRecipeIndex].name}</h4>
                      <div className="recipe-info-grid">
                        <div className="info-item">
                          <span className="info-icon">📂</span>
                          <div>
                            <span className="info-label">Category</span>
                            <span className="info-value">{recipes[currentRecipeIndex].category}</span>
                          </div>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">👥</span>
                          <div>
                            <span className="info-label">Servings</span>
                            <span className="info-value">{recipes[currentRecipeIndex].servings} persons</span>
                          </div>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">💰</span>
                          <div>
                            <span className="info-label">Cost</span>
                            <span className="info-value">Rs. {recipes[currentRecipeIndex].costPerServing?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="recipe-navigation">
                        <button className="nav-btn" onClick={handlePrevRecipe}>
                          ← Prev
                        </button>
                        <div className="recipe-counter">
                          {currentRecipeIndex + 1} / {recipes.length}
                        </div>
                        <button className="nav-btn" onClick={handleNextRecipe}>
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-recipes">
                    <p>No recipes available. Add your first recipe to see it here!</p>
                  </div>
                )}
              </div>

              {/* Inventory Quick View Section */}
              <div className="inventory-showcase-section">
                <h3 className="carousel-title">
                  <span className="carousel-icon">📦</span>
                  Inventory Overview
                </h3>
                
                <div className="inventory-summary">
                  {/* Total Items - No Background */}
                  <div className="inventory-total-stat">
                    <div className="stat-icon-large">📦</div>
                    <div className="stat-content">
                      <span className="stat-number">{dashboardStats.totalInventoryItems}</span>
                      <span className="stat-text">Total Items</span>
                    </div>
                  </div>

                  {/* Inventory Details Grid */}
                  <div className="inventory-details-grid">
                    <div className="inventory-detail-card expiring">
                      <div className="detail-icon">⏰</div>
                      <div className="detail-content">
                        <span className="detail-number">{dashboardStats.expiringItems}</span>
                        <span className="detail-label">Expiring Soon</span>
                      </div>
                    </div>

                    <div className="inventory-detail-card low-stock">
                      <div className="detail-icon">⚠️</div>
                      <div className="detail-content">
                        <span className="detail-number">{dashboardStats.lowStockItems}</span>
                        <span className="detail-label">Low Stock Items</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="inventory-quick-actions">
                    <button 
                      className="quick-action-item"
                      onClick={() => setActiveSection('inventory-management')}
                    >
                      <span className="action-icon-small">📋</span>
                      <span>View All Items</span>
                    </button>
                    <button 
                      className="quick-action-item"
                      onClick={() => setActiveSection('inventory-management')}
                    >
                      <span className="action-icon-small">➕</span>
                      <span>Add New Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Finance Stats Section - Rotating Display */}
              <div className="finance-showcase-section">
                <h3 className="carousel-title">
                  <span className="carousel-icon">💰</span>
                  Finance Overview
                </h3>
                
                <div className="finance-rotating-container">
                  {currentFinanceIndex === 0 && (
                    <div className="finance-stat-card income" key="income">
                      <div className="finance-icon">💵</div>
                      <div className="finance-content">
                        <span className="finance-label">Today's Income</span>
                        <span className="finance-value">Rs. {dashboardStats.todayIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {currentFinanceIndex === 1 && (
                    <div className="finance-stat-card expenses" key="expenses">
                      <div className="finance-icon">💸</div>
                      <div className="finance-content">
                        <span className="finance-label">Today's Expenses</span>
                        <span className="finance-value">Rs. {dashboardStats.todayExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {currentFinanceIndex === 2 && (
                    <div className="finance-stat-card profit" key="profit">
                      <div className="finance-icon">📈</div>
                      <div className="finance-content">
                        <span className="finance-label">Monthly Profit</span>
                        <span className="finance-value">Rs. {dashboardStats.monthlyProfit.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {currentFinanceIndex === 3 && (
                    <div className="finance-stat-card inventory-val" key="inventory-val">
                      <div className="finance-icon">💎</div>
                      <div className="finance-content">
                        <span className="finance-label">Inventory Value</span>
                        <span className="finance-value">Rs. {dashboardStats.inventoryValue.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Progress Indicators */}
                  <div className="finance-indicators">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index}
                        className={`indicator ${currentFinanceIndex === index ? 'active' : ''}`}
                        onClick={() => setCurrentFinanceIndex(index)}
                      />
                    ))}
                  </div>
                </div>
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
