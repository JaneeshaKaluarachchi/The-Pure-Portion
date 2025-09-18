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
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/role-selection" />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/register/household" element={<HouseholdRegister />} />
            <Route path="/register/restaurant" element={<RestaurantRegister />} />
            <Route path="/login" element={<Login />} />
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;