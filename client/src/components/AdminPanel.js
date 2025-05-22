import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

function AdminPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [displayDate, setDisplayDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodes, setSecurityCodes] = useState([]);
  const [existingSecurityCodes, setExistingSecurityCodes] = useState([]);
  const [activeBillboard, setActiveBillboard] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && (!session?.authenticated || !session?.user?.isAdmin)) {
      navigate('/');
    }
  }, [session, sessionLoading, navigate]);

  // Update display date whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(formatSelectedDateForDisplay(selectedDate));
    }
  }, [selectedDate]);

  // Restore state from navigation
  useEffect(() => {
    if (location.state) {
      const { eventId, selectedDate, securityCodes, existingSecurityCodes, fromNav, selectedLocation, activeSecurityCodes } = location.state;
      if (eventId) setSelectedEvent(eventId);
      if (selectedDate) setSelectedDate(selectedDate);
      if (securityCodes) setSecurityCodes(securityCodes);
      if (existingSecurityCodes) setExistingSecurityCodes(existingSecurityCodes);
      if (selectedLocation) setSelectedLocation(selectedLocation);
      // If coming back from Billboard, filter codes to only those still active
      if (activeSecurityCodes) {
        setSecurityCodes(prev => prev.filter(code => activeSecurityCodes.includes(code)));
        setExistingSecurityCodes(prev => prev.filter(code => activeSecurityCodes.includes(code)));
      }
      // If coming from navbar navigation, update active billboard
      if (fromNav && eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          setActiveBillboard({
            eventId,
            eventName: event.attributes.name,
            securityCodes: existingSecurityCodes || []
          });
        }
      }
    }
  }, [location.state, events]);

  // Check for existing billboard session from navigation state
  useEffect(() => {
    if (location.state?.fromBillboard) {
      const { eventId, securityCodes, eventName, eventDate } = location.state;
      if (eventDate) {
        setSelectedDate(eventDate);
        setDisplayDate(formatSelectedDateForDisplay(eventDate));
      } else {
        const today = getTodayDate();
        setSelectedDate(today);
        setDisplayDate(formatSelectedDateForDisplay(today));
      }
      setExistingSecurityCodes(securityCodes || []);
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
        const dateForApi = selectedDate;
        const response = await axios.get(`http://localhost:3001/api/events-by-date?date=${dateForApi}`);
        setEvents(response.data);
        if (location.state?.fromBillboard && location.state?.eventId) {
          const eventExists = response.data.some(event => event.id === location.state.eventId);
          if (eventExists) {
            setSelectedEvent(location.state.eventId);
          } else {
            setSelectedEvent('');
          }
        }
        setDateLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        if (error.response?.status === 401) {
          navigate('/');
        } else {
          setDateLoading(false);
        }
      }
    };
    if (selectedDate) {
      fetchEventsByDate();
    }
  }, [selectedDate, navigate, location.state]);

  // Fetch locations when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent) {
      setLocations([]);
      setSelectedLocation('');
      return;
    }
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/events/${selectedEvent}/locations`);
        setLocations(response.data);
        setSelectedLocation('');
      } catch (err) {
        setLocations([]);
        setSelectedLocation('');
      }
    };
    fetchLocations();
  }, [selectedEvent]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
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
        const allSecurityCodes = [...new Set([...existingSecurityCodes, ...securityCodes])];
        if (allSecurityCodes.length === 0) {
          return;
        }
        const response = await axios.post('http://localhost:3001/api/security-codes', {
          eventId: selectedEvent,
          securityCodes: allSecurityCodes
        });
        const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
        const locationObj = locations.find(l => l.id === selectedLocation);
        navigate('/billboard', { 
          state: { 
            arrivals: response.data.filter(item => !item.error && !item.checkedOut),
            eventId: selectedEvent,
            securityCodes: allSecurityCodes,
            eventName: eventName,
            eventDate: selectedDate,
            selectedLocation,
            locationName: locationObj ? locationObj.attributes.name : ''
          } 
        });
      } catch (error) {
        console.error('Failed to launch billboard:', error);
      }
    }
  };

  function formatSelectedDateForDisplay(dateString) {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day, 12, 0, 0);
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

  if (sessionLoading) {
    return (
      <div className="container">
        <div className="loading-message">
          <h2>Loading...</h2>
          <p>Checking authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <NavBar 
        currentPage="admin"
        selectedEvent={selectedEvent}
        selectedEventName={activeBillboard?.eventName}
        selectedDate={selectedDate}
        securityCodes={securityCodes}
        existingSecurityCodes={existingSecurityCodes}
      />
      
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
                  {event.attributes.name} (ID: {event.id})
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
          <div className="step-number">5</div>
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
        <button 
          onClick={handleLaunchBillboard}
          disabled={!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)}
          className={`btn-primary ${(!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)) ? 'disabled' : ''}`}
          style={{ marginTop: '16px' }}
        >
          {activeBillboard ? 'Update Billboard' : 'Launch Billboard'}
        </button>
      </div>
      <div className="card">
        <div className="step-title">
          <div className="step-number">4</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: 0 }}>View Remaining Check-ins</h2>
            <div className="section-subtitle" style={{ color: '#667085', fontSize: '15px' }}>
              (People who have not yet been checked out)
            </div>
          </div>
        </div>
        {locations.length > 0 ? (
          <>
            <label className="input-label" htmlFor="location-select">Location</label>
            <select
              id="location-select"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="select-input"
            >
              <option value="">-- Select a Location --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.attributes.name} (ID: {loc.id})
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => {
                const eventObj = events.find(e => e.id === selectedEvent);
                const locationObj = locations.find(l => l.id === selectedLocation);
                navigate('/location-billboard', {
                  state: {
                    eventId: selectedEvent,
                    locationId: selectedLocation,
                    locationName: locationObj ? locationObj.attributes.name : '',
                    eventName: eventObj ? eventObj.attributes.name : '',
                    date: selectedDate,
                    securityCodes,
                    existingSecurityCodes
                  }
                });
              }}
              disabled={!selectedLocation}
              style={{ marginBottom: '16px' }}
            >
              Fetch Active Check-Ins
            </button>
          </>
        ) : (
          <p className="no-events-message">Select an event to load locations.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;