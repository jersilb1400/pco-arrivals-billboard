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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
      
      // Handle rate limiting response
      if (response.status === 429) {
        console.log('Billboard: Rate limited, skipping update check');
        return false; // Indicate no updates
      }
      
      const { hasUpdates, lastUpdated, activeBillboard } = response.data;
      
      if (hasUpdates && activeBillboard) {
        console.log('Billboard updates detected, updating state...');
        setGlobalBillboardState({ activeBillboard, lastUpdated });
        return true; // Indicate updates were found
      }
      return false; // No updates
    } catch (error) {
      console.error('Error checking billboard updates:', error);
      return false;
    }
  }, [globalBillboardState?.lastUpdated, eventId]);

  // Function to refresh the arrival data
  const refreshData = useCallback(async () => {
    if (!eventId || isRefreshing) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Build query parameters for event-specific notifications
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      if (eventDate) params.append('eventDate', eventDate);
      
      const response = await api.get(`/active-notifications?${params.toString()}`);
      
      // Handle rate limiting response
      if (response.status === 429) {
        console.log('Billboard: Rate limited, skipping data refresh');
        return;
      }
      
      // Update arrivals with active notifications
      const newArrivals = response.data.map(notification => ({
        id: notification.id,
        firstName: notification.childName.split(' ')[0] || 'Unknown',
        lastName: notification.childName.split(' ').slice(1).join(' ') || 'Unknown',
        childName: notification.childName,
        securityCode: notification.securityCode,
        locationName: notification.locationName,
        checkInTime: notification.checkInTime,
        notifiedAt: notification.notifiedAt,
        householdName: notification.childName.split(' ').slice(1).join(' ') + ' Household'
      }));
      
      // Only update state if data actually changed
      setArrivals(prevArrivals => {
        const prevIds = new Set(prevArrivals.map(a => a.id));
        const newIds = new Set(newArrivals.map(a => a.id));
        
        // Check if arrays are different
        if (prevArrivals.length !== newArrivals.length) {
          return newArrivals;
        }
        
        // Check if any IDs are different
        for (const id of newIds) {
          if (!prevIds.has(id)) {
            return newArrivals;
          }
        }
        
        // Data is the same, don't update
        return prevArrivals;
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId, eventDate, navigate, isRefreshing]);
  
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
      
      try {
        // Check auth status first
        const isAuthenticated = await checkAuthStatus();
        console.log('Billboard: Authentication check result:', isAuthenticated);
        
        if (isAuthenticated) {
          console.log('Billboard: User authenticated, checking for updates...');
          
          // Check for billboard updates from other users
          const hasUpdates = await checkBillboardUpdates();
          
          // Only refresh data if there were updates or if it's been a while
          const shouldRefreshData = hasUpdates || 
            !lastUpdated || 
            (Date.now() - lastUpdated.getTime()) > 300000; // 5 minutes
          
          if (shouldRefreshData) {
            console.log('Billboard: Refreshing arrival data...');
            await refreshData();
          } else {
            console.log('Billboard: Skipping data refresh (no updates needed)');
          }
          
          console.log('Billboard: Refresh cycle completed');
        } else {
          console.log('Billboard: User not authenticated, skipping refresh');
        }
      } catch (error) {
        console.error('Billboard: Error during refresh cycle:', error);
        // Don't throw the error, just log it and continue
      }
    }, 10000); // 10 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [checkAuthStatus, checkBillboardUpdates, refreshData, lastUpdated]);
  
  // Function to check if the component received proper data
  const hasValidData = () => {
    // If there is no activeBillboard in global state, show a message
    if (!globalBillboardState?.activeBillboard) return false;
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
  
  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        const response = await api.get('/global-billboard');
        if (response.data.activeBillboard) {
          // If eventId, eventDate, or securityCodes changed, refresh arrivals
          const newBillboard = response.data.activeBillboard;
          if (
            newBillboard.eventId !== eventId ||
            newBillboard.eventDate !== eventDate ||
            JSON.stringify(newBillboard.securityCodes) !== JSON.stringify(securityCodes)
          ) {
            setGlobalBillboardState(response.data);
            await refreshData();
          }
        }
      } catch (error) {}
    };
    fetchGlobalBillboard();
    const interval = setInterval(fetchGlobalBillboard, 5000);
    return () => clearInterval(interval);
  }, [eventId, eventDate, securityCodes, refreshData]);
  
  if (!globalBillboardState?.activeBillboard) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Active Event</h2>
          <p>The active event has been cleared by an admin. Please wait for a new event to be set.</p>
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
          <button 
            className="btn-icon" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            title={isRefreshing ? "Refreshing..." : "Refresh Now"} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              opacity: isRefreshing ? 0.6 : 1,
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
          >
            {isRefreshing ? '⏳' : '🔄'} 
            <span style={{fontSize: '1rem', fontWeight: 500}}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
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
        {isRefreshing && (
          <div className="refreshing-indicator" style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            ⏳ Refreshing data...
          </div>
        )}
        
        {Object.keys(groupedArrivals).length > 0 ? (
          <div className="locations-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginTop: '2rem', alignItems: 'flex-start' }}>
            {(() => {
              // Group arrivals by location
              const locationGroups = {};
              Object.values(groupedArrivals).flatMap(households =>
                Object.values(households).forEach(arrivalsArr => {
                  arrivalsArr.forEach(arrival => {
                    const loc = arrival.locationName || 'Unknown Location';
                    if (!locationGroups[loc]) locationGroups[loc] = [];
                    locationGroups[loc].push(arrival);
                  });
                })
              );
              return Object.entries(locationGroups).map(([locationName, arrivals]) => (
                <div key={locationName} style={{ minWidth: 420, flex: 1, maxWidth: 600 }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2e77bb', marginBottom: '1.2rem', letterSpacing: '1px', textAlign: 'left', borderBottom: '3px solid #2e77bb', paddingBottom: '0.5rem' }}>
                    {locationName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {arrivals.map((arrival, idx) => (
                      <div key={arrival.id + '-' + idx} className="arrival-card" style={{
                        background: '#fff',
                        border: '3px solid #e0e7ef',
                        borderRadius: '16px',
                        boxShadow: '0 4px 16px rgba(46,119,187,0.08)',
                        padding: '1.2rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '90px',
                        maxWidth: 540,
                        width: '100%',
                        gap: '2.2rem',
                      }}>
                        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#101828', flex: 2, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {arrival.childName}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2e77bb', flex: 1, textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}>
                          {arrival.securityCode}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#888', fontWeight: 500, flex: 1, textAlign: 'right' }}>
                          {arrival.notifiedAt ? `@ ${new Date(arrival.notifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
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