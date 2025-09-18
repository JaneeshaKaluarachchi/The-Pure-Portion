import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RestaurantSettings from './RestaurantSettings';
import '../styles/AttendanceManagement.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


const AttendanceManagement = () => {
  const [staff, setStaff] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffAttendanceHistory, setStaffAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'individual'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pdfFilters, setPdfFilters] = useState({
    startDate: '',
    endDate: '',
    staffId: ''
  });

  useEffect(() => {
    fetchStaff();
    fetchTodayAttendance();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data.staff || response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      alert('Error fetching staff data');
    }
  };
  
  const sriLankaHolidays = [
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-14", name: "Tamil Thai Pongal Day" },
  { date: "2025-02-04", name: "Independence Day" },
  { date: "2025-04-10", name: "Good Friday" },
  { date: "2025-04-13", name: "Sinhala & Tamil New Year Eve" },
  { date: "2025-04-14", name: "Sinhala & Tamil New Year Day" },
  { date: "2025-04-17", name: "Bak Full Moon Poya Day" },
  { date: "2025-05-01", name: "Labour Day" },
  { date: "2025-05-14", name: "Vesak Full Moon Poya Day" },
  { date: "2025-06-13", name: "Poson Full Moon Poya Day" },
  { date: "2025-07-12", name: "Esala Full Moon Poya Day" },
  { date: "2025-08-11", name: "Nikini Full Moon Poya Day" },
  { date: "2025-09-09", name: "Binara Full Moon Poya Day" },
  { date: "2025-10-08", name: "Vap Full Moon Poya Day" },
  { date: "2025-11-06", name: "Ill Full Moon Poya Day" },
  { date: "2025-12-06", name: "Unduvap Full Moon Poya Day" },
  { date: "2025-12-25", name: "Christmas Day" }
];

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/attendance/today');
      setTodayAttendance(response.data.staffAttendance);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      alert('Error fetching attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockInOut = async (staffId, action) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/attendance/clock', {
        staffId,
        action
      });
      
      alert(response.data.message);
      fetchTodayAttendance(); // Refresh the data
    } catch (error) {
      console.error('Clock in/out error:', error);
      alert(error.response?.data?.message || 'Error processing clock in/out');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffAttendance = async (staffId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/staff/${staffId}`, {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      
      setStaffAttendanceHistory(response.data.attendance);
      setAttendanceSummary(response.data.summary);
      setSelectedStaff(response.data.staff);
    } catch (error) {
      console.error('Error fetching staff attendance:', error);
      alert('Error fetching staff attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (pdfFilters.startDate) params.append('startDate', pdfFilters.startDate);
      if (pdfFilters.endDate) params.append('endDate', pdfFilters.endDate);
      if (pdfFilters.staffId) params.append('staffId', pdfFilters.staffId);

      const response = await axios.get(`/api/attendance/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const staffName = pdfFilters.staffId ? 
        staff.find(s => s._id === pdfFilters.staffId)?.firstName || 'staff' : 
        'all-staff';
      link.setAttribute('download', `attendance-report-${staffName}-${today}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(error.response?.data?.message || 'Error generating PDF report');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in': return '#28a745'; // Green
      case 'out': return '#6c757d'; // Gray
      case 'not_clocked_in': return '#ffc107'; // Yellow
      default: return '#dc3545'; // Red
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in': return 'Clocked In';
      case 'out': return 'Clocked Out';
      case 'not_clocked_in': return 'Not Clocked In';
      default: return 'Unknown';
    }
  };

  return (
    <div className="attendance-management">
      <div className="attendance-header">
        <h2>Attendance Management</h2>
        <div className="header-actions">
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙️ Settings
          </button>
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today's Attendance
            </button>
            <button 
              className={`tab-btn ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              Individual Records
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              PDF Reports
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'today' && (
        <div className="today-attendance">
          <div className="attendance-controls">
            <button onClick={fetchTodayAttendance} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="attendance-grid">
            {todayAttendance.map(({ staff, attendance, status }) => (
              <div key={staff._id} className="attendance-card">
                <div className="staff-info">
                  <h4>{staff.name}</h4>
                  <p>{staff.position}</p>
                  <p>{staff.email}</p>
                </div>
                
                <div className="attendance-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(status) }}
                  >
                    {getStatusText(status)}
                  </span>
                </div>

                {attendance && (
                  <div className="time-info">
                    <div className="time-row">
                      <span>In:</span>
                      <span>{formatTime(attendance.timeIn)}</span>
                    </div>
                    {attendance.timeOut && (
                      <>
                        <div className="time-row">
                          <span>Out:</span>
                          <span>{formatTime(attendance.timeOut)}</span>
                        </div>
                        <div className="time-row">
                          <span>Total:</span>
                          <span>{attendance.totalHours}h</span>
                        </div>
                        {attendance.overtimeHours > 0 && (
                          <div className="time-row overtime">
                            <span>Overtime:</span>
                            <span>{attendance.overtimeHours}h</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="clock-buttons">
                  <button
                    className="clock-btn clock-in"
                    onClick={() => handleClockInOut(staff._id, 'in')}
                    disabled={loading || status === 'in'}
                  >
                    Clock In
                  </button>
                  <button
                    className="clock-btn clock-out"
                    onClick={() => handleClockInOut(staff._id, 'out')}
                    disabled={loading || status !== 'in'}
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="individual-attendance">
          <div className="individual-controls">
            <div className="staff-selector">
              <select 
                value={selectedStaff?._id || ''} 
                onChange={(e) => {
                  if (e.target.value) {
                    fetchStaffAttendance(e.target.value);
                  }
                }}
              >
                <option value="">Select Staff Member</option>
                {staff.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName} - {member.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="date-filters">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {Array.from({length: 5}, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>

              {selectedStaff && (
                <button onClick={() => fetchStaffAttendance(selectedStaff._id)}>
                  Update
                </button>
              )}
            </div>
          </div>

          {attendanceSummary && selectedStaff && (
  <div className="attendance-wrapper" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
    
    {/* Left Side: Summary & Staff Details */}
    <div className="attendance-summary" style={{ flex: 1 }}>
      <h3>{selectedStaff.name}'s Attendance Summary</h3>
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="summary-item">
          <span className="label">Total Days:</span>
          <span className="value">{attendanceSummary.totalDays}</span>
        </div>
        <div className="summary-item">
          <span className="label">Days Present:</span>
          <span className="value">{attendanceSummary.daysPresent}</span>
        </div>
        <div className="summary-item">
          <span className="label">Total Hours:</span>
          <span className="value">{attendanceSummary.totalHours}h</span>
        </div>
        <div className="summary-item">
          <span className="label">Overtime Hours:</span>
          <span className="value overtime">{attendanceSummary.totalOvertimeHours}h</span>
        </div>
        <div className="summary-item">
          <span className="label">Avg Hours/Day:</span>
          <span className="value">{attendanceSummary.averageHoursPerDay}h</span>
        </div>
      </div>
    </div>

    {/* Right Side: Calendar */}
    {staffAttendanceHistory.length > 0 && (
      <div className="attendance-calendar" style={{ flex: 1 }}>
        <h4>Attendance Calendar</h4>
        <Calendar
  value={new Date(selectedYear, selectedMonth - 1)}
  view="month"
  tileClassName={({ date }) => {
  const record = staffAttendanceHistory.find(
    r => new Date(r.date).toDateString() === date.toDateString()
  );

  if (!record) return 'absent-day';


  if (record.overtimeHours > 0) {
    return 'overtime-day';
  } else {
    return 'present-day';
  }
}}

  tileContent={({ date }) => {
    const holiday = sriLankaHolidays.find(h =>
      new Date(h.date).toDateString() === date.toDateString()
    );
    return holiday ? (
      <span className="holiday-dot" title={holiday.name}></span>
    ) : null;
  }}
/>

        {/* Legend */}
        <div className="calendar-legend" style={{ marginTop: '10px' }}>
          <span className="legend-box present"></span> Present
          <span className="legend-box overtime"></span> Overtime
          <span className="legend-box absent"></span> Absent
          <span className="legend-box holiday"></span> Public Holiday
        </div>
      </div>
    )}

  </div>
)}


    
          {staffAttendanceHistory.length > 0 && (
            <div className="attendance-history">
              <h4>Attendance History</h4>
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Total Hours</th>
                      <th>Overtime</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffAttendanceHistory.map(record => (
                      <tr key={record._id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.timeIn)}</td>
                        <td>{formatTime(record.timeOut)}</td>
                        <td>{record.totalHours || 0}h</td>
                        <td className={record.overtimeHours > 0 ? 'overtime' : ''}>
                          {record.overtimeHours || 0}h
                        </td>
                        <td>
                          <span 
                            className="status-badge small"
                            style={{ backgroundColor: getStatusColor(record.status) }}
                          >
                            {getStatusText(record.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="pdf-reports">
          <h3>Generate PDF Reports</h3>
          
          <div className="pdf-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Staff Member (Optional)</label>
                <select 
                  value={pdfFilters.staffId} 
                  onChange={(e) => setPdfFilters(prev => ({...prev, staffId: e.target.value}))}
                >
                  <option value="">All Staff</option>
                  {staff.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} - {member.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Start Date (Optional)</label>
                <input
                  type="date"
                  value={pdfFilters.startDate}
                  onChange={(e) => setPdfFilters(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>
              
              <div className="filter-group">
                <label>End Date (Optional)</label>
                <input
                  type="date"
                  value={pdfFilters.endDate}
                  onChange={(e) => setPdfFilters(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>
            </div>

            <div className="pdf-actions">
              <button 
                className="download-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={loading}
              >
                {loading ? 'Generating PDF...' : '📄 Download PDF Report'}
              </button>
            </div>
          </div>

          <div className="pdf-info">
            <h4>Report Information</h4>
            <ul>
              <li>Leave all filters empty to generate a report for all staff and all dates</li>
              <li>Select a specific staff member to generate individual reports</li>
              <li>Use date filters to limit the report to a specific time period</li>
              <li>Reports include attendance summary, detailed records, and overtime calculations</li>
            </ul>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <RestaurantSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default AttendanceManagement;