import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/LeftoverManagement.css';
import '../styles/CustomPopup.css';
import ChatAssistant from "./ChatAssistant";
import LoadingScreen from "./LoadingScreen";
import logo from "../styles/images/1.png"

// Validation constants
const ALLOWED_CITIES = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle"
];

// Validation functions
const validateFoodName = (name) => {
  if (!name || !name.trim()) {
    return "Food name is required";
  }
  if (!/^[A-Za-z\s]+$/.test(name.trim())) {
    return "Food name can only contain letters and spaces";
  }
  return null;
};

const validateQuantity = (quantity) => {
  if (!quantity || quantity === '') {
    return "Quantity is required";
  }
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) {
    return "Quantity must be a number greater than 0";
  }
  return null;
};

const validateExpiryDate = (expiryDate) => {
  if (!expiryDate) {
    return "Expiry date is required";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  if (expiry < today) {
    return "Expiry date cannot be in the past";
  }
  return null;
};

const validateAddress = (address) => {
  if (!address || !address.trim()) {
    return "Address is required";
  }
  
  const parts = address.split(",").map(part => part.trim());
  if (parts.length !== 3) {
    return "Address must be in format: 'House name, Town, City'";
  }
  
  const city = parts[2];
  if (!ALLOWED_CITIES.includes(city)) {
    return `City '${city}' is not allowed. Please select from: ${ALLOWED_CITIES.join(", ")}`;
  }
  
  return null;
};

const validateRequesterName = (name) => {
  if (!name || !name.trim()) {
    return "Requester name is required";
  }
  if (!/^[A-Za-z\s]+$/.test(name.trim())) {
    return "Requester name can only contain letters and spaces";
  }
  return null;
};

const validateNeededByDate = (neededBy) => {
  if (!neededBy) {
    return "Needed by date is required";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const needed = new Date(neededBy);
  if (needed <= today) {
    return "Needed by date must be in the future";
  }
  return null;
};

const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Phone number is required";
  }
  if (!/^[0-9]{10}$/.test(phone.trim())) {
    return "Phone number must be exactly 10 digits";
  }
  return null;
};

const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email is required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Invalid email format";
  }
  return null;
};

const validateRequestedItems = (items) => {
  if (!items || items.length === 0) {
    return "At least one requested item is required";
  }
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.itemName || !item.itemName.trim()) {
      return `Item name is required for item ${i + 1}`;
    }
    if (!/^[A-Za-z\s]+$/.test(item.itemName.trim())) {
      return `Item name can only contain letters and spaces for item ${i + 1}`;
    }
    if (!item.quantity || isNaN(item.quantity) || parseFloat(item.quantity) <= 0) {
      return `Quantity must be greater than 0 for item ${i + 1}`;
    }
  }
  
  return null;
};

// Custom Popup Component
const CustomPopup = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`custom-popup ${type}`}>
      <div className="popup-content">
        <span className="popup-icon">{getIcon()}</span>
        <span className="popup-message">{message}</span>
        <button className="popup-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

