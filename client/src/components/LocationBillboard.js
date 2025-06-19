import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';

function LocationBillboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading: sessionLoading } = useSession();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [authStatus, setAuthStatus] = useState(null);

  // Get data from location.state or query params
  const state = location.state || {};
  const eventId = state.eventId;
  const locationId = state.locationId;
  const locationName = state.locationName;
  const eventName = state.eventName;
  const date = state.date;

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await api.get('/auth-status');
      const newAuthStatus = response.data;
      setAuthStatus(newAuthStatus);
      
      if (!newAuthStatus.authenticated) {
        navigate('/');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
      return false;
    }
  }, [navigate]);

  // Fetch check-ins for the location
  const fetchCheckIns = useCallback(async () => {
    if (!eventId || !locationId || !date) return;
    
    // Check authentication first
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/events/${eventId}/locations/${locationId}/active-checkins`,
        { params: { date } }
      );
      
      // Handle rate limiting response
      if (response.status === 429) {
        console.log('LocationBillboard: Rate limited, skipping check-ins fetch');
        setLoading(false);
        return;
      }
      
      console.log('Received check-ins from backend:', response.data);
      setCheckIns(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch active check-ins for this location.');
    } finally {
      setLoading(false);
    }
  }, [eventId, locationId, date, checkAuthStatus]);

  // Initial setup
  useEffect(() => {
    const initializeComponent = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        await fetchCheckIns();
      }
    };
    
    if (!sessionLoading) {
      initializeComponent();
    }
  }, [sessionLoading, checkAuthStatus, fetchCheckIns]);

  // Set up auto-refresh with authentication checks
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('LocationBillboard: Starting periodic refresh cycle...');
      
      try {
        const isAuthenticated = await checkAuthStatus();
        console.log('LocationBillboard: Authentication check result:', isAuthenticated);
        
        if (isAuthenticated) {
          console.log('LocationBillboard: User authenticated, fetching check-ins...');
          await fetchCheckIns();
          console.log('LocationBillboard: Refresh cycle completed');
        } else {
          console.log('LocationBillboard: User not authenticated, skipping refresh');
        }
      } catch (error) {
        console.error('LocationBillboard: Error during refresh cycle:', error);
        // Don't throw the error, just log it and continue
      }
    }, 300000); // Increased from 120 seconds to 300 seconds (5 minutes) to reduce API calls further
    
    return () => clearInterval(interval);
  }, [checkAuthStatus, fetchCheckIns]);

  // Back to admin, preserve selection
  const handleBack = () => {
    navigate('/admin', {
      state: {
        eventId,
        selectedLocation: locationId,
        locationName,
        eventName,
        fromLocationBillboard: true,
        securityCodes: state.securityCodes || [],
        existingSecurityCodes: state.existingSecurityCodes || [],
        selectedDate: date
      }
    });
  };

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
    <div className="billboard-container">
      <NavBar currentPage="location-billboard" />
      <div className="billboard-header">
        <div className="billboard-title">
          <div className="billboard-logo">
            <img 
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
              alt="Logo"
              className="church-logo-billboard"
            />
            <h1>Active Check-Ins: {locationName || 'Location'}{eventName ? ` (${eventName})` : ''}</h1>
          </div>
          <div className="billboard-status">
            <div className="last-updated">
              {loading ? 'Updating...' : `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
            {error && <div className="refresh-error">{error}</div>}
            <div className="security-code-count">
              Monitoring {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
            </div>
            {authStatus?.user && (
              <div className="user-info" style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                Logged in as: {authStatus.user.name}
              </div>
            )}
          </div>
        </div>
        <div className="billboard-controls">
          <button className="btn-primary" onClick={handleBack} style={{ marginRight: 8 }}>
            ← Back to Admin
          </button>
          <button className="btn-icon" onClick={fetchCheckIns} title="Refresh Now">
            🔄
          </button>
        </div>
      </div>
      <div className="billboard-content">
        {checkIns.length > 0 ? (
          <table className="arrivals-table">
            <thead>
              <tr>
                <th>Security Code</th>
                <th>Name</th>
                <th>Check-In Time</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map(ci => (
                <tr key={ci.id}>
                  <td style={{ fontWeight: 700, color: '#6db56d', fontSize: 22 }}>{ci.security_code || '-'}</td>
                  <td style={{ fontWeight: 700, color: '#2e77bb' }}>{ci.name || '-'}</td>
                  <td>{ci.created_at ? new Date(ci.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>{ci.location_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : loading ? (
          <div className="no-arrivals">
            <h2>Loading...</h2>
            <p>Fetching active check-ins for this location.</p>
          </div>
        ) : (
          <div className="no-arrivals">
            <h2>No Active Check-Ins</h2>
            <p>There are currently no active check-ins for this location.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationBillboard; 