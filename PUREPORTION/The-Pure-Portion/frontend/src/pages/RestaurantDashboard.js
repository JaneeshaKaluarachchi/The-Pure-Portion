import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Calculator,
  ChefHat,
  ClipboardList,
  Coins,
  FileText,
  LogOut,
  Menu,
  Package,
  Recycle,
  Settings,
  UserCircle,
  Users
} from 'lucide-react';
import { UserProfileSidebar } from '../components/ui/menu';
import { useAuth } from '../contexts/AuthContext';
import Profile from '../components/Profile';
import StaffManagement from '../components/StaffManagement';
import InventoryManagement from '../components/InventoryManagement';
import RecipeManagement from '../components/RecipeManagement';
import PortionCalculator from '../components/PortionCalculator';
import LeftoverManagement from '../components/LeftoverManagement';
import RestaurantSettings from '../components/RestaurantSettings';
import '../styles/Dashboard.css';
import FinanceManagement from '../components/FinanceDashboard';
import logo from '../assets/logo.png';

const RECIPE_ROTATION_MS = 5000;
const RECIPE_TRANSITION_MS = 360;

const RestaurantDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Your Restaurant');
  const [recipes, setRecipes] = useState([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
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
    if (recipes.length === 0) {
      return undefined;
    }

    let advanceTimeoutId;
    let transitionTimeoutId;

    const scheduleNextRecipe = () => {
      advanceTimeoutId = window.setTimeout(() => {
        setRecipeAnimating(true);

        transitionTimeoutId = window.setTimeout(() => {
          setCurrentRecipeIndex((prevIndex) =>
            prevIndex === recipes.length - 1 ? 0 : prevIndex + 1
          );
          setRecipeAnimating(false);
        }, RECIPE_TRANSITION_MS);
      }, RECIPE_ROTATION_MS);
    };

    scheduleNextRecipe();

    return () => {
      clearTimeout(advanceTimeoutId);
      clearTimeout(transitionTimeoutId);
    };
  }, [recipes, currentRecipeIndex]);

  useEffect(() => {
    // Rotate finance stats every 3 seconds (4 stats)
    const interval = setInterval(() => {
      setCurrentFinanceIndex((prevIndex) => (prevIndex + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prevIndex) => (prevIndex + 1) % 3);
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
    if (!recipes || recipes.length === 0) return;
    setRecipeAnimating(true);
    setTimeout(() => {
      setCurrentRecipeIndex((prevIndex) => 
        prevIndex === 0 ? recipes.length - 1 : prevIndex - 1
      );
      setRecipeAnimating(false);
    }, 320);
  };

  const handleNextRecipe = () => {
    if (!recipes || recipes.length === 0) return;
    setRecipeAnimating(true);
    setTimeout(() => {
      setCurrentRecipeIndex((prevIndex) => 
        prevIndex === recipes.length - 1 ? 0 : prevIndex + 1
      );
      setRecipeAnimating(false);
    }, 320);
  };

  const [recipeAnimating, setRecipeAnimating] = useState(false);

  const restaurantDisplayName = restaurantName || currentUser?.restaurantName || 'Your Restaurant';
  const heroSlides = [
    {
      title: 'Fresh service planning',
      image: '/image1.jpg'
    },
    {
      title: 'Waste-aware kitchen flow',
      image: '/image2.jpg'
    },
    {
      title: 'Balanced portion control',
      image: '/image3.jpg'
    }
  ];
  const activeHeroSlide = heroSlides[heroImageIndex];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-full w-full" /> },
    { id: 'staff-management', label: 'Staff Management', icon: <Users className="h-full w-full" /> },
    { id: 'recipe-management', label: 'Recipe Management', icon: <ChefHat className="h-full w-full" /> },
    { id: 'portion-calculation', label: 'Portion Calculator', icon: <Calculator className="h-full w-full" /> },
    { id: 'leftover-management', label: 'Manage Leftovers', icon: <Recycle className="h-full w-full" /> },
    { id: 'inventory-management', label: 'Inventory Management', icon: <Package className="h-full w-full" /> },
    { id: 'finance-management', label: 'Finance Management', icon: <Coins className="h-full w-full" />, isSeparator: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-full w-full" /> }
  ];

  const navItems = menuItems.map((item) => ({
    label: item.label,
    href: `#${item.id}`,
    icon: item.icon,
    isSeparator: item.isSeparator,
    isActive: activeSection === item.id,
    onClick: () => {
      setActiveSection(item.id);
      setIsMenuOpen(false);
    }
  }));

  const menuUser = {
    name: restaurantDisplayName,
    email: currentUser?.email || 'restaurant@pureportion.app',
    avatarUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=400&auto=format&fit=crop'
  };

  const logoutItem = {
    label: 'Log out',
    icon: <LogOut className="h-full w-full" />,
    onClick: logout
  };

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
      case 'settings':
        return <RestaurantSettings />;
      case 'reports':
        return <FinanceManagement />;
      
      default:
        // Dashboard overview content
        return (
          <div className="dashboard-overview">
            <div className="dashboard-overview-container">
                  <div className="dashboard-hero">
                    <div className="hero-cinema-stage" aria-hidden>
                      <img
                        key={activeHeroSlide.image}
                        className="hero-cinema-image"
                        src={activeHeroSlide.image}
                        alt=""
                      />
                    </div>
                    <div className="hero-content-overlay">
                      <div className="hero-badge"><ClipboardList size={16} /> Restaurant Dashboard</div>
                      <h1 className="hero-title">Welcome to {restaurantDisplayName}</h1>
                      <p className="hero-subtitle">Manage portions, staff, recipes, inventory, leftovers, and finance from one clean Pure Portion workspace.</p>
                      <div className="hero-ctas">
                        <button className="hero-btn" onClick={() => setActiveSection('inventory-management')}><Package size={18} /> Manage Inventory</button>
                        <button className="hero-btn ghost" onClick={() => setActiveSection('recipe-management')}><ChefHat size={18} /> View Recipes</button>
                      </div>
                    </div>
                    <div className="hero-slide-rail" aria-hidden>
                      {heroSlides.map((slide, index) => (
                        <div
                          key={slide.title}
                          className={`hero-slide-card ${heroImageIndex === index ? 'active' : ''}`}
                        >
                          <img src={slide.image} alt="" />
                          <div>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <strong>{slide.title}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hero-progress-track" aria-hidden>
                      {heroSlides.map((slide, index) => (
                        <span key={slide.title} className={heroImageIndex === index ? 'active' : ''} />
                      ))}
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className="analytics-section">
                    <h2 className="analytics-title">Platform Analytics</h2>
                    <div className="analytics-grid">
                      <div className="analytics-card">
                        <div className="analytics-icon inventory-icon">
                          <Package size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Inventory Management</h3>
                          <p className="analytics-stat">{dashboardStats.totalInventoryItems}</p>
                          <p className="analytics-label">Active Items</p>
                          <p className="analytics-detail">{dashboardStats.lowStockItems} low stock • {dashboardStats.expiringItems} expiring</p>
                        </div>
                      </div>
                      
                      <div className="analytics-card">
                        <div className="analytics-icon recipe-icon">
                          <ChefHat size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Recipe Management</h3>
                          <p className="analytics-stat">{dashboardStats.totalRecipes}</p>
                          <p className="analytics-label">Recipes Added</p>
                          <p className="analytics-detail">Ready to cook and manage portions</p>
                        </div>
                      </div>

                      <div className="analytics-card">
                        <div className="analytics-icon staff-icon">
                          <Users size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Staff Management</h3>
                          <p className="analytics-stat">{dashboardStats.totalStaff}</p>
                          <p className="analytics-label">Total Staff</p>
                          <p className="analytics-detail">{attendanceStats.present} present today</p>
                        </div>
                      </div>

                      <div className="analytics-card">
                        <div className="analytics-icon finance-icon">
                          <Coins size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Finance Tracking</h3>
                          <p className="analytics-stat">₹{dashboardStats.monthlyProfit}</p>
                          <p className="analytics-label">Monthly Profit</p>
                          <p className="analytics-detail">Income: ₹{dashboardStats.todayIncome} | Expenses: ₹{dashboardStats.todayExpenses}</p>
                        </div>
                      </div>

                      <div className="analytics-card">
                        <div className="analytics-icon waste-icon">
                          <Recycle size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Waste Reduction</h3>
                          <p className="analytics-stat">{dashboardStats.foodWasteReduced}%</p>
                          <p className="analytics-label">Reduced This Month</p>
                          <p className="analytics-detail">Tracking and managing leftovers</p>
                        </div>
                      </div>

                      <div className="analytics-card">
                        <div className="analytics-icon performance-icon">
                          <BarChart3 size={28} />
                        </div>
                        <div className="analytics-content">
                          <h3>Overall Performance</h3>
                          <p className="analytics-stat">100%</p>
                          <p className="analytics-label">System Active</p>
                          <p className="analytics-detail">All modules operating smoothly</p>
                        </div>
                      </div>
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
                  <div className={`recipe-carousel-vertical ${recipeAnimating ? 'is-animating' : ''}`}>
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
                        <div className="recipe-details-scroll">
                          <h4 className="recipe-name">{recipes[currentRecipeIndex].name}</h4>
                          <p className="recipe-description">{recipes[currentRecipeIndex].description || 'A delicious recipe for your restaurant'}</p>

                          <div className="recipe-quick-stats">
                            <div className="quick-stat">
                              <span className="stat-icon">⏱️</span>
                              <div className="stat-info">
                                <span className="stat-label">Prep Time</span>
                                <span className="stat-value">{recipes[currentRecipeIndex].prepTime} min</span>
                              </div>
                            </div>
                            <div className="quick-stat">
                              <span className="stat-icon">🍳</span>
                              <div className="stat-info">
                                <span className="stat-label">Cook Time</span>
                                <span className="stat-value">{recipes[currentRecipeIndex].cookTime} min</span>
                              </div>
                            </div>
                            <div className="quick-stat">
                              <span className="stat-icon">⭐</span>
                              <div className="stat-info">
                                <span className="stat-label">Difficulty</span>
                                <span className="stat-value capitalize">{recipes[currentRecipeIndex].difficulty || 'Medium'}</span>
                              </div>
                            </div>
                            <div className="quick-stat">
                              <span className="stat-icon">👥</span>
                              <div className="stat-info">
                                <span className="stat-label">Servings</span>
                                <span className="stat-value">{recipes[currentRecipeIndex].servings} persons</span>
                              </div>
                            </div>
                          </div>

                          <div className="recipe-details-grid">
                            <div className="detail-card">
                              <span className="detail-icon">📂</span>
                              <div>
                                <span className="detail-label">Category</span>
                                <span className="detail-value capitalize">{recipes[currentRecipeIndex].category}</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <span className="detail-icon">🌍</span>
                              <div>
                                <span className="detail-label">Cuisine</span>
                                <span className="detail-value capitalize">{recipes[currentRecipeIndex].cuisine || 'Sri Lankan'}</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <span className="detail-icon">🥘</span>
                              <div>
                                <span className="detail-label">Ingredients</span>
                                <span className="detail-value">{recipes[currentRecipeIndex].ingredients?.length || 0} items</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <span className="detail-icon">💰</span>
                              <div>
                                <span className="detail-label">Cost per Serving</span>
                                <span className="detail-value">Rs. {recipes[currentRecipeIndex].costPerServing?.toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <span className="detail-icon">🔥</span>
                              <div>
                                <span className="detail-label">Calories</span>
                                <span className="detail-value">{recipes[currentRecipeIndex].nutrition?.calories || 0} kcal</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <span className="detail-icon">🥗</span>
                              <div>
                                <span className="detail-label">Protein</span>
                                <span className="detail-value">{recipes[currentRecipeIndex].nutrition?.protein || 0}g</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="recipe-details-footer">
                          <div className="recipe-navigation">
                            <button className="nav-btn nav-btn-secondary" onClick={handlePrevRecipe}>
                              ← Prev
                            </button>
                            <div className="recipe-counter">
                              {currentRecipeIndex + 1} / {recipes.length}
                            </div>
                            <button className="nav-btn nav-btn-secondary" onClick={handleNextRecipe}>
                              Next →
                            </button>
                          </div>

                          <div className="recipe-actions">
                            <button
                              className="see-more-btn"
                              onClick={() => setActiveSection('recipe-management')}
                            >
                              See more
                            </button>
                            <button
                              className="add-menu-btn"
                              onClick={() => setActiveSection('recipe-management')}
                            >
                              Add to Menu
                            </button>
                          </div>
                        </div>
                      </div>
                  </div>
                ) : (
                  <div className="no-recipes">
                    <p>No recipes available. Add your first recipe to see it here!</p>
                  </div>
                )}
              </div>
            </div>

          
        </div>
        );
    }
  }; 

  return (
    <div className="restaurant-dashboard-shell">
      <header className="restaurant-dashboard-topbar">
        <div className="restaurant-header-left">
          <button
            className="restaurant-menu-toggle"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? 'Hide restaurant menu' : 'Show restaurant menu'}
            aria-expanded={isMenuOpen}
          >
            <Menu size={24} />
          </button>
          <div className="pureportion-powered">
            <img src={logo} alt="Pure Portion logo" />
            <span>Powered by Pure Portion</span>
          </div>
        </div>
        <div className="restaurant-profile-menu">
          <button
            className="restaurant-header-profile"
            onClick={() => setIsProfileDropdownOpen((value) => !value)}
            aria-label="Open restaurant account menu"
            aria-expanded={isProfileDropdownOpen}
          >
            <img src={menuUser.avatarUrl} alt={`${restaurantDisplayName} profile`} />
            <span className="restaurant-header-profile-copy">
              <span className="restaurant-header-profile-name">{restaurantDisplayName}</span>
              <span className="restaurant-header-profile-email">{menuUser.email}</span>
            </span>
          </button>

          {isProfileDropdownOpen && (
            <div className="restaurant-profile-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSection('profile');
                  setIsProfileDropdownOpen(false);
                }}
              >
                <UserCircle size={17} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSection('settings');
                  setIsProfileDropdownOpen(false);
                }}
              >
                <Settings size={17} />
                <span>Settings</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSection('reports');
                  setIsProfileDropdownOpen(false);
                }}
              >
                <FileText size={17} />
                <span>My reports</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={logout}
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={`restaurant-dashboard-layout ${isMenuOpen ? 'nav-visible' : 'nav-hidden'}`}>
        {isMenuOpen && (
          <aside className="restaurant-left-nav">
            <UserProfileSidebar navItems={navItems} logoutItem={logoutItem} />
          </aside>
        )}

        <main className="dashboard-content restaurant-dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
