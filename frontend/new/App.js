import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RoleSelection from './components/RoleSelection';
import HouseholdRegister from './components/HouseholdRegister';
import RestaurantRegister from './components/RestaurantRegister';
import Login from './components/Login';
import HouseholdDashboard from './pages/HouseholdDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LeftoverManagement from './components/LeftoverManagement';   // ✅ new
import ChatAssistant from './components/ChatAssistant';             // ✅ new
import StaffFinanceManagement from './components/StaffFinanceManagement'; // ✅ new
import './styles/App.css';
import Onboarding from './components/Onboard';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Onboarding />} />

            {/* Public routes */}
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/register/household" element={<HouseholdRegister />} />
            <Route path="/register/restaurant" element={<RestaurantRegister />} />
            <Route path="/login" element={<Login />} />

            {/* Protected dashboards */}
            <Route 
              path="/household-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['household']}>
                  <HouseholdDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['restaurant']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* New Features */}
            <Route 
              path="/leftovers" 
              element={
                <ProtectedRoute allowedRoles={['household', 'restaurant', 'admin']}>
                  <LeftoverManagement />
                </ProtectedRoute>
              } 
            />
            <Route
             path="/chatbot" 
             element={
              <ProtectedRoute allowedRoles={['household', 'restaurant', 'admin']}>
                  <ChatAssistant />
              </ProtectedRoute> }
              />
            <Route 
              path="/staff-finance" 
              element={
                <ProtectedRoute allowedRoles={['restaurant', 'admin']}>
                  <StaffFinanceManagement />
                </ProtectedRoute>
              } 
            />
            </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
