import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/DonationRequestManagement.css';

const DonationRequestManagement = () => {
  const [activeTab, setActiveTab] = useState('browse-requests');
  const [donationRequests, setDonationRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [soonToExpireItems, setSoonToExpireItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filters, setFilters] = useState({
    urgency: '',
    location: '',
    radius: 10
  });

  // Request form state
  const [requestForm, setRequestForm] = useState({
    requesterName: '',
    targetOrganization: '',
    organizationType: 'ngo',
    address: '',
    coordinates: { lat: '', lng: '' },
    requestedItems: [{ itemName: '', quantity: '', unit: 'kg', category: 'cooked-meal', priority: 'medium', notes: '' }],
    urgencyLevel: 'medium',
    neededBy: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      alternateContact: '',
      preferredContact: 'both'
    },
    notes: ''
  });

  // Fulfillment form state
  const [fulfillmentForm, setFulfillmentForm] = useState({
    items: [],
    inventoryItemIds: []
  });

  const fetchDonationRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ status: 'approved', page: 1, limit: 20 });
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.location) params.append('location', filters.location);
      if (filters.radius) params.append('radius', filters.radius);

      const response = await axios.get(`http://localhost:5000/api/leftovers/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDonationRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      setError('Failed to fetch donation requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/requests?status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter requests created by current user
      const userId = localStorage.getItem('userId');
      const userRequests = response.data.requests?.filter(req => req.requesterId._id === userId) || [];
      setMyRequests(userRequests);
    } catch (error) {
      console.error('Error fetching my requests:', error);
      setError('Failed to fetch your requests');
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

  const fetchSoonToExpireItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/leftovers/soon-to-expire?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSoonToExpireItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching soon-to-expire items:', error);
    }
  }, []);

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType') || 'restaurant';
    setUserType(storedUserType);

    if (activeTab === 'browse-requests') fetchDonationRequests();
    if (activeTab === 'my-requests') fetchMyRequests();
    if (activeTab === 'admin' && storedUserType === 'admin') fetchPendingRequests();
    
    fetchSoonToExpireItems();
  }, [activeTab, fetchDonationRequests, fetchMyRequests, fetchPendingRequests, fetchSoonToExpireItems]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        ...requestForm,
        location: JSON.stringify({
          address: requestForm.address,
          coordinates: requestForm.coordinates
        }),
        requestedItems: JSON.stringify(requestForm.requestedItems),
        contactInfo: JSON.stringify(requestForm.contactInfo)
      };

      await axios.post('http://localhost:5000/api/leftovers/request', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Donation request submitted successfully! It will be reviewed by our team.');
      setShowRequestModal(false);
      resetRequestForm();
      if (activeTab === 'my-requests') fetchMyRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFulfillRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:5000/api/leftovers/requests/${selectedRequest._id}/fulfill`, {
        items: JSON.stringify(fulfillmentForm.items),
        inventoryItemIds: JSON.stringify(fulfillmentForm.inventoryItemIds)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Donation pledged successfully!');
      setShowFulfillModal(false);
      setSelectedRequest(null);
      setFulfillmentForm({ items: [], inventoryItemIds: [] });
      fetchDonationRequests();
      fetchSoonToExpireItems();
    } catch (error) {
      console.error('Error fulfilling request:', error);
      alert('Failed to fulfill request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveReject = async (requestId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/leftovers/admin/requests/${requestId}/approve`, {
        action,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Request ${action}d successfully!`);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      requesterName: '',
      targetOrganization: '',
      organizationType: 'ngo',
      address: '',
      coordinates: { lat: '', lng: '' },
      requestedItems: [{ itemName: '', quantity: '', unit: 'kg', category: 'cooked-meal', priority: 'medium', notes: '' }],
      urgencyLevel: 'medium',
      neededBy: '',
      description: '',
      contactInfo: {
        phone: '',
        email: '',
        alternateContact: '',
        preferredContact: 'both'
      },
      notes: ''
    });
  };

  const addRequestedItem = () => {
    setRequestForm({
      ...requestForm,
      requestedItems: [...requestForm.requestedItems, { itemName: '', quantity: '', unit: 'kg', category: 'cooked-meal', priority: 'medium', notes: '' }]
    });
  };

  const removeRequestedItem = (index) => {
    const items = requestForm.requestedItems.filter((_, i) => i !== index);
    setRequestForm({ ...requestForm, requestedItems: items });
  };

  const updateRequestedItem = (index, field, value) => {
    const items = [...requestForm.requestedItems];
    items[index][field] = value;
    setRequestForm({ ...requestForm, requestedItems: items });
  };

  const openFulfillModal = (request) => {
    setSelectedRequest(request);
    setShowFulfillModal(true);
    
    // Initialize fulfillment form with request items
    const items = request.requestedItems.map(item => ({
      itemName: item.itemName,
      quantity: 0,
      unit: item.unit
    }));
    setFulfillmentForm({ items, inventoryItemIds: new Array(items.length).fill('') });
  };

  const updateFulfillmentItem = (index, field, value) => {
    const items = [...fulfillmentForm.items];
    items[index][field] = value;
    setFulfillmentForm({ ...fulfillmentForm, items });
  };

  const updateInventorySelection = (index, inventoryId) => {
    const inventoryIds = [...fulfillmentForm.inventoryItemIds];
    inventoryIds[index] = inventoryId;
    setFulfillmentForm({ ...fulfillmentForm, inventoryItemIds: inventoryIds });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  if (loading) return <div className="loading">Loading donation requests...</div>;

  return (
    <div className="donation-request-management">
      <div className="request-header">
        <h2>🤝 Donation Request Management</h2>
        <div className="header-actions">
          <button 
            className="request-btn"
            onClick={() => setShowRequestModal(true)}
          >
            + Create Request
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'browse-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse-requests')}
        >
          🔍 Browse Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-requests')}
        >
          📋 My Requests
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

      {/* Browse Requests Tab */}
      {activeTab === 'browse-requests' && (
        <div className="browse-section">
          <div className="filters">
            <div className="filter-group">
              <label>Urgency:</label>
              <select 
                value={filters.urgency} 
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
              >
                <option value="">All Urgency Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Radius (km):</label>
              <input 
                type="number" 
                value={filters.radius}
                onChange={(e) => setFilters({...filters, radius: e.target.value})}
                min="1" 
                max="50"
              />
            </div>
            <button className="filter-apply-btn" onClick={fetchDonationRequests}>
              Apply Filters
            </button>
          </div>

          <div className="requests-grid">
            {donationRequests.map(request => (
              <div key={request._id} className="request-card">
                <div className="request-header-info">
                  <h3>{request.targetOrganization}</h3>
                  <span 
                    className="urgency-badge"
                    style={{ backgroundColor: getUrgencyColor(request.urgencyLevel) }}
                  >
                    {request.urgencyLevel}
                  </span>
                </div>
                <p className="description">{request.description}</p>
                <div className="request-details">
                  <span>Organization Type: {request.organizationType}</span>
                  <span>Needed By: {formatDate(request.neededBy)}</span>
                  <span>Fulfillment: {request.totalFulfillment}%</span>
                </div>
                <div className="requested-items">
                  <h4>Requested Items:</h4>
                  {request.requestedItems.map((item, index) => (
                    <div key={index} className="requested-item">
                      <span>{item.itemName}: {item.quantity} {item.unit}</span>
                      <span className={`priority priority-${item.priority}`}>{item.priority}</span>
                    </div>
                  ))}
                </div>
                <div className="request-actions">
                  <button 
                    className="fulfill-btn"
                    onClick={() => openFulfillModal(request)}
                    disabled={request.totalFulfillment >= 100}
                  >
                    🤝 Help Fulfill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Requests Tab */}
      {activeTab === 'my-requests' && (
        <div className="my-requests-section">
          <div className="requests-grid">
            {myRequests.map(request => (
              <div key={request._id} className="my-request-card">
                <div className="request-header-info">
                  <h3>{request.targetOrganization}</h3>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>
                </div>
                <p>{request.description}</p>
                <div className="request-meta">
                  <span>Urgency: {request.urgencyLevel}</span>
                  <span>Needed By: {formatDate(request.neededBy)}</span>
                  <span>Fulfillment: {request.totalFulfillment}%</span>
                  <span>Created: {formatDate(request.createdAt)}</span>
                </div>
                {request.donations && request.donations.length > 0 && (
                  <div className="donations-received">
                    <h4>Donations Received:</h4>
                    {request.donations.map((donation, index) => (
                      <div key={index} className="donation-info">
                        <span>From: {donation.donorName}</span>
                        <span>Status: {donation.status}</span>
                        <span>Date: {formatDate(donation.donatedAt)}</span>
                      </div>
                    ))}
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
          <h3>Pending Donation Requests</h3>
          <div className="pending-requests">
            {pendingRequests.map(request => (
              <div key={request._id} className="pending-request-card">
                <div className="request-info">
                  <h4>{request.targetOrganization}</h4>
                  <p>{request.description}</p>
                  <div className="requester-details">
                    <span>Requester: {request.requesterName}</span>
                    <span>Organization Type: {request.organizationType}</span>
                    <span>Urgency: {request.urgencyLevel}</span>
                    <span>Needed By: {formatDate(request.neededBy)}</span>
                  </div>
                </div>
                <div className="admin-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApproveReject(request._id, 'approve')}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) handleApproveReject(request._id, 'reject', reason);
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal request-modal">
            <div className="modal-header">
              <h3>Create Donation Request</h3>
              <button onClick={() => setShowRequestModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRequest} className="request-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Requester Name *</label>
                  <input 
                    type="text"
                    value={requestForm.requesterName}
                    onChange={(e) => setRequestForm({...requestForm, requesterName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Target Organization *</label>
                  <input 
                    type="text"
                    value={requestForm.targetOrganization}
                    onChange={(e) => setRequestForm({...requestForm, targetOrganization: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Organization Type *</label>
                  <select 
                    value={requestForm.organizationType}
                    onChange={(e) => setRequestForm({...requestForm, organizationType: e.target.value})}
                  >
                    <option value="ngo">NGO</option>
                    <option value="charity">Charity</option>
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
                <label>Description *</label>
                <textarea 
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Location Address *</label>
                <input 
                  type="text"
                  value={requestForm.address}
                  onChange={(e) => setRequestForm({...requestForm, address: e.target.value})}
                  placeholder="Street address, city, zip code"
                  required
                />
              </div>

              <div className="form-group">
                <label>Needed By *</label>
                <input 
                  type="datetime-local"
                  value={requestForm.neededBy}
                  onChange={(e) => setRequestForm({...requestForm, neededBy: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Requested Items *</label>
                {requestForm.requestedItems.map((item, index) => (
                  <div key={index} className="requested-item-form">
                    <div className="item-row">
                      <input 
                        type="text"
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={(e) => updateRequestedItem(index, 'itemName', e.target.value)}
                        required
                      />
                      <input 
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateRequestedItem(index, 'quantity', e.target.value)}
                        required
                      />
                      <select 
                        value={item.unit}
                        onChange={(e) => updateRequestedItem(index, 'unit', e.target.value)}
                      >
                        <option value="kg">Kilograms</option>
                        <option value="g">Grams</option>
                        <option value="l">Liters</option>
                        <option value="ml">Milliliters</option>
                        <option value="pieces">Pieces</option>
                        <option value="portions">Portions</option>
                        <option value="plates">Plates</option>
                        <option value="bowls">Bowls</option>
                      </select>
                      <select 
                        value={item.priority}
                        onChange={(e) => updateRequestedItem(index, 'priority', e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      {requestForm.requestedItems.length > 1 && (
                        <button type="button" onClick={() => removeRequestedItem(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addRequestedItem}>
                  + Add Item
                </button>
              </div>

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

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea 
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  placeholder="Any additional information..."
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Request Modal */}
      {showFulfillModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal fulfill-modal">
            <div className="modal-header">
              <h3>Fulfill Request: {selectedRequest.targetOrganization}</h3>
              <button onClick={() => setShowFulfillModal(false)}>×</button>
            </div>
            <form onSubmit={handleFulfillRequest} className="fulfill-form">
              <div className="soon-expire-section">
                <h4>Soon-to-Expire Items (Recommended)</h4>
                <div className="expire-items-grid">
                  {soonToExpireItems.map(item => (
                    <div key={item._id} className="expire-item">
                      <span>{item.name}: {item.currentQuantity} {item.unit}</span>
                      <span className="expiry">Expires: {formatDate(item.expiryDate)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fulfillment-items">
                <h4>Items to Donate</h4>
                {fulfillmentForm.items.map((item, index) => (
                  <div key={index} className="fulfillment-item-form">
                    <div className="item-info">
                      <span>Requested: {selectedRequest.requestedItems[index]?.itemName} 
                        ({selectedRequest.requestedItems[index]?.quantity} {selectedRequest.requestedItems[index]?.unit})
                      </span>
                    </div>
                    <div className="donation-inputs">
                      <input 
                        type="number"
                        placeholder="Quantity to donate"
                        value={item.quantity}
                        onChange={(e) => updateFulfillmentItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                      />
                      <select 
                        value={fulfillmentForm.inventoryItemIds[index] || ''}
                        onChange={(e) => updateInventorySelection(index, e.target.value)}
                      >
                        <option value="">Select from inventory (optional)</option>
                        {soonToExpireItems.map(invItem => (
                          <option key={invItem._id} value={invItem._id}>
                            {invItem.name} ({invItem.currentQuantity} {invItem.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowFulfillModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Pledge Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationRequestManagement;