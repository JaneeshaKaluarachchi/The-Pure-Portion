import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Profile from '../components/Profile';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [pendingLeftovers, setPendingLeftovers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'user-management', label: 'User Management', icon: '👥' },
    { id: 'leftover-management', label: 'Leftover Management', icon: '♻️' },
    { id: 'donation-requests', label: 'Donation Requests', icon: '🙏' },
    { id: 'reports', label: 'Reports', icon: '📋' }
  ];

  useEffect(() => {
    if (activeSection === 'user-management') {
      fetchUsers();
    } else if (activeSection === 'leftover-management') {
      fetchPendingLeftovers();
    } else if (activeSection === 'donation-requests') {
      fetchPendingRequests();
    } else if (activeSection === 'dashboard') {
      fetchDashboardStats();
      fetchUsers();
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      setMessage('Failed to fetch users');
    }
    setLoading(false);
  };

  const fetchPendingLeftovers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/admin/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingLeftovers(response.data.leftovers || []);
    } catch (error) {
      setMessage('Failed to fetch pending leftovers');
    }
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/admin/pending-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      setMessage('Failed to fetch pending requests');
    }
    setLoading(false);
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data.stats || {});
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('User deleted successfully');
        fetchUsers();
      } catch (error) {
        setMessage('Failed to delete user');
      }
    }
  };

  const handleApproveReject = async (id, action, reason = '', type = 'leftover') => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'leftover' 
        ? `http://localhost:5000/api/leftovers/admin/${id}/approve`
        : `http://localhost:5000/api/leftovers/admin/requests/${id}/approve`;
        
      await axios.post(endpoint, {
        action,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`${type === 'leftover' ? 'Leftover' : 'Request'} ${action}d successfully!`);
      
      if (type === 'leftover') {
        fetchPendingLeftovers();
      } else {
        fetchPendingRequests();
      }
      
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (error) {
      setMessage(`Failed to update ${type}: ` + (error.response?.data?.message || error.message));
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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

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
                        <td>{formatDate(user.createdAt)}</td>
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

      case 'leftover-management':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>Leftover Management</h2>
              <div className="stats-summary">
                <span>Pending: {pendingLeftovers.length}</span>
              </div>
            </div>
            
            {message && <div className="message">{message}</div>}
            
            {loading ? (
              <div className="loading">Loading pending leftovers...</div>
            ) : (
              <div className="pending-items-grid">
                {pendingLeftovers.map(leftover => (
                  <div key={leftover._id} className="pending-item-card">
                    <div className="item-header">
                      <h3>{leftover.name}</h3>
                      <span className="item-category">{leftover.category}</span>
                    </div>
                    <p className="item-description">{leftover.description}</p>
                    
                    <div className="item-details">
                      <div className="detail-row">
                        <span className="label">Donor:</span>
                        <span>{leftover.donorName} ({leftover.donorType})</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Quantity:</span>
                        <span>{leftover.quantity} {leftover.unit}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Expires:</span>
                        <span>{formatDate(leftover.expiryDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Location:</span>
                        <span>{leftover.location?.address || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Posted:</span>
                        <span>{formatDate(leftover.createdAt)}</span>
                      </div>
                    </div>

                    {leftover.notes && (
                      <div className="item-notes">
                        <strong>Notes:</strong> {leftover.notes}
                      </div>
                    )}

                    <div className="admin-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveReject(leftover._id, 'approve', '', 'leftover')}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) handleApproveReject(leftover._id, 'reject', reason, 'leftover');
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingLeftovers.length === 0 && !loading && (
                  <div className="no-data">No pending leftovers</div>
                )}
              </div>
            )}
          </div>
        );

      case 'donation-requests':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>Donation Requests</h2>
              <div className="stats-summary">
                <span>Pending: {pendingRequests.length}</span>
              </div>
            </div>
            
            {message && <div className="message">{message}</div>}
            
            {loading ? (
              <div className="loading">Loading pending requests...</div>
            ) : (
              <div className="pending-items-grid">
                {pendingRequests.map(request => (
                  <div key={request._id} className="pending-item-card">
                    <div className="item-header">
                      <h3>{request.targetOrganization}</h3>
                      <div className="request-badges">
                        <span className={`urgency-badge ${request.urgencyLevel}`}>
                          {request.urgencyLevel}
                        </span>
                        <span className="org-type-badge">{request.organizationType}</span>
                        {request.isOfficialRequest && (
                          <span className="official-badge">Official</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="item-details">
                      <div className="detail-row">
                        <span className="label">Requester:</span>
                        <span>{request.requesterName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Purpose:</span>
                        <span>{request.purpose}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Needed by:</span>
                        <span>{formatDate(request.neededBy)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Location:</span>
                        <span>{request.location?.address || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Contact:</span>
                        <span>{request.contactInfo?.email} | {request.contactInfo?.phone}</span>
                      </div>
                    </div>

                    <div className="requested-items-section">
                      <strong>Requested Items:</strong>
                      <div className="requested-items-list">
                        {request.requestedItems?.map((item, index) => (
                          <span key={index} className="requested-item-tag">
                            {item.itemName} ({item.quantity} {item.unit})
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="item-description">{request.description}</p>

                    {request.proofDocuments && request.proofDocuments.length > 0 && (
                      <div className="proof-documents">
                        <strong>Proof Documents:</strong>
                        <div className="document-list">
                          {request.proofDocuments.map((doc, index) => (
                            <span key={index} className="document-item">
                              📄 {doc.originalName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveReject(request._id, 'approve', '', 'request')}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) handleApproveReject(request._id, 'reject', reason, 'request');
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && !loading && (
                  <div className="no-data">No pending requests</div>
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
              
              <div className="report-card">
                <h3>Leftover Statistics</h3>
                <div className="stat">
                  <span className="stat-label">Total Leftovers:</span>
                  <span className="stat-value">{dashboardStats.leftovers?.total || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Pending Approval:</span>
                  <span className="stat-value">{dashboardStats.leftovers?.pending || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Approved:</span>
                  <span className="stat-value">{dashboardStats.leftovers?.approved || 0}</span>
                </div>
              </div>

              <div className="report-card">
                <h3>Donation Requests</h3>
                <div className="stat">
                  <span className="stat-label">Total Requests:</span>
                  <span className="stat-value">{dashboardStats.requests?.total || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Pending Approval:</span>
                  <span className="stat-value">{dashboardStats.requests?.pending || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Approved:</span>
                  <span className="stat-value">{dashboardStats.requests?.approved || 0}</span>
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
                <span className="card-value">{dashboardStats.users?.total || users.length} users</span>
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
                <h3>♻️ Pending Leftovers</h3>
                <p>Awaiting approval</p>
                <span className="card-value">{dashboardStats.leftovers?.pending || 0} items</span>
              </div>
              <div className="dashboard-card">
                <h3>🙏 Pending Requests</h3>
                <p>Donation requests</p>
                <span className="card-value">{dashboardStats.requests?.pending || 0} requests</span>
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