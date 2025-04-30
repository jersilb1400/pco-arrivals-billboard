import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

function Billboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [arrivals, setArrivals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Get data from location state
  const { eventId, securityCodes, eventName, eventDate } = location.state || {};
  
  // Verify user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/auth-status');
        if (!response.data.authenticated || !response.data.user?.isAdmin) {
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
  
  // Function to refresh the arrival data
  const refreshData = useCallback(async () => {
    if (!eventId || !securityCodes || !securityCodes.length) {
      return;
    }
    
    try {
      setRefreshing(true);
      const response = await axios.post('http://localhost:3001/api/security-codes', {
        eventId,
        securityCodes
      });
      
      // Update arrivals with only active check-ins
      setArrivals(response.data.filter(item => !item.error && !item.checkedOut));
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      } else {
        setError('Error refreshing data. Will retry automatically.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [eventId, securityCodes, navigate]);
  
  // Set up auto-refresh of data
  useEffect(() => {
    // Initial state from navigation
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
    navigate('/admin', {
      state: {
        fromBillboard: true,
        eventId,
        securityCodes,
        eventName,
        eventDate
      }
    });
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/pco';
  };
  
  const handleLogout = () => {
    window.location.href = 'http://localhost:3001/auth/logout';
  };
  
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
  
  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day, 12, 0, 0);
        
        if (isNaN(date.getTime())) {
          return 'Invalid date';
        }
        
        return date.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      // For other date formats
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  };
  
  // Force manual refresh of data
  const handleManualRefresh = () => {
    refreshData();
  };
  
  return (
    <div className={`billboard-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="billboard-header">
        <div className="billboard-title">
          <div className="billboard-logo">
            <img 
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
              alt="Logo"
              className="church-logo-billboard"
            />
            <h1>Check-Ins Arrivals: {eventName}</h1>
          </div>
          {eventDate && (
            <div className="event-date">
              {formatDateForDisplay(eventDate)}
            </div>
          )}
          <div className="billboard-status">
            <div className="last-updated">
              {refreshing ? 'Updating...' : `Last updated: ${formatTime(lastUpdated)}`}
            </div>
            {error && <div className="refresh-error">{error}</div>}
            <div className="security-code-count">
              Monitoring {securityCodes.length} security code{securityCodes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="billboard-top-bar">
          {/* User info in the top bar */}
          {user && (
            <div className="billboard-user-info">
              <span className="user-name">{user.name}</span>
              <button 
                className="btn-logout-light" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
          
          {/* Control buttons */}
          <div className="billboard-controls">
            <button className="btn-icon" onClick={handleManualRefresh} title="Refresh Now">
              🔄
            </button>
            <button className="btn-icon" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? '🗕' : '🗖'}
            </button>
            <button className="btn-icon" onClick={handleBackToAdmin} title="Back to Admin">
              ⚙️
            </button>
          </div>
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
                <th>Event</th>
                <th>Security Code</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map(arrival => (
                <tr key={arrival.id || arrival.securityCode}>
                  <td>{arrival.id || '-'}</td>
                  <td>{arrival.firstName || '-'}</td>
                  <td>{arrival.lastName || '-'}</td>
                  <td>{arrival.eventName || '-'}</td>
                  <td>{arrival.securityCode}</td>
                </tr>
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