// Custom Confirmation Dialog Component
const CustomConfirmDialog = ({ title, message, onConfirm, onCancel, needsInput = false, onClose }) => {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (needsInput) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal confirm-dialog">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="confirm-content">
          <p>{message}</p>
          {needsInput && (
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter reason..."
              className="confirm-input"
            />
          )}
          <div className="confirm-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="confirm-btn" onClick={handleConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Popup Manager Hook
const usePopup = () => {
  const [popups, setPopups] = useState([]);

  const showPopup = (message, type = 'info') => {
    const id = Date.now();
    const newPopup = { id, message, type };
    setPopups(prev => [...prev, newPopup]);
  };

  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  const PopupContainer = () => (
    <div className="popup-container">
      {popups.map(popup => (
        <CustomPopup
          key={popup.id}
          message={popup.message}
          type={popup.type}
          onClose={() => removePopup(popup.id)}
        />
      ))}
    </div>
  );

  return { showPopup, PopupContainer };
};

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
  
  const [showChatbot, setShowChatbot] = useState(false);
  const [showCustomConfirm, setShowCustomConfirm] = useState({ show: false });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Claim request states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedLeftoverForClaim, setSelectedLeftoverForClaim] = useState(null);
  const [claimForm, setClaimForm] = useState({
    name: '',
    phone: '',
    location: '',
    reason: ''
  });
  const [claimErrors, setClaimErrors] = useState({});
  const [pendingClaims, setPendingClaims] = useState({});
  
  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [claimNotifications, setClaimNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);

  // Validation errors state
  const [donationErrors, setDonationErrors] = useState({});
  const [requestErrors, setRequestErrors] = useState({});

  // Add popup hook
  const { showPopup, PopupContainer } = usePopup();

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

  // Real-time validation handlers for donation form
  const handleDonationFieldChange = (field, value) => {
    setDonationForm({ ...donationForm, [field]: value });
    
    // Real-time validation
    const errors = { ...donationErrors };
    
    switch (field) {
      case 'name':
        const nameError = validateFoodName(value);
        if (nameError) {
          errors.name = nameError;
        } else {
          delete errors.name;
        }
        break;
      case 'quantity':
        const quantityError = validateQuantity(value);
        if (quantityError) {
          errors.quantity = quantityError;
        } else {
          delete errors.quantity;
        }
        break;
      case 'expiryDate':
        const expiryError = validateExpiryDate(value);
        if (expiryError) {
          errors.expiryDate = expiryError;
        } else {
          delete errors.expiryDate;
        }
        break;
      case 'address':
        const addressError = validateAddress(value);
        if (addressError) {
          errors.address = addressError;
        } else {
          delete errors.address;
        }
        break;
      case 'description':
        if (!value?.trim()) {
          errors.description = "Description is required";
        } else {
          delete errors.description;
        }
        break;
      default:
        break;
    }
    
    setDonationErrors(errors);
  };

  // Real-time validation handlers for request form
  const handleRequestFieldChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setRequestForm({
        ...requestForm,
        [parent]: { ...requestForm[parent], [child]: value }
      });
    } else {
      setRequestForm({ ...requestForm, [field]: value });
    }
    
    // Real-time validation
    const errors = { ...requestErrors };
    
    switch (field) {
      case 'requesterName':
        const nameError = validateRequesterName(value);
        if (nameError) {
          errors.requesterName = nameError;
        } else {
          delete errors.requesterName;
        }
        break;
      case 'targetOrganization':
        if (!value?.trim()) {
          errors.targetOrganization = "Organization/Target is required";
        } else {
          delete errors.targetOrganization;
        }
        break;
      case 'purpose':
        if (!value?.trim()) {
          errors.purpose = "Purpose is required";
        } else {
          delete errors.purpose;
        }
        break;
      case 'description':
        if (!value?.trim()) {
          errors.description = "Description is required";
        } else {
          delete errors.description;
        }
        break;
      case 'location.address':
        const addressError = validateAddress(value);
        if (addressError) {
          errors.address = addressError;
        } else {
          delete errors.address;
        }
        break;
      case 'neededBy':
        const neededByError = validateNeededByDate(value);
        if (neededByError) {
          errors.neededBy = neededByError;
        } else {
          delete errors.neededBy;
        }
        break;
      case 'contactInfo.phone':
        const phoneError = validatePhone(value);
        if (phoneError) {
          errors.phone = phoneError;
        } else {
          delete errors.phone;
        }
        break;
      case 'contactInfo.email':
        const emailError = validateEmail(value);
        if (emailError) {
          errors.email = emailError;
        } else {
          delete errors.email;
        }
        break;
      default:
        break;
    }
    
    setRequestErrors(errors);
  };

  // Real-time validation for requested items
  const handleRequestItemChange = (index, field, value) => {
    const items = [...requestForm.requestedItems];
    items[index][field] = value;
    setRequestForm({ ...requestForm, requestedItems: items });
    
    // Real-time validation for requested items
    const errors = { ...requestErrors };
    const itemsError = validateRequestedItems(items);
    if (itemsError) {
      errors.requestedItems = itemsError;
    } else {
      delete errors.requestedItems;
    }
    setRequestErrors(errors);
  };

  // PDF Download function
  const handleDownloadPDF = async (status = 'all', type = 'all') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      if (type !== 'all') params.append('type', type);

      const response = await axios.get(`http://localhost:5000/api/leftovers/report/pdf?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Donations_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showPopup('PDF report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showPopup('Failed to download PDF report: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions for forms
  const validateDonationForm = () => {
    const errors = {};
    
    const nameError = validateFoodName(donationForm.name);
    if (nameError) errors.name = nameError;
    
    const quantityError = validateQuantity(donationForm.quantity);
    if (quantityError) errors.quantity = quantityError;
    
    const expiryError = validateExpiryDate(donationForm.expiryDate);
    if (expiryError) errors.expiryDate = expiryError;
    
    const addressError = validateAddress(donationForm.address);
    if (addressError) errors.address = addressError;
    
    if (!donationForm.description?.trim()) {
      errors.description = "Description is required";
    }
    
    setDonationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRequestForm = () => {
    const errors = {};
    
    const nameError = validateRequesterName(requestForm.requesterName);
    if (nameError) errors.requesterName = nameError;
    
    if (!requestForm.targetOrganization?.trim()) {
      errors.targetOrganization = "Organization/Target is required";
    }
    
    if (!requestForm.purpose?.trim()) {
      errors.purpose = "Purpose is required";
    }
    
    if (!requestForm.description?.trim()) {
      errors.description = "Description is required";
    }
    
    const addressError = validateAddress(requestForm.location.address);
    if (addressError) errors.address = addressError;
    
    const neededByError = validateNeededByDate(requestForm.neededBy);
    if (neededByError) errors.neededBy = neededByError;
    
    const phoneError = validatePhone(requestForm.contactInfo.phone);
    if (phoneError) errors.phone = phoneError;
    
    const emailError = validateEmail(requestForm.contactInfo.email);
    if (emailError) errors.email = emailError;
    
    const itemsError = validateRequestedItems(requestForm.requestedItems);
    if (itemsError) errors.requestedItems = itemsError;
    
    // Check if proof documents are required for official organizations
    const officialOrgs = ['charity', 'ngo', 'food-bank', 'shelter', 'school', 'hospital'];
    if (officialOrgs.includes(requestForm.organizationType) && 
        (!requestForm.proofDocuments || requestForm.proofDocuments.length === 0)) {
      errors.proofDocuments = "Proof documents are required for official organizations";
    }
    
    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
        `http://localhost:5000/api/leftovers/requests/${requestId}/fulfill`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      showPopup('You have successfully offered help for this request!', 'success');
      fetchDonationRequests();
    } catch (error) {
      console.error('Error helping with request:', error);
      showPopup('Failed to help with request: ' + (error.response?.data?.message || error.message), 'error');
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

  // Fetch claim notifications
  const fetchClaimNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/food-claim-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClaimNotifications(response.data.notifications || []);
      setUnreadNotificationCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching claim notifications:', error);
    }
  }, []);

  // Check pending claims for leftovers
  const checkPendingClaims = useCallback(async (leftoverIds) => {
    try {
      const token = localStorage.getItem('token');
      const pendingClaimsMap = {};
      
      await Promise.all(leftoverIds.map(async (id) => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/food-claim-notifications/check-pending/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.hasPendingClaim) {
            pendingClaimsMap[id] = true;
          }
        } catch (err) {
          // Ignore errors for individual checks
        }
      }));
      
      setPendingClaims(pendingClaimsMap);
    } catch (error) {
      console.error('Error checking pending claims:', error);
    }
  }, []);

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType') || localStorage.getItem('role') || 'household';
    setUserType(storedUserType);

    if (activeTab === 'browse') {
      fetchLeftovers();
    }
    if (activeTab === 'requests') fetchDonationRequests();
    if (activeTab === 'my-donations') fetchMyLeftovers();
    if (activeTab === 'admin' && storedUserType === 'admin') {
      fetchPendingLeftovers();
      fetchPendingRequests();
    }
  }, [activeTab, fetchLeftovers, fetchDonationRequests, fetchMyLeftovers, fetchPendingLeftovers, fetchPendingRequests]);

  // Fetch claim notifications periodically
  useEffect(() => {
    fetchClaimNotifications();
    const interval = setInterval(fetchClaimNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchClaimNotifications]);

  // Check pending claims when leftovers are loaded
  useEffect(() => {
    if (leftovers.length > 0) {
      const leftoverIds = leftovers.map(l => l._id);
      checkPendingClaims(leftoverIds);
    }
  }, [leftovers, checkPendingClaims]);

  // Open claim request modal
  const handleClaimLeftover = (leftover) => {
    setSelectedLeftoverForClaim(leftover);
    setShowClaimModal(true);
    setClaimForm({
      name: '',
      phone: '',
      location: '',
      reason: ''
    });
    setClaimErrors({});
  };

  // Validate claim form
  const validateClaimForm = () => {
    const errors = {};
    
    // Name validation - only letters and spaces
    if (!claimForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(claimForm.name)) {
      errors.name = 'Name can only contain letters and spaces';
    }
    
    // Phone validation - exactly 10 digits
    if (!claimForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(claimForm.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    
    // Location validation
    if (!claimForm.location.trim()) {
      errors.location = 'Location is required';
    }
    
    // Reason validation
    if (!claimForm.reason.trim()) {
      errors.reason = 'Reason is required';
    }
    
    setClaimErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit claim request
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateClaimForm()) {
      showPopup('Please fix the validation errors', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/food-claim-notifications/claim-request', {
        leftoverId: selectedLeftoverForClaim._id,
        name: claimForm.name,
        phone: claimForm.phone,
        location: claimForm.location,
        reason: claimForm.reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showPopup('Claim request submitted successfully! You will be notified when the donor responds.', 'success');
      setShowClaimModal(false);
      setShowDetailsModal(false);
      
      // Mark this leftover as having a pending claim
      setPendingClaims(prev => ({
        ...prev,
        [selectedLeftoverForClaim._id]: true
      }));
      
      fetchLeftovers();
    } catch (error) {
      console.error('Error submitting claim request:', error);
      showPopup('Failed to submit claim request: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/food-claim-notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClaimNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetails(true);
    
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
  };

  // Respond to claim request (approve/reject)
  const handleRespondToClaim = async (notificationId, action, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/food-claim-notifications/${notificationId}/respond`,
        { action, rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showPopup(
        action === 'approve' 
          ? 'Claim request approved! The requester has been notified.' 
          : 'Claim request rejected. The requester has been notified.',
        'success'
      );
      
      setShowNotificationDetails(false);
      fetchClaimNotifications();
      fetchMyLeftovers();
      
      // Redirect to My Donations page
      setActiveTab('my-donations');
    } catch (error) {
      console.error('Error responding to claim:', error);
      showPopup('Failed to respond: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleViewDetails = (leftover) => {
    setSelectedDonation(leftover);
    setShowDetailsModal(true);
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateDonationForm()) {
      showPopup('Please fix the validation errors before submitting', 'error');
      return;
    }
    
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

      showPopup('Donation submitted successfully! It will be reviewed by our admin team.', 'success');
      setShowDonateModal(false);
      resetDonationForm();
      if (activeTab === 'my-donations') fetchMyLeftovers();
    } catch (error) {
      console.error('Error submitting donation:', error);
      showPopup('Failed to submit donation: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateRequestForm()) {
      showPopup('Please fix the validation errors before submitting', 'error');
      return;
    }
    
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

      showPopup('Donation request submitted successfully! It will be reviewed by our admin team.', 'success');
      setShowRequestModal(false);
      resetRequestForm();
      if (activeTab === 'requests') fetchDonationRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      showPopup('Failed to submit request: ' + (error.response?.data?.message || error.message), 'error');
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
    setDonationErrors({});
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
    setRequestErrors({});
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

      showPopup(`${type === 'leftover' ? 'Leftover' : 'Request'} ${action}d successfully!`, 'success');
      if (type === 'leftover') {
        fetchPendingLeftovers();
      } else {
        fetchPendingRequests();
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      showPopup(`Failed to update ${type}: ` + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Custom confirmation popup for reject actions
  const handleRejectWithReason = (id, type) => {
    setShowCustomConfirm({
      show: true,
      title: `Reject ${type === 'leftover' ? 'Leftover' : 'Request'}`,
      message: 'Please provide a reason for rejection:',
      onConfirm: (reason) => {
        if (reason.trim()) {
          handleApproveReject(id, 'reject', reason, type);
        } else {
          showPopup('Reason is required for rejection', 'warning');
        }
        setShowCustomConfirm({ show: false });
      },
      onCancel: () => setShowCustomConfirm({ show: false }),
      needsInput: true
    });
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="leftover-management">
      {/* Add the popup container */}
      <PopupContainer />
      
      {/* Custom confirmation dialog */}
      {showCustomConfirm.show && (
        <CustomConfirmDialog
          {...showCustomConfirm}
          onClose={() => setShowCustomConfirm({ show: false })}
        />
      )}

      <div className="leftover-header">
        <h2>♻️ Leftover Management System</h2>
        <div className="header-actions">
          <button 
            className="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Claim Notifications"
          >
            🔔 Notifications
            {unreadNotificationCount > 0 && (
              <span className="notification-badge">{unreadNotificationCount}</span>
            )}
          </button>
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
          <button 
            className="chatbot-btn"
            onClick={() => setShowChatbot(true)}
          >
            🤖 AI Chatbot
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

      {showChatbot && (
  <div className="modal-overlay">
    <div className="modal chatbot-modal">
      <div className="modal-header">
        <div className="header-title">
          <img src={logo} alt="Bot Logo" className="bot-logo" />
          <h3>ChatBot</h3>
        </div>
        <button onClick={() => setShowChatbot(false)}>×</button>
      </div>
      <ChatAssistant />
    </div>
  </div>
)}


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
                  <h3>{leftover.name}
                  <span className="donor-type">{leftover.donorType}</span></h3>
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
                    <span> {leftover.location?.address || leftover.address || '📍Location not specified'}</span>
                  </div>
                  <div className="donor-info">
                    <span>Donated by: {leftover.donorName}</span>
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
                      className="details-btn"
                      onClick={() => handleViewDetails(leftover)}
                    >
                       Details
                    </button>
                    {pendingClaims[leftover._id] ? (
                      <div className="pending-claim-label">
                        ⏳ Your request is pending
                      </div>
                    ) : (
                      <button 
                        className="claim-btn"
                        onClick={() => handleClaimLeftover(leftover)}
                      >
                         Claim This Food
                      </button>
                    )}
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
                  <span> {request.location?.address}</span>
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
          <div className="donations-header">
            <h3>My Donations & Requests</h3>
            <div className="pdf-download-options">
              <button 
                className="pdf-btn"
                onClick={() => handleDownloadPDF('all', 'donations')}
                disabled={loading}
              >
                📄 Download My Donations PDF
              </button>
              <button 
                className="pdf-btn"
                onClick={() => handleDownloadPDF('all', 'requests')}
                disabled={loading}
              >
                📄 Download My Requests PDF
              </button>
              <button 
                className="pdf-btn"
                onClick={() => handleDownloadPDF('all', 'all')}
                disabled={loading}
              >
                📄 Download Complete Report
              </button>
            </div>
          </div>
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
                <div className="leftover-meta">
                  <span>Quantity: {leftover.quantity} {leftover.unit}</span>
                  <span>Expires: {formatDate(leftover.expiryDate)}</span>
                  <span>Posted: {formatDate(leftover.createdAt)}</span>
                </div>
                {leftover.claimedBy && (
                  <div className="claimed-info">
                    <span>Claimed by: {leftover.claimedBy.userName}</span><br></br>
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
                      <span> {leftover.location?.address}</span>
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
                      onClick={() => handleRejectWithReason(leftover._id, 'leftover')}
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
                      <span> {request.location?.address}</span>
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
                      onClick={() => handleRejectWithReason(request._id, 'request')}
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
                  onChange={(e) => handleDonationFieldChange('name', e.target.value)}
                  className={donationErrors.name ? 'error' : ''}
                  required
                />
                {donationErrors.name && <span className="error-text">{donationErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  value={donationForm.description}
                  onChange={(e) => handleDonationFieldChange('description', e.target.value)}
                  className={donationErrors.description ? 'error' : ''}
                  required
                />
                {donationErrors.description && <span className="error-text">{donationErrors.description}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input 
                    type="number"
                    step="0.1"
                    min = "0.1"
                    value={donationForm.quantity}
                    onChange={(e) => handleDonationFieldChange('quantity', e.target.value)}
                    className={donationErrors.quantity ? 'error' : ''}
                    required
                  />
                  {donationErrors.quantity && <span className="error-text">{donationErrors.quantity}</span>}
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
                  onChange={(e) => handleDonationFieldChange('expiryDate', e.target.value)}
                  className={donationErrors.expiryDate ? 'error' : ''}
                  required
                />
                {donationErrors.expiryDate && <span className="error-text">{donationErrors.expiryDate}</span>}
              </div>
              <div className="form-group">
                <label>Pickup Address *</label>
                <textarea 
                  value={donationForm.address}
                  onChange={(e) => handleDonationFieldChange('address', e.target.value)}
                  placeholder="Format: House name, Town, City (e.g., 123 Main St, Dehiwala, Colombo)"
                  className={donationErrors.address ? 'error' : ''}
                  required
                />
                {donationErrors.address && <span className="error-text">{donationErrors.address}</span>}
                <small>Allowed cities: {ALLOWED_CITIES.join(', ')}</small>
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
                  onChange={(e) => handleRequestFieldChange('requesterName', e.target.value)}
                  className={requestErrors.requesterName ? 'error' : ''}
                  required
                />
                {requestErrors.requesterName && <span className="error-text">{requestErrors.requesterName}</span>}
              </div>
              <div className="form-group">
                <label>Organization/Target *</label>
                <input 
                  type="text"
                  value={requestForm.targetOrganization}
                  onChange={(e) => handleRequestFieldChange('targetOrganization', e.target.value)}
                  placeholder="e.g., ABC Charity, XYZ Elder Home"
                  className={requestErrors.targetOrganization ? 'error' : ''}
                  required
                />
                {requestErrors.targetOrganization && <span className="error-text">{requestErrors.targetOrganization}</span>}
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
                  onChange={(e) => handleRequestFieldChange('purpose', e.target.value)}
                  placeholder="Why do you need this donation?"
                  className={requestErrors.purpose ? 'error' : ''}
                  required
                />
                {requestErrors.purpose && <span className="error-text">{requestErrors.purpose}</span>}
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  value={requestForm.description}
                  onChange={(e) => handleRequestFieldChange('description', e.target.value)}
                  placeholder="Detailed description of your request"
                  className={requestErrors.description ? 'error' : ''}
                  required
                />
                {requestErrors.description && <span className="error-text">{requestErrors.description}</span>}
              </div>
              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea 
                  value={requestForm.location.address}
                  onChange={(e) => handleRequestFieldChange('location.address', e.target.value)}
                  placeholder="Format: House name, Town, City (e.g., 123 Main St, Dehiwala, Colombo)"
                  className={requestErrors.address ? 'error' : ''}
                  required
                />
                {requestErrors.address && <span className="error-text">{requestErrors.address}</span>}
                <small>Allowed cities: {ALLOWED_CITIES.join(', ')}</small>
              </div>
              <div className="form-group">
                <label>Needed By *</label>
                <input 
                  type="date"
                  value={requestForm.neededBy}
                  onChange={(e) => handleRequestFieldChange('neededBy', e.target.value)}
                  className={requestErrors.neededBy ? 'error' : ''}
                  required
                />
                {requestErrors.neededBy && <span className="error-text">{requestErrors.neededBy}</span>}
              </div>

              {/* Requested Items */}
              <div className="form-group">
                <label>Requested Items *</label>
                {requestErrors.requestedItems && <span className="error-text">{requestErrors.requestedItems}</span>}
                {requestForm.requestedItems.map((item, index) => (
                  <div key={index} className="requested-item-form">
                    <input 
                      type="text"
                      placeholder="Item name (letters and spaces only)"
                      value={item.itemName}
                      onChange={(e) => handleRequestItemChange(index, 'itemName', e.target.value)}
                      required
                    />
                    <input 
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleRequestItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                    <select 
                      value={item.unit}
                      onChange={(e) => handleRequestItemChange(index, 'unit', e.target.value)}
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
                      onChange={(e) => handleRequestItemChange(index, 'priority', e.target.value)}
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
                    placeholder="10 digits only"
                    value={requestForm.contactInfo.phone}
                    onChange={(e) => handleRequestFieldChange('contactInfo.phone', e.target.value)}
                    className={requestErrors.phone ? 'error' : ''}
                    required
                  />
                  {requestErrors.phone && <span className="error-text">{requestErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email"
                    value={requestForm.contactInfo.email}
                    onChange={(e) => handleRequestFieldChange('contactInfo.email', e.target.value)}
                    className={requestErrors.email ? 'error' : ''}
                    required
                  />
                  {requestErrors.email && <span className="error-text">{requestErrors.email}</span>}
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
                    className={requestErrors.proofDocuments ? 'error' : ''}
                    required
                  />
                  {requestErrors.proofDocuments && <span className="error-text">{requestErrors.proofDocuments}</span>}
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

      {/* Details Modal */}
      {showDetailsModal && selectedDonation && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Donation Details</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="details-content">
              {selectedDonation.imageUrl && (
                <div className="details-image">
                  <img src={`http://localhost:5000${selectedDonation.imageUrl}`} alt={selectedDonation.name} />
                </div>
              )}
              
              <div className="details-section">
                <h4>Food Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedDonation.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{selectedDonation.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{selectedDonation.quantity} {selectedDonation.unit}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{selectedDonation.category.replace('-', ' ')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Donor Type:</span>
                  <span className="detail-value">{selectedDonation.donorType}</span>
                </div>
              </div>

              <div className="details-section">
                <h4>Pickup Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedDonation.location?.address || selectedDonation.address || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Expiry Date:</span>
                  <span className="detail-value expiry-highlight">
                    {formatDate(selectedDonation.expiryDate)} ({getDaysUntilExpiry(selectedDonation.expiryDate)} days remaining)
                  </span>
                </div>
                {selectedDonation.pickupInstructions && (
                  <div className="detail-row">
                    <span className="detail-label">Pickup Instructions:</span>
                    <span className="detail-value">{selectedDonation.pickupInstructions}</span>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h4>Donor Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Donated by:</span>
                  <span className="detail-value">{selectedDonation.donorName}</span>
                </div>
                {selectedDonation.contactInfo && (
                  <>
                    {selectedDonation.contactInfo.phone && (
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedDonation.contactInfo.phone}</span>
                      </div>
                    )}
                    {selectedDonation.contactInfo.email && (
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedDonation.contactInfo.email}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {(selectedDonation.dietaryTags?.length > 0 || selectedDonation.allergens?.length > 0) && (
                <div className="details-section">
                  <h4>Dietary Information</h4>
                  {selectedDonation.dietaryTags?.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Dietary Tags:</span>
                      <div className="detail-tags">
                        {selectedDonation.dietaryTags.map(tag => (
                          <span key={tag} className="tag dietary">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDonation.allergens?.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Allergens:</span>
                      <div className="detail-tags">
                        {selectedDonation.allergens.map(allergen => (
                          <span key={allergen} className="tag allergen">Contains {allergen}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedDonation.notes && (
                <div className="details-section">
                  <h4>Additional Notes</h4>
                  <div className="detail-row">
                    <span className="detail-value">{selectedDonation.notes}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="details-footer">
              {pendingClaims[selectedDonation._id] ? (
                <div className="pending-claim-label-large">
                  ⏳ Your request is pending
                </div>
              ) : (
                <button 
                  className="claim-btn-large"
                  onClick={() => handleClaimLeftover(selectedDonation)}
                >
                  🎁 Claim Food Donation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim Request Modal */}
      {showClaimModal && (
        <div className="modal-overlay">
          <div className="modal claim-modal">
            <div className="modal-header">
              <h3>Claim Food Donation</h3>
              <button onClick={() => setShowClaimModal(false)}>×</button>
            </div>
            <form className="claim-form" onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input 
                  type="text"
                  value={claimForm.name}
                  onChange={(e) => {
                    setClaimForm({...claimForm, name: e.target.value});
                    if (claimErrors.name) {
                      const errors = {...claimErrors};
                      delete errors.name;
                      setClaimErrors(errors);
                    }
                  }}
                  className={claimErrors.name ? 'error' : ''}
                  placeholder="Enter your full name (letters only)"
                />
                {claimErrors.name && <span className="error-text">{claimErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel"
                  value={claimForm.phone}
                  onChange={(e) => {
                    setClaimForm({...claimForm, phone: e.target.value});
                    if (claimErrors.phone) {
                      const errors = {...claimErrors};
                      delete errors.phone;
                      setClaimErrors(errors);
                    }
                  }}
                  className={claimErrors.phone ? 'error' : ''}
                  placeholder="Enter 10 digit phone number"
                  maxLength="10"
                />
                {claimErrors.phone && <span className="error-text">{claimErrors.phone}</span>}
              </div>
              
              <div className="form-group">
                <label>Location *</label>
                <input 
                  type="text"
                  value={claimForm.location}
                  onChange={(e) => {
                    setClaimForm({...claimForm, location: e.target.value});
                    if (claimErrors.location) {
                      const errors = {...claimErrors};
                      delete errors.location;
                      setClaimErrors(errors);
                    }
                  }}
                  className={claimErrors.location ? 'error' : ''}
                  placeholder="Enter your location"
                />
                {claimErrors.location && <span className="error-text">{claimErrors.location}</span>}
              </div>
              
              <div className="form-group">
                <label>Reason for Request *</label>
                <textarea 
                  value={claimForm.reason}
                  onChange={(e) => {
                    setClaimForm({...claimForm, reason: e.target.value});
                    if (claimErrors.reason) {
                      const errors = {...claimErrors};
                      delete errors.reason;
                      setClaimErrors(errors);
                    }
                  }}
                  className={claimErrors.reason ? 'error' : ''}
                  placeholder="Please explain why you need this food"
                  rows="4"
                />
                {claimErrors.reason && <span className="error-text">{claimErrors.reason}</span>}
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowClaimModal(false)}>
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

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Claim Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>×</button>
          </div>
          <div className="notifications-list">
            {claimNotifications.length === 0 ? (
              <div className="no-notifications">No notifications yet</div>
            ) : (
              claimNotifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.type === 'claim_request' && '📨'}
                    {notification.type === 'claim_approved' && '✅'}
                    {notification.type === 'claim_rejected' && '❌'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.type === 'claim_request' && 'New Claim Request'}
                      {notification.type === 'claim_approved' && 'Claim Approved'}
                      {notification.type === 'claim_rejected' && 'Claim Rejected'}
                    </div>
                    <div className="notification-message">
                      {notification.type === 'claim_request' && 
                        `${notification.requesterName} wants to claim "${notification.leftoverName}"`}
                      {notification.type === 'claim_approved' && 
                        `Your request for "${notification.leftoverName}" has been approved!`}
                      {notification.type === 'claim_rejected' && 
                        `Your request for "${notification.leftoverName}" was rejected`}
                    </div>
                    <div className="notification-time">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.isRead && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showNotificationDetails && selectedNotification && (
        <div className="modal-overlay">
          <div className="modal notification-details-modal">
            <div className="modal-header">
              <h3>
                {selectedNotification.type === 'claim_request' && 'Claim Request Details'}
                {selectedNotification.type === 'claim_approved' && 'Approved Request'}
                {selectedNotification.type === 'claim_rejected' && 'Rejected Request'}
              </h3>
              <button onClick={() => setShowNotificationDetails(false)}>×</button>
            </div>
            
            <div className="notification-details-content">
              <div className="detail-section">
                <h4>Food Item</h4>
                <p><strong>{selectedNotification.leftoverName}</strong></p>
              </div>

              {selectedNotification.type === 'claim_request' && (
                <>
                  <div className="detail-section">
                    <h4>Requester Information</h4>
                    <p><strong>Name:</strong> {selectedNotification.claimDetails.name}</p>
                    <p><strong>Phone:</strong> {selectedNotification.claimDetails.phone}</p>
                    <p><strong>Location:</strong> {selectedNotification.claimDetails.location}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Reason for Request</h4>
                    <p>{selectedNotification.claimDetails.reason}</p>
                  </div>

                  {selectedNotification.status === 'pending' && (
                    <div className="approval-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleRespondToClaim(selectedNotification._id, 'approve')}
                      >
                        ✅ Approve Request
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          const reason = prompt('Please enter rejection reason:');
                          if (reason) {
                            handleRespondToClaim(selectedNotification._id, 'reject', reason);
                          }
                        }}
                      >
                        ❌ Reject Request
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedNotification.type === 'claim_approved' && (
                <div className="detail-section success-message">
                  <h4>✅ Your request has been successfully approved!</h4>
                  <p>The donor will contact you soon for pickup arrangements.</p>
                  <div className="contact-info">
                    <p><strong>Donor:</strong> {selectedNotification.donorName}</p>
                  </div>
                </div>
              )}

              {selectedNotification.type === 'claim_rejected' && (
                <div className="detail-section error-message">
                  <h4>❌ Your request has been rejected</h4>
                  {selectedNotification.rejectionReason && (
                    <div className="rejection-reason">
                      <p><strong>Reason:</strong></p>
                      <p>{selectedNotification.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="close-btn"
                onClick={() => setShowNotificationDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftoverManagement;