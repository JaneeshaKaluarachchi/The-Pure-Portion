import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/LeftoverManagement.css';

const LeftoverManagement = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [leftovers, setLeftovers] = useState([]);
  const [myLeftovers, setMyLeftovers] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [pendingLeftovers, setPendingLeftovers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    radius: 10
  });

  // Donation form state
  const [donationForm, setDonationForm] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'kg',
    category: 'cooked-meal',
    expiryDate: '',
    address: '',
    notes: '',
    allergens: [],
    dietaryTags: [],
    pickupInstructions: '',
    contactInfo: {
      phone: '',
      email: '',
      preferredContact: 'app'
    }
  });

  // Donation request form state
  const [requestForm, setRequestForm] = useState({
    requesterName: '',
    targetOrganization: '',
    organizationType: 'charity',
    purpose: '',
    location: {
      address: '',
    },
    requestedItems: [{ itemName: '', quantity: '', unit: 'kg', priority: 'medium' }],
    urgencyLevel: 'medium',
    neededBy: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      preferredContact: 'both'
    },
    notes: '',
    proofDocuments: []
  });

  // Fetch functions
  const fetchLeftovers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ status: 'approved', page: 1, limit: 20 });
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);

      const response = await axios.get(`http://localhost:5000/api/leftovers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLeftovers(response.data.leftovers || []);
    } catch (error) {
      console.error('Error fetching leftovers:', error);
      setError('Failed to fetch leftovers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

const handleHelpRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `http://localhost:5000/api/leftovers/requests/${requestId}/fulfill`, // <-- fixed route
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert('You have successfully offered help for this request!');
    fetchDonationRequests(); // Refresh progress bar or donation requests list
  } catch (error) {
    console.error('Error helping with request:', error);
    alert('Failed to help with request: ' + (error.response?.data?.message || error.message));
  }
};


  const fetchDonationRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDonationRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      setError('Failed to fetch donation requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyLeftovers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/my-leftovers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMyLeftovers(response.data.leftovers || []);
    } catch (error) {
      console.error('Error fetching my leftovers:', error);
      setError('Failed to fetch your leftovers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingLeftovers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/admin/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingLeftovers(response.data.leftovers || []);
    } catch (error) {
      console.error('Error fetching pending leftovers:', error);
      setError('Failed to fetch pending leftovers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/admin/pending-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType') || localStorage.getItem('role') || 'household';
    setUserType(storedUserType);

    if (activeTab === 'browse') fetchLeftovers();
    if (activeTab === 'requests') fetchDonationRequests();
    if (activeTab === 'my-donations') fetchMyLeftovers();
    if (activeTab === 'admin' && storedUserType === 'admin') {
      fetchPendingLeftovers();
      fetchPendingRequests();
    }
  }, [activeTab, fetchLeftovers, fetchDonationRequests, fetchMyLeftovers, fetchPendingLeftovers, fetchPendingRequests]);

  const handleClaimLeftover = async (leftoverId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/leftovers/${leftoverId}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Leftover claimed successfully! Check your email for pickup details.');
      fetchLeftovers();
    } catch (error) {
      console.error('Error claiming leftover:', error);
      alert('Failed to claim leftover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      Object.keys(donationForm).forEach(key => {
        if (key === 'coordinates') {
          // Skip coordinates, will be handled with address
        } else if (key === 'allergens' || key === 'dietaryTags') {
          formData.append(key, JSON.stringify(donationForm[key]));
        } else if (key === 'contactInfo') {
          formData.append(key, JSON.stringify(donationForm[key]));
        } else {
          formData.append(key, donationForm[key]);
        }
      });

      await axios.post('http://localhost:5000/api/leftovers', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Donation submitted successfully! It will be reviewed by our admin team.');
      setShowDonateModal(false);
      resetDonationForm();
      if (activeTab === 'my-donations') fetchMyLeftovers();
    } catch (error) {
      console.error('Error submitting donation:', error);
      alert('Failed to submit donation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add form fields
      Object.keys(requestForm).forEach(key => {
        if (key === 'proofDocuments') {
          // Handle file uploads
          requestForm.proofDocuments.forEach(file => {
            formData.append('proofDocuments', file);
          });
        } else if (typeof requestForm[key] === 'object') {
          formData.append(key, JSON.stringify(requestForm[key]));
        } else {
          formData.append(key, requestForm[key]);
        }
      });

      await axios.post('http://localhost:5000/api/leftovers/request', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Donation request submitted successfully! It will be reviewed by our admin team.');
      setShowRequestModal(false);
      resetRequestForm();
      if (activeTab === 'requests') fetchDonationRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetDonationForm = () => {
    setDonationForm({
      name: '',
      description: '',
      quantity: '',
      unit: 'kg',
      category: 'cooked-meal',
      expiryDate: '',
      address: '',
      notes: '',
      allergens: [],
      dietaryTags: [],
      pickupInstructions: '',
      contactInfo: {
        phone: '',
        email: '',
        preferredContact: 'app'
      }
    });
  };

  const resetRequestForm = () => {
    setRequestForm({
      requesterName: '',
      targetOrganization: '',
      organizationType: 'charity',
      purpose: '',
      location: {
        address: '',
      },
      requestedItems: [{ itemName: '', quantity: '', unit: 'kg', priority: 'medium' }],
      urgencyLevel: 'medium',
      neededBy: '',
      description: '',
      contactInfo: {
        phone: '',
        email: '',
        preferredContact: 'both'
      },
      notes: '',
      proofDocuments: []
    });
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

      alert(`${type === 'leftover' ? 'Leftover' : 'Request'} ${action}d successfully!`);
      if (type === 'leftover') {
        fetchPendingLeftovers();
      } else {
        fetchPendingRequests();
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`Failed to update ${type}: ` + (error.response?.data?.message || error.message));
    }
  };

  const addRequestItem = () => {
    setRequestForm({
      ...requestForm,
      requestedItems: [...requestForm.requestedItems, { itemName: '', quantity: '', unit: 'kg', priority: 'medium' }]
    });
  };

  const removeRequestItem = (index) => {
    const items = requestForm.requestedItems.filter((_, i) => i !== index);
    setRequestForm({ ...requestForm, requestedItems: items });
  };

  const updateRequestItem = (index, field, value) => {
    const items = [...requestForm.requestedItems];
    items[index][field] = value;
    setRequestForm({ ...requestForm, requestedItems: items });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getDaysUntilExpiry = (expiryDate) => Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'claimed': return '#3498db';
      case 'expired': return '#e74c3c';
      case 'rejected': return '#95a5a6';
      case 'fulfilled': return '#8e44ad';
      default: return '#7f8c8d';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="leftover-management">
      <div className="leftover-header">
        <h2>♻️ Leftover Management System</h2>
        <div className="header-actions">
          <button 
            className="request-btn"
            onClick={() => setShowRequestModal(true)}
          >
            🙏 Request Donation
          </button>
          <button 
            className="donate-btn"
            onClick={() => setShowDonateModal(true)}
          >
            + Donate Food
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🔍 Browse Donations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          🙏 Donation Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-donations')}
        >
          📦 My Donations
        </button>
        {userType === 'admin' && (
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ Admin Panel
          </button>
        )}
      </div>

      {/* Browse Donations Tab */}
      {activeTab === 'browse' && (
        <div className="browse-section">
          <div className="filters">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={filters.category} 
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                <option value="cooked-meal">Cooked Meals</option>
                <option value="raw-ingredient">Raw Ingredients</option>
                <option value="prepared-food">Prepared Food</option>
                <option value="baked-goods">Baked Goods</option>
                <option value="dairy">Dairy</option>
                <option value="produce">Produce</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Location:</label>
              <input 
                type="text" 
                placeholder="Enter city or area"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              />
            </div>
            <button className="filter-apply-btn" onClick={fetchLeftovers}>
              Apply Filters
            </button>
          </div>

          <div className="leftovers-grid">
            {leftovers.map(leftover => (
              <div key={leftover._id} className="leftover-card">
                {leftover.imageUrl && (
                  <img src={`http://localhost:5000${leftover.imageUrl}`} alt={leftover.name} />
                )}
                <div className="leftover-content">
                  <h3>{leftover.name}</h3>
                  <p className="description">{leftover.description}</p>
                  <div className="leftover-details">
                    <span className="quantity">{leftover.quantity} {leftover.unit}</span>
                    <span className="category">{leftover.category.replace('-', ' ')}</span>
                  </div>
                  <div className="expiry-info">
                    <span className={`expiry ${getDaysUntilExpiry(leftover.expiryDate) <= 1 ? 'urgent' : ''}`}>
                      Expires: {formatDate(leftover.expiryDate)} 
                      ({getDaysUntilExpiry(leftover.expiryDate)} days)
                    </span>
                  </div>
                  <div className="location-info">
  <span>📍 {leftover.address || 'Location not specified'}</span>
</div>
                  <div className="donor-info">
                    <span>Donated by: {leftover.donorName}</span>
                    <span className="donor-type">{leftover.donorType}</span>
                  </div>
                  <div className="leftover-tags">
                    {leftover.dietaryTags?.map(tag => (
                      <span key={tag} className="tag dietary">{tag}</span>
                    ))}
                    {leftover.allergens?.map(allergen => (
                      <span key={allergen} className="tag allergen">Contains {allergen}</span>
                    ))}
                  </div>
                  <div className="leftover-actions">
                    <button 
                      className="claim-btn"
                      onClick={() => handleClaimLeftover(leftover._id)}
                    >
                      🙋‍♂️ Claim This Food
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donation Requests Tab */}
      {activeTab === 'requests' && (
        <div className="requests-section">
          <div className="requests-grid">
            {donationRequests.map(request => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <h3>{request.targetOrganization}</h3>
                  <div className="request-badges">
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                    >
                      {request.urgencyLevel}
                    </span>
                    <span className="org-type-badge">{request.organizationType}</span>
                  </div>
                </div>
                <p className="purpose">{request.purpose}</p>
                <p className="description">{request.description}</p>
                
                <div className="requested-items">
                  <h4>Requested Items:</h4>
                  {request.requestedItems.map((item, index) => (
                    <div key={index} className="requested-item">
                      <span>{item.itemName}: {item.quantity} {item.unit}</span>
                      <span className={`priority ${item.priority}`}>{item.priority}</span>
                    </div>
                  ))}
                </div>

                <div className="request-meta">
                  <span>📍 {request.location?.address}</span>
                  <span>📅 Needed by: {formatDate(request.neededBy)}</span>
                  <span>👤 Requested by: {request.requesterName}</span>
                </div>

                <div className="fulfillment-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${request.totalFulfillment || 0}%` }}
                    ></div>
                  </div>
                  <span>{request.totalFulfillment || 0}% fulfilled</span>
                </div>

                <div className="request-actions">
  <button 
    className="fulfill-btn"
    onClick={() => handleHelpRequest(request._id)}
  >
    🤝 Help with this Request
  </button>
</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Donations Tab */}
      {activeTab === 'my-donations' && (
        <div className="my-donations-section">
          <div className="donations-grid">
            {myLeftovers.map(leftover => (
              <div key={leftover._id} className="my-leftover-card">
                <div className="leftover-header-info">
                  <h3>{leftover.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(leftover.status) }}
                  >
                    {leftover.status}
                  </span>
                </div>
                <p>{leftover.description}</p>
                <div className="leftover-meta">
                  <span>Quantity: {leftover.quantity} {leftover.unit}</span>
                  <span>Expires: {formatDate(leftover.expiryDate)}</span>
                  <span>Posted: {formatDate(leftover.createdAt)}</span>
                </div>
                {leftover.claimedBy && (
                  <div className="claimed-info">
                    <span>Claimed by: {leftover.claimedBy.userName}</span>
                    <span>Claimed on: {formatDate(leftover.claimedBy.claimedAt)}</span>
                  </div>
                )}
                {leftover.notes && (
                  <div className="notes">
                    <strong>Notes:</strong> {leftover.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Panel Tab */}
      {activeTab === 'admin' && userType === 'admin' && (
        <div className="admin-section">
          <div className="admin-tabs">
            <h3>Pending Donations</h3>
            <div className="pending-leftovers">
              {pendingLeftovers.map(leftover => (
                <div key={leftover._id} className="pending-leftover-card">
                  <div className="leftover-info">
                    <h4>{leftover.name}</h4>
                    <p>{leftover.description}</p>
                    <div className="donor-details">
                      <span>Donor: {leftover.donorName} ({leftover.donorType})</span>
                      <span>Quantity: {leftover.quantity} {leftover.unit}</span>
                      <span>Category: {leftover.category}</span>
                      <span>Expires: {formatDate(leftover.expiryDate)}</span>
                      <span>📍 {leftover.location?.address}</span>
                    </div>
                  </div>
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
            </div>

            <h3>Pending Donation Requests</h3>
            <div className="pending-requests">
              {pendingRequests.map(request => (
                <div key={request._id} className="pending-request-card">
                  <div className="request-info">
                    <h4>{request.targetOrganization}</h4>
                    <p><strong>Purpose:</strong> {request.purpose}</p>
                    <p>{request.description}</p>
                    <div className="request-details">
                      <span>Requester: {request.requesterName}</span>
                      <span>Type: {request.organizationType}</span>
                      <span>Urgency: {request.urgencyLevel}</span>
                      <span>Needed by: {formatDate(request.neededBy)}</span>
                      <span>📍 {request.location?.address}</span>
                      {request.isOfficialRequest && (
                        <span className="official-badge">🏛️ Official Request - Requires Verification</span>
                      )}
                    </div>
                    <div className="requested-items-admin">
                      <strong>Requested Items:</strong>
                      {request.requestedItems.map((item, index) => (
                        <span key={index}>{item.itemName} ({item.quantity} {item.unit})</span>
                      ))}
                    </div>
                  </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="modal-overlay">
          <div className="modal donate-modal">
            <div className="modal-header">
              <h3>Donate Food</h3>
              <button onClick={() => setShowDonateModal(false)}>×</button>
            </div>
            <form className="donation-form" onSubmit={handleDonateSubmit}>
              <div className="form-group">
                <label>Food Name *</label>
                <input 
                  type="text"
                  value={donationForm.name}
                  onChange={(e) => setDonationForm({...donationForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  value={donationForm.description}
                  onChange={(e) => setDonationForm({...donationForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input 
                    type="number"
                    value={donationForm.quantity}
                    onChange={(e) => setDonationForm({...donationForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select 
                    value={donationForm.unit}
                    onChange={(e) => setDonationForm({...donationForm, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pieces">pieces</option>
                    <option value="portions">portions</option>
                    <option value="plates">plates</option>
                    <option value="bowls">bowls</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select 
                  value={donationForm.category}
                  onChange={(e) => setDonationForm({...donationForm, category: e.target.value})}
                >
                  <option value="cooked-meal">Cooked Meal</option>
                  <option value="raw-ingredient">Raw Ingredient</option>
                  <option value="prepared-food">Prepared Food</option>
                  <option value="baked-goods">Baked Goods</option>
                  <option value="dairy">Dairy</option>
                  <option value="produce">Produce</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Expiry Date *</label>
                <input 
                  type="date"
                  value={donationForm.expiryDate}
                  onChange={(e) => setDonationForm({...donationForm, expiryDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pickup Address *</label>
                <textarea 
                  value={donationForm.address}
                  onChange={(e) => setDonationForm({...donationForm, address: e.target.value})}
                  placeholder="Full address including city, postal code"
                  required
                />
              </div>
              <div className="form-group">
                <label>Pickup Instructions</label>
                <textarea 
                  value={donationForm.pickupInstructions}
                  onChange={(e) => setDonationForm({...donationForm, pickupInstructions: e.target.value})}
                  placeholder="Special instructions for pickup"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Submit Donation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal request-modal">
            <div className="modal-header">
              <h3>Request Donation</h3>
              <button onClick={() => setShowRequestModal(false)}>×</button>
            </div>
            <form className="request-form" onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input 
                  type="text"
                  value={requestForm.requesterName}
                  onChange={(e) => setRequestForm({...requestForm, requesterName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Organization/Target *</label>
                <input 
                  type="text"
                  value={requestForm.targetOrganization}
                  onChange={(e) => setRequestForm({...requestForm, targetOrganization: e.target.value})}
                  placeholder="e.g., ABC Charity, XYZ Elder Home"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Organization Type *</label>
                  <select 
                    value={requestForm.organizationType}
                    onChange={(e) => setRequestForm({...requestForm, organizationType: e.target.value})}
                  >
                    <option value="charity">Charity</option>
                    <option value="elder-home">Elder Home</option>
                    <option value="street-beggars">Street Beggars</option>
                    <option value="ngo">Non-profit Organization</option>
                    <option value="food-bank">Food Bank</option>
                    <option value="shelter">Shelter</option>
                    <option value="school">School</option>
                    <option value="hospital">Hospital</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Urgency Level *</label>
                  <select 
                    value={requestForm.urgencyLevel}
                    onChange={(e) => setRequestForm({...requestForm, urgencyLevel: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <textarea 
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                  placeholder="Why do you need this donation?"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  placeholder="Detailed description of your request"
                  required
                />
              </div>
              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea 
                  value={requestForm.location.address}
                  onChange={(e) => setRequestForm({
                    ...requestForm, 
                    location: {...requestForm.location, address: e.target.value}
                  })}
                  placeholder="Full address where food should be delivered"
                  required
                />
              </div>
              <div className="form-group">
                <label>Needed By *</label>
                <input 
                  type="date"
                  value={requestForm.neededBy}
                  onChange={(e) => setRequestForm({...requestForm, neededBy: e.target.value})}
                  required
                />
              </div>

              {/* Requested Items */}
              <div className="form-group">
                <label>Requested Items *</label>
                {requestForm.requestedItems.map((item, index) => (
                  <div key={index} className="requested-item-form">
                    <input 
                      type="text"
                      placeholder="Item name"
                      value={item.itemName}
                      onChange={(e) => updateRequestItem(index, 'itemName', e.target.value)}
                      required
                    />
                    <input 
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateRequestItem(index, 'quantity', e.target.value)}
                      required
                    />
                    <select 
                      value={item.unit}
                      onChange={(e) => updateRequestItem(index, 'unit', e.target.value)}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="pieces">pieces</option>
                      <option value="portions">portions</option>
                      <option value="plates">plates</option>
                      <option value="bowls">bowls</option>
                    </select>
                    <select 
                      value={item.priority}
                      onChange={(e) => updateRequestItem(index, 'priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {requestForm.requestedItems.length > 1 && (
                      <button type="button" onClick={() => removeRequestItem(index)}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addRequestItem}>Add Item</button>
              </div>

              {/* Contact Info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input 
                    type="tel"
                    value={requestForm.contactInfo.phone}
                    onChange={(e) => setRequestForm({
                      ...requestForm, 
                      contactInfo: {...requestForm.contactInfo, phone: e.target.value}
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email"
                    value={requestForm.contactInfo.email}
                    onChange={(e) => setRequestForm({
                      ...requestForm, 
                      contactInfo: {...requestForm.contactInfo, email: e.target.value}
                    })}
                    required
                  />
                </div>
              </div>

              {/* Proof Documents for Official Requests */}
              {['charity', 'ngo', 'food-bank', 'shelter', 'school', 'hospital'].includes(requestForm.organizationType) && (
                <div className="form-group">
                  <label>Proof Documents * (Required for official organizations)</label>
                  <input 
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => setRequestForm({
                      ...requestForm, 
                      proofDocuments: Array.from(e.target.files)
                    })}
                    required
                  />
                  <small>Upload organization letter, registration certificate, or other proof documents</small>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-btn">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftoverManagement;