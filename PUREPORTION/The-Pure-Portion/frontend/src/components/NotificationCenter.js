import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/NotificationCenter.css';

const NotificationCenter = ({ module, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [module]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/notifications?module=${module}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      
      if (onNotificationUpdate) {
        onNotificationUpdate(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (onNotificationUpdate) {
        onNotificationUpdate(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/notifications/mark-all-read?module=${module}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      setUnreadCount(0);
      
      if (onNotificationUpdate) {
        onNotificationUpdate(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const deletedNotif = notifications.find(n => n._id === notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (onNotificationUpdate) {
          onNotificationUpdate(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '📝';
      default: return 'ℹ️';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'portion_plan_created': return '📋';
      case 'insufficient_inventory': return '📉';
      case 'inventory_restocked': return '📈';
      case 'restock_available': return '✅';
      default: return '📢';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notification-center">
      <button 
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                disabled={loading}
              >
                {loading ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''} priority-${notification.priority}`}
                >
                  <div className="notification-content">
                    <div className="notification-icons">
                      <span className="type-icon">{getTypeIcon(notification.type)}</span>
                      <span className="priority-icon">{getPriorityIcon(notification.priority)}</span>
                    </div>
                    
                    <div className="notification-text">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      
                      {notification.relatedData?.missingItems && (
                        <div className="missing-items">
                          <strong>Missing items:</strong>
                          <ul>
                            {notification.relatedData.missingItems.map((item, index) => (
                              <li key={index}>
                                {item.itemName}: Need {item.required} {item.unit}, 
                                Available: {item.available} {item.unit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {notification.relatedData?.restockedItems && (
                        <div className="restocked-items">
                          <strong>Restocked items:</strong>
                          <ul>
                            {notification.relatedData.restockedItems.map((item, index) => (
                              <li key={index}>
                                {item.itemName} ({item.itemId}): {item.newQuantity} {item.unit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification._id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => deleteNotification(notification._id)}
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;