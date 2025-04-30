import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

function AdminPanel() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [displayDate, setDisplayDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodes, setSecurityCodes] = useState([]);
  const [existingSecurityCodes, setExistingSecurityCodes] = useState([]);
  const [activeBillboard, setActiveBillboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateLoading, setDateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/user-info');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // If user info fetch fails due to authentication, go back to login
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/');
        }
      }
    };
    
    fetchUserInfo();
  }, [navigate]);

  // Update display date whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(formatSelectedDateForDisplay(selectedDate));
    }
  }, [selectedDate]);

  // Check for existing billboard session from navigation state
  useEffect(() => {
    if (location.state?.fromBillboard) {
      const { eventId, securityCodes, eventName, eventDate } = location.state;
      
      // Set selected date from billboard or use today's date if none
      if (eventDate) {
        setSelectedDate(eventDate);
        setDisplayDate(formatSelectedDateForDisplay(eventDate));
      } else {
        const today = getTodayDate();
        setSelectedDate(today);
        setDisplayDate(formatSelectedDateForDisplay(today));
      }
      
      // Set existing security codes
      setExistingSecurityCodes(securityCodes || []);
      
      // Store billboard session info
      setActiveBillboard({
        eventId,
        eventName,
        securityCodes: securityCodes || []
      });
    }
  }, [location.state]);

  // Fetch events for the selected date
  useEffect(() => {
    const fetchEventsByDate = async () => {
      try {
        setDateLoading(true);
        
        // Use the selected date directly - this is already in YYYY-MM-DD format
        // No need to create a new Date object which could cause timezone issues
        const dateForApi = selectedDate;
        
        console.log('Fetching events for date:', selectedDate);
        
        const response = await axios.get(`http://localhost:3001/api/events-by-date?date=${dateForApi}`);
        setEvents(response.data);
        
        // Once events are loaded, set the selected event if we have one from billboard
        if (location.state?.fromBillboard && location.state?.eventId) {
          // Check if the event from billboard exists in fetched events
          const eventExists = response.data.some(event => event.id === location.state.eventId);
          if (eventExists) {
            setSelectedEvent(location.state.eventId);
          } else {
            // If the event doesn't exist for this date, clear the selection
            setSelectedEvent('');
          }
        }
        
        setLoading(false);
        setDateLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        if (error.response?.status === 401) {
          // Handle unauthorized error by redirecting to login
          navigate('/');
        } else {
          setError('Failed to load events. Please try again.');
          setLoading(false);
          setDateLoading(false);
        }
      }
    };

    // Only fetch if we have a date selected
    if (selectedDate) {
      fetchEventsByDate();
    }
  }, [selectedDate, navigate, location.state]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    // Format date immediately for display
    setDisplayDate(formatSelectedDateForDisplay(newDate));
  };

  const handleAddSecurityCode = () => {
    if (securityCode && !securityCodes.includes(securityCode) && !existingSecurityCodes.includes(securityCode)) {
      setSecurityCodes([...securityCodes, securityCode]);
      setSecurityCode('');
    }
  };

  const handleRemoveSecurityCode = (codeToRemove) => {
    setSecurityCodes(securityCodes.filter(code => code !== codeToRemove));
  };

  const handleRemoveExistingCode = (codeToRemove) => {
    setExistingSecurityCodes(existingSecurityCodes.filter(code => code !== codeToRemove));
  };

  const handleLaunchBillboard = async () => {
    if (selectedEvent) {
      try {
        setLoading(true);
        
        // Combine existing and new security codes
        const allSecurityCodes = [...new Set([...existingSecurityCodes, ...securityCodes])];
        
        if (allSecurityCodes.length === 0) {
          setError('Please add at least one security code');
          setLoading(false);
          return;
        }
        
        const response = await axios.post('http://localhost:3001/api/security-codes', {
          eventId: selectedEvent,
          securityCodes: allSecurityCodes
        });
        
        // Find the selected event name
        const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
        
        // Navigate to billboard with the checked-in individuals
        navigate('/billboard', { 
          state: { 
            arrivals: response.data.filter(item => !item.error && !item.checkedOut),
            eventId: selectedEvent,
            securityCodes: allSecurityCodes,
            eventName: eventName,
            eventDate: selectedDate
          } 
        });
      } catch (error) {
        console.error('Failed to launch billboard:', error);
        setError('Failed to retrieve security code data. Please try again.');
        setLoading(false);
      }
    }
  };

  // Special function to format the selected date string from the date picker
  // This avoids timezone issues by parsing the parts directly
  function formatSelectedDateForDisplay(dateString) {
    if (!dateString) return '';
    
    try {
      // Input format is YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      
      // Create date with explicit year, month (0-based), day
      // Use noon to avoid any date shifting due to timezone
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date parts:', year, month, day);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting selected date:', error);
      return 'Error formatting date';
    }
  }

  if (loading && !dateLoading) {
    return (
      <div className="container">
        <NavBar user={user} currentPage="admin" />
        <div className="loading-message">
          <h2>Loading...</h2>
          <p>Fetching data from Planning Center</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <NavBar user={user} currentPage="admin" />
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <NavBar user={user} currentPage="admin" />
      
      {activeBillboard && (
        <div className="active-billboard-banner">
          <div className="active-billboard-info">
            <span className="active-status">Active Billboard</span>
            <h3>{activeBillboard.eventName}</h3>
            <p>{existingSecurityCodes.length} security codes added</p>
          </div>
          <button 
            className="btn-primary return-to-billboard"
            onClick={handleLaunchBillboard}
          >
            Return to Billboard
          </button>
        </div>
      )}
      
      <div className="card">
        <div className="step-title">
          <div className="step-number">1</div>
          <h2>Select Date</h2>
        </div>
        <label className="input-label" htmlFor="date-select">Event Date</label>
        <input 
          id="date-select"
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange}
          className="date-input"
        />
        {selectedDate && (
          <p className="date-display">
            Showing events for: {displayDate}
          </p>
        )}
      </div>
      
      <div className="card">
        <div className="step-title">
          <div className="step-number">2</div>
          <h2>Select Event</h2>
        </div>
        {dateLoading ? (
          <p className="loading-events">Loading events for selected date...</p>
        ) : events.length > 0 ? (
          <>
            <label className="input-label" htmlFor="event-select">Event</label>
            <select 
              id="event-select"
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="select-input"
            >
              <option value="">-- Select an Event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.attributes.name}
                </option>
              ))}
            </select>
            <p className="event-count">Showing {events.length} active events</p>
          </>
        ) : (
          <p className="no-events-message">No active events found for the selected date.</p>
        )}
      </div>
      
      <div className="card">
        <div className="step-title">
          <div className="step-number">3</div>
          <h2>Manage Security Codes</h2>
        </div>
        
        {existingSecurityCodes.length > 0 && (
          <div className="existing-codes-section">
            <h3 className="section-subtitle">Current Security Codes</h3>
            <div className="security-codes">
              {existingSecurityCodes.map(code => (
                <div key={`existing-${code}`} className="security-code-chip existing">
                  {code}
                  <button 
                    onClick={() => handleRemoveExistingCode(code)}
                    className="btn-remove"
                    aria-label="Remove security code"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <label className="input-label" htmlFor="security-code">Add New Security Code</label>
        <div className="input-group">
          <input
            id="security-code"
            type="text"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            placeholder="Enter security code"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSecurityCode()}
            className="text-input"
            disabled={!selectedEvent}
          />
          <button 
            onClick={handleAddSecurityCode}
            className="btn-secondary"
            disabled={!selectedEvent}
          >
            Add
          </button>
        </div>
        
        {securityCodes.length > 0 && (
          <div className="new-codes-section">
            <h3 className="section-subtitle">New Security Codes</h3>
            <div className="security-codes">
              {securityCodes.map(code => (
                <div key={`new-${code}`} className="security-code-chip new">
                  {code}
                  <button 
                    onClick={() => handleRemoveSecurityCode(code)}
                    className="btn-remove"
                    aria-label="Remove security code"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleLaunchBillboard}
        disabled={!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)}
        className={`btn-primary ${(!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)) ? 'disabled' : ''}`}
      >
        {activeBillboard ? 'Update Billboard' : 'Launch Billboard'}
      </button>
    </div>
  );
}

export default AdminPanel;