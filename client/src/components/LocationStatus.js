import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function LocationStatus() {
  const [locations, setLocations] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [globalBillboard, setGlobalBillboard] = useState(null);

  // Fetch all locations with remaining children
  const fetchLocations = async () => {
    try {
      if (!globalBillboard) return;
      const params = new URLSearchParams();
      params.append('eventId', globalBillboard.eventId);
      if (globalBillboard.eventDate) {
        params.append('date', globalBillboard.eventDate);
      }
      const response = await api.get(`/location-status?${params.toString()}`);
      console.log('LocationStatus: Received location data:', response.data);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching location status:', error);
    }
  };

  // Fetch active notifications
  const fetchActiveNotifications = async () => {
    try {
      const response = await api.get('/active-notifications');
      console.log('LocationStatus: Received active notifications:', response.data);
      setActiveNotifications(response.data);
    } catch (error) {
      console.error('Error fetching active notifications:', error);
    }
  };

  // Fetch both location status and active notifications
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLocations(), fetchActiveNotifications()]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (globalBillboard) {
      fetchAllData();
    }
  }, [globalBillboard]);

  // Poll every 10 seconds for faster updates
  useEffect(() => {
    if (!globalBillboard) return;
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [globalBillboard]);

  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        const response = await api.get('/global-billboard');
        setGlobalBillboard(response.data.activeBillboard || null);
      } catch (error) {
        setGlobalBillboard(null);
      }
    };
    fetchGlobalBillboard();
    const interval = setInterval(fetchGlobalBillboard, 15000);
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

  // Group active notifications by location
  const notificationsByLocation = activeNotifications.reduce((acc, notification) => {
    const locationName = notification.locationName || 'Unknown Location';
    if (!acc[locationName]) {
      acc[locationName] = [];
    }
    acc[locationName].push(notification);
    return acc;
  }, {});

  const totalChildrenInCare = locations.reduce((total, loc) => total + loc.childCount, 0);
  const totalWaitingForPickup = activeNotifications.length;

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
              <div style={{ marginBottom: '4px' }}>
                {totalChildrenInCare} children in care
              </div>
              {totalWaitingForPickup > 0 && (
                <div style={{ color: '#f39c12', fontWeight: '600' }}>
                  {totalWaitingForPickup} waiting for pickup
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="billboard-controls">
          <button 
            className="btn-icon" 
            onClick={fetchAllData} 
            title="Refresh Now"
            disabled={loading}
          >
            🔄
          </button>
        </div>
      </div>

      {/* New section: Active Security Codes by Location */}
      <div className="active-security-codes-section" style={{ margin: '32px 0' }}>
        <h2 style={{ color: '#2e77bb', fontSize: '1.7rem', marginBottom: '18px' }}>Active Security Codes by Location</h2>
        {sortedLocations.length === 0 ? (
          <div style={{ color: '#888', fontSize: '1.1rem', marginBottom: '18px' }}>No active security codes.</div>
        ) : (
          <div className="locations-grid">
            {sortedLocations.map((location) => (
              <div key={location.id} className="location-card" style={{ background: '#f8f9fa', border: '2px solid #e0e7ef', marginBottom: '18px' }}>
                <div className="location-header">
                  <h3 className="location-name" style={{ color: '#2e77bb', fontSize: '2.2rem', fontWeight: 900 }}>
                    {location.name}
                  </h3>
                  <div className="child-count-badge" style={{ background: '#e0e7ef', color: '#2e77bb' }}>
                    {location.children.length} code{location.children.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {location.children.length > 0 ? (
                  <div className="children-list">
                    {location.children.map((child) => (
                      <div key={child.id} className="child-item" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '8px 0' }}>
                        <span
                          className="security-code"
                          style={{
                            fontWeight: 900,
                            color: '#2e77bb',
                            background: 'none',
                            fontSize: '2rem',
                            letterSpacing: '3px',
                            minWidth: '90px',
                            borderRadius: 0,
                            padding: 0,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            boxShadow: 'none',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            lineHeight: '1.2',
                            border: 'none',
                            zIndex: 2,
                            position: 'relative',
                            marginRight: '10px',
                          }}
                        >
                          {(child.securityCode && child.securityCode.trim()) ? child.securityCode.toUpperCase() : 'N/A'}
                        </span>
                        <span className="child-name" style={{ fontSize: '2rem', color: '#333', fontWeight: 700 }}>
                          {child.name}
                        </span>
                        <span className="checkin-time" style={{ color: '#888', fontSize: '0.95rem', marginLeft: 'auto' }}>
                          ⏰ {formatTime(child.checkInTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-children" style={{ color: '#aaa', fontSize: '1rem' }}>
                    No active security codes for this location
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting for Pickup section (active notifications) */}
      {Object.keys(notificationsByLocation).length > 0 && (
        <div className="waiting-for-pickup-section" style={{ margin: '32px 0' }}>
          <h2 style={{ color: '#f39c12', fontSize: '1.5rem', marginBottom: '18px' }}>Waiting for Pickup</h2>
          <div className="locations-grid">
            {Object.entries(notificationsByLocation).map(([locationName, notifications]) => (
              <div key={`notification-${locationName}`} className="location-card notification-card">
                <div className="location-header">
                  <h2 className="location-name">{locationName} - Waiting for Pickup</h2>
                  <div className="child-count-badge pickup-badge">
                    {notifications.length} waiting
                  </div>
                </div>
                <div className="children-list">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="child-item pickup-item">
                      <div className="child-info">
                        <span className="child-name">{notification.childName}</span>
                        <span className="checkin-time">
                          📢 {formatTime(notification.notifiedAt)}
                        </span>
                      </div>
                      <div className="security-code">
                        {notification.securityCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <li>Children waiting for pickup are highlighted in orange</li>
            <li>Volunteers will check out children directly in PCO</li>
            <li>Once checked out in PCO, children will be removed from both displays</li>
            <li>Data refreshes automatically every 10 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LocationStatus; 