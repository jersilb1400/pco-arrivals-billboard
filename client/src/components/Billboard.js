import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getHouseholdTheme } from '../utils/colors';
import NavBar from './NavBar';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

function Billboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [arrivals, setArrivals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [user, setUser] = useState(null);
  const [globalBillboardState, setGlobalBillboardState] = useState(null);
  
  // Get data from location state (for backward compatibility) or global state
  const { eventId: locationEventId, securityCodes: locationSecurityCodes, eventName: locationEventName, eventDate: locationEventDate } = location.state || {};
  
  // Use global state if available, otherwise fall back to location state
  const eventId = globalBillboardState?.activeBillboard?.eventId || locationEventId;
  const securityCodes = globalBillboardState?.activeBillboard?.securityCodes || locationSecurityCodes;
  const eventName = globalBillboardState?.activeBillboard?.eventName || locationEventName;
  const eventDate = globalBillboardState?.activeBillboard?.eventDate || locationEventDate;
  
  // Verify user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth-status');
        if (!response.data.authenticated) {
          navigate('/');
        } else {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      }
    };
    
    checkAuthStatus();
  }, [navigate]);

  // Fetch global billboard state
  useEffect(() => {
    const fetchGlobalBillboardState = async () => {
      try {
        const response = await api.get('/global-billboard');
        setGlobalBillboardState(response.data);
      } catch (error) {
        console.error('Error fetching global billboard state:', error);
      }
    };

    fetchGlobalBillboardState();
  }, []);
  
  // Function to refresh the arrival data
  const refreshData = useCallback(async () => {
    if (!eventId || !securityCodes || !securityCodes.length) {
      return;
    }
    
    try {
      const response = await api.post('/security-codes', {
        eventId,
        securityCodes
      });
      
      // Update arrivals with only active check-ins
      setArrivals(response.data.filter(item => !item.error && !item.checkedOut));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      }
    }
  }, [eventId, securityCodes, navigate]);
  
  // Set up auto-refresh of data
  useEffect(() => {
    // Initial state from navigation (for backward compatibility)
    if (location.state?.arrivals) {
      setArrivals(location.state.arrivals);
    }
    
    // Initial data load
    refreshData();
    
    // Set up interval for refreshing data
    const intervalId = setInterval(refreshData, 10000); // Refresh every 10 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [location.state, refreshData]);
  
  // Function to check if the component received proper data
  const hasValidData = () => {
    return eventId && securityCodes && securityCodes.length > 0;
  };
  
  // Navigate back to admin with current session data
  const handleBackToAdmin = () => {
    const activeSecurityCodes = arrivals.map(a => a.securityCode);
    navigate('/admin', {
      state: {
        fromBillboard: true,
        eventId,
        securityCodes,
        eventName,
        eventDate,
        selectedLocation: location.state?.selectedLocation,
        locationName: location.state?.locationName,
        activeSecurityCodes
      }
    });
  };

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_BASE}/auth/pco`;
  };
  
  // Group arrivals by security code and household
  const groupedArrivals = useMemo(() => {
    const groups = {};
    
    arrivals.forEach(arrival => {
      // Create security code group if it doesn't exist
      if (!groups[arrival.securityCode]) {
        groups[arrival.securityCode] = {};
      }
      
      // Get household name
      const householdName = arrival.householdName || `${arrival.lastName} Household`;
      
      // Create household group if it doesn't exist
      if (!groups[arrival.securityCode][householdName]) {
        groups[arrival.securityCode][householdName] = [];
      }
      
      // Add arrival to the appropriate group
      groups[arrival.securityCode][householdName].push(arrival);
    });
    
    return groups;
  }, [arrivals]);
  
  if (!hasValidData()) {
    // Redirect if no data is available
    return (
      <div className="container">
        <div className="card">
          <h2>No Billboard Data Available</h2>
          <p>Please select an event and security codes first.</p>
          <div className="billboard-actions">
            <button className="btn-primary" onClick={() => navigate('/admin')}>
              Return to Admin Panel
            </button>
            {!user && (
              <button className="btn-secondary" onClick={handleLogin}>
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
    }
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleManualRefresh = () => {
    refreshData();
  };
  
  return (
    <div className={`billboard-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && <NavBar currentPage="billboard" />}
      <div className="billboard-header-bar white-bar">
        <div className="billboard-header-bar-left">
          <h1 className="billboard-header-title">
            Check-Ins Arrivals: {eventName}
          </h1>
          <div className="billboard-header-status">
            <div className="last-updated">
              Last updated: {formatTime(lastUpdated)}
            </div>
            <div className="security-code-count">
              Monitoring {securityCodes.length} security code{securityCodes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="billboard-header-bar-right">
          {!isFullscreen && (
            <button className="btn-primary" onClick={handleBackToAdmin} style={{ marginRight: 12 }}>
              ← Back to Admin
            </button>
          )}
          <button className="btn-icon" onClick={handleManualRefresh} title="Refresh Now" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔄 <span style={{fontSize: '1rem', fontWeight: 500}}>Refresh</span>
          </button>
          <button
            className="btn-icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isFullscreen ? '🗕' : '🗖'}
            <span style={{fontSize: '1rem', fontWeight: 500}}>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </span>
          </button>
        </div>
      </div>
      
      <div className="billboard-content">
        {arrivals.length > 0 ? (
          <table className="arrivals-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Household</th>
                <th>Security Code</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedArrivals).map(([securityCode, households]) => (
                <React.Fragment key={securityCode}>
                  <tr className="security-code-header">
                    <td colSpan="5">
                      Security Code: {securityCode}
                    </td>
                  </tr>
                  
                  {Object.entries(households).map(([householdName, householdMembers]) => {
                    const theme = getHouseholdTheme(householdName);
                    return householdMembers.map((arrival, index) => (
                      <tr 
                        key={`${arrival.id}-${index}`}
                        className="household-row"
                        style={{
                          '--household-color': theme.color
                        }}
                      >
                        <td>{arrival.id || '-'}</td>
                        <td>
                          <span className="household-icon">{theme.icon}</span>
                          {arrival.firstName || '-'}
                        </td>
                        <td>{arrival.lastName || '-'}</td>
                        <td>{householdName}</td>
                        <td className="security-code">{securityCode}</td>
                      </tr>
                    ));
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-arrivals">
            <h2>No Arrivals to Display</h2>
            <p>Waiting for check-ins with the selected security codes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Billboard;