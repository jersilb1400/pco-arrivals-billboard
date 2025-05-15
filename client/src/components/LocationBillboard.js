import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';

axios.defaults.withCredentials = true;

function LocationBillboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading: sessionLoading } = useSession();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Get data from location.state or query params
  const state = location.state || {};
  const eventId = state.eventId;
  const locationId = state.locationId;
  const locationName = state.locationName;
  const eventName = state.eventName;

  // Fetch check-ins for the location
  const fetchCheckIns = useCallback(async () => {
    if (!eventId || !locationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:3001/api/events/${eventId}/locations/${locationId}/active-checkins`);
      setCheckIns(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch active check-ins for this location.');
    } finally {
      setLoading(false);
    }
  }, [eventId, locationId]);

  useEffect(() => {
    fetchCheckIns();
    const interval = setInterval(fetchCheckIns, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchCheckIns]);

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
        existingSecurityCodes: state.existingSecurityCodes || []
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
                <th>ID</th>
                <th>Security Code</th>
                <th>Name</th>
                <th>Check-In Time</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map(ci => (
                <tr key={ci.id}>
                  <td>{ci.id}</td>
                  <td style={{ fontWeight: 700, color: '#6db56d', fontSize: 22 }}>{ci.security_code || '-'}</td>
                  <td style={{ fontWeight: 700, color: '#2e77bb' }}>{ci.name || '-'}</td>
                  <td>{ci.created_at ? new Date(ci.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
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