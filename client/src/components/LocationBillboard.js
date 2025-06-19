import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function LocationBillboard() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch all locations with remaining children
  const fetchLocations = async () => {
    try {
      const response = await api.get('/location-status');
      setLocations(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching location status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, []);

  // Simple polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Sort locations by number of children (descending)
  const sortedLocations = [...locations].sort((a, b) => b.childCount - a.childCount);

  return (
    <div className="billboard-container">
      <div className="billboard-header">
        <div className="billboard-title">
          <div className="billboard-logo">
            <img 
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
              alt="Logo"
              className="church-logo-billboard"
            />
            <h1>Location Status Overview</h1>
          </div>
          <div className="billboard-status">
            <div className="last-updated">
              {loading ? 'Loading...' : `Last updated: ${formatTime(lastUpdated)}`}
            </div>
            <div className="total-children">
              {locations.reduce((total, loc) => total + loc.childCount, 0)} total children in care
            </div>
          </div>
        </div>
        <div className="billboard-controls">
          <button 
            className="btn-icon" 
            onClick={fetchLocations} 
            title="Refresh Now"
            disabled={loading}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="billboard-content">
        {loading ? (
          <div className="loading-message">
            <h2>Loading location status...</h2>
          </div>
        ) : sortedLocations.length > 0 ? (
          <div className="locations-grid">
            {sortedLocations.map((location) => (
              <div key={location.id} className="location-card">
                <div className="location-header">
                  <h2 className="location-name">{location.name}</h2>
                  <div className="child-count-badge">
                    {location.childCount} child{location.childCount !== 1 ? 'ren' : ''}
                  </div>
                </div>
                
                {location.childCount > 0 ? (
                  <div className="children-list">
                    {location.children.map((child) => (
                      <div key={child.id} className="child-item">
                        <div className="child-info">
                          <span className="child-name">{child.name}</span>
                          <span className="checkin-time">
                            ⏰ {formatTime(child.checkInTime)}
                          </span>
                        </div>
                        <div className="security-code">
                          {child.securityCode}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-children">
                    <p>No children currently in this location</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-locations">
            <h2>No Active Locations</h2>
            <p>No children are currently checked in to any locations.</p>
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '30px auto 0'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Location Status Instructions:</h3>
        <div style={{ textAlign: 'left', fontSize: '14px', color: '#666' }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>This page shows all locations with children currently checked in</li>
            <li>Locations are sorted by number of children (most first)</li>
            <li>When parents arrive, children will appear on the pickup billboard</li>
            <li>Once checked out, children will be removed from both displays</li>
            <li>Data refreshes automatically every 30 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LocationBillboard; 