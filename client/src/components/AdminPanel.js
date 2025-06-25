import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

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
  const [globalBillboardState, setGlobalBillboardState] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      navigate('/');
    }
  }, [session, sessionLoading, navigate]);

  // Helper to sync local state with global billboard
  const syncWithGlobalBillboard = (global) => {
    if (global?.activeBillboard) {
      setActiveBillboard(global.activeBillboard);
      setSelectedEvent(global.activeBillboard.eventId);
      setSelectedDate(global.activeBillboard.eventDate || getTodayDate());
      setExistingSecurityCodes(global.activeBillboard.securityCodes || []);
    }
  };

  // Fetch global billboard state on mount and when returning from another page
  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        const response = await api.get('/global-billboard');
        setGlobalBillboardState(response.data);
        syncWithGlobalBillboard(response.data);
      } catch (error) {
        setGlobalBillboardState(null);
      }
    };
    if (session?.authenticated) {
      fetchGlobalBillboard();
    }
  }, [session]);

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
        const response = await api.get(`/events-by-date?date=${dateForApi}`);
        
        // Handle rate limiting response
        if (response.status === 429) {
          console.log('AdminPanel: Rate limited, skipping events fetch');
          setDateLoading(false);
          return;
        }
        
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
          // Set empty events array on error to prevent UI issues
          setEvents([]);
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
        const response = await api.get(`/events/${selectedEvent}/locations`);
        
        // Handle rate limiting response
        if (response.status === 429) {
          console.log('AdminPanel: Rate limited, skipping locations fetch');
          return;
        }
        
        setLocations(response.data);
        setSelectedLocation('');
      } catch (err) {
        console.error('Error fetching locations:', err);
        setLocations([]);
        setSelectedLocation('');
      }
    };
    fetchLocations();
  }, [selectedEvent]);

  // Function to set global billboard state
  const setGlobalState = async (eventId, eventName, securityCodes = [], eventDate) => {
    if (eventId && eventName) {
      try {
        console.log('AdminPanel: Setting global state:', { eventId, eventName, securityCodes, eventDate });
        await api.post('/set-global-billboard', {
          eventId: eventId,
          eventName: eventName,
          securityCodes: securityCodes,
          eventDate: eventDate
        });
        
        // Re-fetch global state to ensure it's updated
        const response = await api.get('/global-billboard');
        console.log('AdminPanel: Global state updated:', response.data);
        setGlobalBillboardState(response.data);
        syncWithGlobalBillboard(response.data);
      } catch (error) {
        console.error('Failed to set global billboard state:', error);
      }
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setDisplayDate(formatSelectedDateForDisplay(newDate));
    
    // Update global state when date changes
    if (selectedEvent) {
      const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
      const allSecurityCodes = [...new Set([...existingSecurityCodes, ...securityCodes])];
      await setGlobalState(selectedEvent, eventName, allSecurityCodes, newDate);
    }
  };

  const handleEventChange = async (e) => {
    const newEventId = e.target.value;
    setSelectedEvent(newEventId);
    
    // Update global state when event changes
    if (newEventId && selectedDate) {
      const eventName = events.find(e => e.id === newEventId)?.attributes?.name || 'Event';
      const allSecurityCodes = [...new Set([...existingSecurityCodes, ...securityCodes])];
      await setGlobalState(newEventId, eventName, allSecurityCodes, selectedDate);
    }
  };

  const handleAddSecurityCode = async () => {
    if (securityCode && !securityCodes.includes(securityCode) && !existingSecurityCodes.includes(securityCode)) {
      setSecurityCodes([...securityCodes, securityCode]);
      
      // Also create an actual notification record by calling the security-code-entry endpoint
      try {
        const response = await api.post('/security-code-entry', {
          securityCode: securityCode.trim().toUpperCase(),
          eventId: selectedEvent,
          eventDate: selectedDate
        });
        
        if (response.data.success) {
          console.log(`Successfully created notification for ${response.data.childName}`);
        } else {
          console.log(`Security code entry failed: ${response.data.message}`);
        }
      } catch (error) {
        console.error('Error creating notification record:', error);
      }
      
      // After update, re-fetch global state
      const response = await api.get('/global-billboard');
      setGlobalBillboardState(response.data);
      syncWithGlobalBillboard(response.data);
    }
  };

  const handleRemoveSecurityCode = async (codeToRemove) => {
    setSecurityCodes(securityCodes.filter(code => code !== codeToRemove));
    // After update, re-fetch global state
    const response = await api.get('/global-billboard');
    setGlobalBillboardState(response.data);
    syncWithGlobalBillboard(response.data);
  };

  const handleRemoveExistingCode = async (codeToRemove) => {
    setExistingSecurityCodes(existingSecurityCodes.filter(code => code !== codeToRemove));
    // After update, re-fetch global state
    const response = await api.get('/global-billboard');
    setGlobalBillboardState(response.data);
    syncWithGlobalBillboard(response.data);
  };

  const handleLaunchBillboard = async () => {
    if (selectedEvent) {
      try {
        const allSecurityCodes = [...new Set([...existingSecurityCodes, ...securityCodes])];
        if (allSecurityCodes.length === 0) {
          return;
        }
        const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
        
        // Global state is already set when event/date changes, just navigate
        const locationObj = locations.find(l => l.id === selectedLocation);
        navigate('/billboard', { 
          state: { 
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

  const handleClearBillboard = async () => {
    try {
      await api.delete('/global-billboard');
      setActiveBillboard(null);
      setGlobalBillboardState(null);
      setExistingSecurityCodes([]);
    } catch (error) {
      console.error('Failed to clear billboard:', error);
    }
  };

  const handleFetchCheckIns = async () => {
    if (!selectedEvent) {
      setCheckInError('Please select an event first.');
      return;
    }

    setLoadingCheckIns(true);
    setCheckInError('');
    setCheckIns([]);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('eventId', selectedEvent);
      if (selectedLocation) {
        params.append('locationId', selectedLocation);
      } else {
        params.append('locationId', 'all');
      }
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const response = await api.get(`/billboard/check-ins?${params.toString()}`);
      setCheckIns(response.data);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      setCheckInError('Failed to fetch check-ins. Please try again.');
    } finally {
      setLoadingCheckIns(false);
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
            <p>{existingSecurityCodes.length + securityCodes.length} security code{(existingSecurityCodes.length + securityCodes.length) !== 1 ? 's' : ''} added</p>
            {globalBillboardState?.createdBy && (
              <p className="billboard-created-by">
                Created by {globalBillboardState.createdBy.name} on{' '}
                {globalBillboardState.lastUpdated ? 
                  new Date(globalBillboardState.lastUpdated).toLocaleString() : 
                  'Unknown time'
                }
              </p>
            )}
          </div>
          <div className="active-billboard-actions">
            <button 
              className="btn-primary return-to-billboard"
              onClick={() => navigate('/billboard')}
            >
              Return to Billboard
            </button>
            <button 
              className="btn-secondary clear-billboard"
              onClick={handleClearBillboard}
              style={{ marginLeft: '8px' }}
            >
              Clear Billboard
            </button>
          </div>
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
              onChange={handleEventChange}
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
            {selectedEvent && selectedDate && (
              <button 
                onClick={async () => {
                  const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
                  await setGlobalState(selectedEvent, eventName, [], selectedDate);
                }}
                className="btn-primary"
                style={{ marginTop: '16px' }}
              >
                Set as Active Event
              </button>
            )}
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
              onClick={handleFetchCheckIns}
              disabled={!selectedLocation || loadingCheckIns}
              style={{ marginBottom: '16px' }}
            >
              {loadingCheckIns ? 'Loading...' : 'Fetch Active Check-Ins'}
            </button>

            {checkInError && (
              <div className="error-message" style={{ 
                color: '#dc2626', 
                backgroundColor: '#fee2e2', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                {checkInError}
              </div>
            )}

            {checkIns.length > 0 && (
              <div className="check-ins-list" style={{ 
                marginTop: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Security Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Check-in Time</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map(checkIn => (
                      <tr key={checkIn.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px' }}>{checkIn.name}</td>
                        <td style={{ padding: '12px 16px' }}>{checkIn.securityCode}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {checkIn.checkInTime ? (() => { const d = new Date(checkIn.checkInTime); return isNaN(d.getTime()) ? '' : d.toLocaleString(); })() : ''}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{checkIn.locationName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {checkIns.length === 0 && !loadingCheckIns && !checkInError && selectedLocation && (
              <div style={{ 
                textAlign: 'center', 
                padding: '24px', 
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#6b7280', margin: 0 }}>No active check-ins found for this location.</p>
              </div>
            )}
          </>
        ) : (
          <p className="no-events-message">Select an event to load locations.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;