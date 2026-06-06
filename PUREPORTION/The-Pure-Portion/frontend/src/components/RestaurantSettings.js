import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RestaurantSettings.css';

const RestaurantSettings = ({ onClose }) => {
  const [settings, setSettings] = useState({
    workingHours: {
      standardHours: 8,
      startTime: '09:00',
      endTime: '17:00',
      breakTime: 1
    },
    overtimeSettings: {
      overtimeRate: 1.5,
      maxOvertimePerDay: 4
    },
    attendanceSettings: {
      allowEarlyClockIn: 15,
      allowLateClockOut: 30,
      autoClockOutAfter: 12
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      
      const response = await axios.put('/api/settings', settings);
      setMessage('Settings updated successfully!');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Restaurant Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Working Hours Section */}
          <div className="settings-section">
            <h3>Working Hours</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Standard Work Hours per Day</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={settings.workingHours.standardHours}
                  onChange={(e) => handleChange('workingHours', 'standardHours', parseFloat(e.target.value))}
                />
                <small>Hours beyond this will be considered overtime</small>
              </div>
              
              <div className="form-group">
                <label>Break Time (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.5"
                  value={settings.workingHours.breakTime}
                  onChange={(e) => handleChange('workingHours', 'breakTime', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Standard Start Time</label>
                <input
                  type="time"
                  value={settings.workingHours.startTime}
                  onChange={(e) => handleChange('workingHours', 'startTime', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Standard End Time</label>
                <input
                  type="time"
                  value={settings.workingHours.endTime}
                  onChange={(e) => handleChange('workingHours', 'endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Overtime Settings */}
          <div className="settings-section">
            <h3>Overtime Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Overtime Rate Multiplier</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  step="0.1"
                  value={settings.overtimeSettings.overtimeRate}
                  onChange={(e) => handleChange('overtimeSettings', 'overtimeRate', parseFloat(e.target.value))}
                />
                <small>e.g., 1.5 means 1.5x normal rate</small>
              </div>
              
              <div className="form-group">
                <label>Max Overtime Hours per Day</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={settings.overtimeSettings.maxOvertimePerDay}
                  onChange={(e) => handleChange('overtimeSettings', 'maxOvertimePerDay', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Attendance Settings */}
          <div className="settings-section">
            <h3>Attendance Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Allow Early Clock-in (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={settings.attendanceSettings.allowEarlyClockIn}
                  onChange={(e) => handleChange('attendanceSettings', 'allowEarlyClockIn', parseInt(e.target.value))}
                />
                <small>Minutes before start time</small>
              </div>
              
              <div className="form-group">
                <label>Allow Late Clock-out (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.attendanceSettings.allowLateClockOut}
                  onChange={(e) => handleChange('attendanceSettings', 'allowLateClockOut', parseInt(e.target.value))}
                />
                <small>Minutes after end time</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Auto Clock-out After (hours)</label>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={settings.attendanceSettings.autoClockOutAfter}
                  onChange={(e) => handleChange('attendanceSettings', 'autoClockOutAfter', parseInt(e.target.value))}
                />
                <small>Automatically clock out staff after this many hours</small>
              </div>
            </div>
          </div>

          <div className="form-buttons">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSettings;