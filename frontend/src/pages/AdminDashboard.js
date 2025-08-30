import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Profile from '../components/Profile';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'user-management', label: 'User Management', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📋' }
  ];

  useEffect(() => {
    if (activeSection === 'user-management') {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/all');
      setUsers(response.data);
    } catch (error) {
      setMessage('Failed to fetch users');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        setMessage('User deleted successfully');
        fetchUsers();
      } catch (error) {
        setMessage('Failed to delete user');
      }
    }
  };

  const generateReport = () => {
    const reportData = users.map(user => ({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.firstName ? `${user.firstName} ${user.lastName}` : 
            user.ownerFirstName ? `${user.ownerFirstName} ${user.ownerLastName}` : 'N/A',
      phone: user.phone || user.ownerPhone || 'N/A',
      createdAt: new Date(user.createdAt).toLocaleDateString()
    }));

    const csvContent = [
      ['ID', 'Email', 'Role', 'Name', 'Phone', 'Created Date'],
      ...reportData.map(user => [user.id, user.email, user.role, user.name, user.phone, user.createdAt])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureportion-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <Profile />;
      case 'user-management':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>User Management</h2>
              <button onClick={generateReport} className="report-btn">
                📄 Generate Report
              </button>
            </div>
            
            {message && <div className="message">{message}</div>}
            
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          {user.firstName ? `${user.firstName} ${user.lastName}` : 
                           user.ownerFirstName ? `${user.ownerFirstName} ${user.ownerLastName}` : 'N/A'}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.phone || user.ownerPhone || 'N/A'}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && !loading && (
                  <div className="no-data">No users found</div>
                )}
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="content-section">
            <h2>System Reports</h2>
            <div className="reports-grid">
              <div className="report-card">
                <h3>User Statistics</h3>
                <div className="stat">
                  <span className="stat-label">Total Users:</span>
                  <span className="stat-value">{users.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Household Users:</span>
                  <span className="stat-value">{users.filter(u => u.role === 'household').length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Restaurant Users:</span>
                  <span className="stat-value">{users.filter(u => u.role === 'restaurant').length}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="dashboard-overview">
            <h2>Admin Dashboard</h2>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>👥 Total Users</h3>
                <p>All registered users</p>
                <span className="card-value">{users.length} users</span>
              </div>
              <div className="dashboard-card">
                <h3>🏠 Household Users</h3>
                <p>Family users</p>
                <span className="card-value">{users.filter(u => u.role === 'household').length} users</span>
              </div>
              <div className="dashboard-card">
                <h3>🍽️ Restaurant Users</h3>
                <p>Business users</p>
                <span className="card-value">{users.filter(u => u.role === 'restaurant').length} users</span>
              </div>
              <div className="dashboard-card">
                <h3>📊 System Health</h3>
                <p>Application status</p>
                <span className="card-value">Online</span>
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

export default AdminDashboard;