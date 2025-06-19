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
  const [authStatus, setAuthStatus] = useState(null);
  
  // Get data from location state (for backward compatibility) or global state
  const { eventId: locationEventId, securityCodes: locationSecurityCodes, eventName: locationEventName, eventDate: locationEventDate } = location.state || {};
  
  // Use global state if available, otherwise fall back to location state
  const eventId = globalBillboardState?.activeBillboard?.eventId || locationEventId;
  const securityCodes = globalBillboardState?.activeBillboard?.securityCodes || locationSecurityCodes;
  const eventName = globalBillboardState?.activeBillboard?.eventName || locationEventName;
  const eventDate = globalBillboardState?.activeBillboard?.eventDate || locationEventDate;
  
  // Verify user is authenticated and check auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await api.get('/auth-status');
      const newAuthStatus = response.data;
      setAuthStatus(newAuthStatus);
      
      if (!newAuthStatus.authenticated) {
        navigate('/');
        return false;
      } else {
        setUser(newAuthStatus.user);
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
      return false;
    }
  }, [navigate]);

  // Fetch global billboard state
  const fetchGlobalBillboardState = useCallback(async () => {
    try {
      const response = await api.get('/global-billboard');
      setGlobalBillboardState(response.data);
    } catch (error) {
      console.error('Error fetching global billboard state:', error);
    }
  }, []);

  // Check for billboard updates
  const checkBillboardUpdates = useCallback(async () => {
    try {
      const response = await api.get('/billboard-updates', {
        params: {
          lastUpdate: globalBillboardState?.lastUpdated,
          eventId: eventId
        }
      });
      
      const { hasUpdates, lastUpdated, activeBillboard } = response.data;
      
      if (hasUpdates && activeBillboard) {
        console.log('Billboard updates detected, refreshing data...');
        setGlobalBillboardState({ activeBillboard, lastUpdated });
        await refreshData();
      }
    } catch (error) {
      console.error('Error checking billboard updates:', error);
    }
  }, [globalBillboardState?.lastUpdated, eventId, refreshData]);
  
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
  
  // Initial setup and authentication check
  useEffect(() => {
    const initializeComponent = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        await fetchGlobalBillboardState();
        
        // Initial state from navigation (for backward compatibility)
        if (location.state?.arrivals) {
          setArrivals(location.state.arrivals);
        }
        
        // Initial data load
        await refreshData();
      }
    };
    
    initializeComponent();
  }, [checkAuthStatus, fetchGlobalBillboardState, refreshData, location.state]);
  
  // Set up auto-refresh of data and auth status
  useEffect(() => {
    const intervalId = setInterval(async () => {
      console.log('Billboard: Starting periodic refresh cycle...');
      
      // Check auth status first
      const isAuthenticated = await checkAuthStatus();
      console.log('Billboard: Authentication check result:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('Billboard: User authenticated, checking for updates...');
        
        // Check for billboard updates from other users
        await checkBillboardUpdates();
        // Also refresh global billboard state to detect changes from other users
        await fetchGlobalBillboardState();
        // Refresh arrival data
        await refreshData();
        
        console.log('Billboard: Refresh cycle completed');
      } else {
        console.log('Billboard: User not authenticated, skipping refresh');
      }
    }, 10000); // Refresh every 10 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [checkAuthStatus, checkBillboardUpdates, fetchGlobalBillboardState, refreshData]);
  
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
            {authStatus?.user && (
              <div className="user-info" style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                Logged in as: {authStatus.user.name}
              </div>
            )}
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
        {Object.keys(groupedArrivals).length > 0 ? (
          Object.entries(groupedArrivals).map(([securityCode, households]) => (
            <div key={securityCode} className="security-code-section">
              <h2 className="security-code-header" style={{ color: getHouseholdTheme(securityCode) }}>
                Security Code: {securityCode}
              </h2>
              {Object.entries(households).map(([householdName, householdArrivals]) => (
                <div key={householdName} className="household-section">
                  <h3 className="household-name">{householdName}</h3>
                  <div className="arrivals-grid">
                    {householdArrivals.map((arrival, index) => (
                      <div key={index} className="arrival-card">
                        <div className="arrival-name">
                          {arrival.firstName} {arrival.lastName}
                        </div>
                        <div className="arrival-time">
                          {arrival.checkInTime ? 
                            new Date(arrival.checkInTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : 
                            'Time not available'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
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