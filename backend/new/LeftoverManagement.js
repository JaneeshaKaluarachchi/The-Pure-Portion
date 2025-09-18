import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import '../styles/LeftoverManagement.css';

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "10px"
};
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo fallback

const LeftoverManagement = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [leftovers, setLeftovers] = useState([]);
  const [myLeftovers, setMyLeftovers] = useState([]);
  const [pendingLeftovers, setPendingLeftovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    radius: 10
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Donation form state
  const [donationForm, setDonationForm] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'kg',
    category: 'cooked-meal',
    expiryDate: '',
    address: '',
    coordinates: { lat: '', lng: '' },
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

  // Load Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  // Fetch leftovers with useCallback to satisfy useEffect dependencies
  const fetchLeftovers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ status: 'approved', page: 1, limit: 20 });
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.radius) params.append('radius', filters.radius);

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

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType') || 'restaurant';
    setUserType(storedUserType);

    setChatSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    fetchLeftovers();
    if (activeTab === 'my-donations') fetchMyLeftovers();
    if (activeTab === 'admin' && storedUserType === 'admin') fetchPendingLeftovers();
  }, [activeTab, fetchLeftovers, fetchMyLeftovers, fetchPendingLeftovers]);

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
    formData.append('location', JSON.stringify({
      address: donationForm.address,
      type: "Point",
      coordinates: [
        parseFloat(donationForm.coordinates.lng),
        parseFloat(donationForm.coordinates.lat)
      ]
    }));
  } else if (key === 'allergens' || key === 'dietaryTags') {
    formData.append(key, JSON.stringify(donationForm[key]));
  } else if (key === 'contactInfo') {
    formData.append(key, JSON.stringify(donationForm[key]));
  } else if (key !== 'address') {
    formData.append(key, donationForm[key]);
  }
});


      await axios.post('http://localhost:5000/api/leftovers', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Donation submitted successfully! It will be reviewed by our team.');
      setShowDonateModal(false);
      resetDonationForm();
      if (activeTab === 'my-donations') fetchMyLeftovers();
    } catch (error) {
      console.error('Error submitting donation:', error);
      alert('Failed to submit donation: ' + (error.response?.data?.message || error.message));
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
      coordinates: { lat: '', lng: '' },
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

  const handleApproveReject = async (leftoverId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/leftovers/admin/${leftoverId}/approve`, {
        action,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Leftover ${action}d successfully!`);
      fetchPendingLeftovers();
    } catch (error) {
      console.error('Error updating leftover:', error);
      alert('Failed to update leftover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { message: userMessage, sender: 'user', createdAt: new Date() }]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/leftovers/chat', {
        message: userMessage,
        sessionId: chatSessionId,
        leftovers: myLeftovers.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChatMessages(prev => [...prev, {
        message: response.data.response.message,
        sender: 'ai',
        messageType: response.data.response.type,
        createdAt: new Date()
      }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setChatMessages(prev => [...prev, {
        message: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        createdAt: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
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
      default: return '#7f8c8d';
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;
  if (loading) return <div className="loading">Loading leftovers...</div>;

  return (
    <div className="leftover-management">
      <div className="leftover-header">
        <h2>♻️ Leftover Management</h2>
        <div className="header-actions">
          <button 
            className="chat-btn"
            onClick={() => setShowChatModal(true)}
          >
            🤖 AI Recipe Assistant
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
              <label>Radius (km):</label>
              <input 
                type="number" 
                value={filters.radius}
                onChange={(e) => setFilters({...filters, radius: e.target.value})}
                min="1" 
                max="50"
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
                  <div className="donor-info">
                    <span>Donated by: {leftover.donorName}</span>
                    <span className="donor-type">{leftover.donorType}</span>
                  </div>
                  <div className="leftover-tags">
                    {leftover.dietaryTags.map(tag => (
                      <span key={tag} className="tag dietary">{tag}</span>
                    ))}
                    {leftover.allergens.map(allergen => (
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
                  </div>
                </div>
                <div className="admin-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApproveReject(leftover._id, 'approve')}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) handleApproveReject(leftover._id, 'reject', reason);
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

              {/* Address + Map */}
              <div className="form-group">
                <label>Pickup Address *</label>
                <input 
                  type="text"
                  value={donationForm.address}
                  onChange={(e) => setDonationForm({...donationForm, address: e.target.value})}
                  placeholder="Street address, city, zip code"
                  required
                />
              </div>

              <div className="form-group">
  <label>Pick Location on Map *</label>
  <GoogleMap
    mapContainerStyle={{ width: '100%', height: '300px' }}
    center={{
      lat: donationForm.coordinates.lat || 6.9271,  // default Colombo
      lng: donationForm.coordinates.lng || 79.8612
    }}
    zoom={12}
    onClick={(e) => {
      setDonationForm({
        ...donationForm,
        coordinates: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        }
      });
    }}
  >
    {donationForm.coordinates.lat && (
      <Marker
        position={{
          lat: donationForm.coordinates.lat,
          lng: donationForm.coordinates.lng
        }}
      />
    )}
  </GoogleMap>
</div>


              <div className="form-actions">
                <button type="submit" className="submit-btn">Submit Donation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="modal-overlay">
          <div className="modal chat-modal">
            <div className="modal-header">
              <h3>🤖 AI Recipe Assistant</h3>
              <button onClick={() => setShowChatModal(false)}>×</button>
            </div>
            <div className="chat-content">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="chat-loading">AI is typing...</div>}
              </div>
              <form className="chat-input-area" onSubmit={handleChatSubmit}>
                <input 
                  type="text"
                  placeholder="Ask about recipes, meal ideas..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeftoverManagement;
