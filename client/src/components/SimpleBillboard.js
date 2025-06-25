import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function SimpleBillboard() {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active notifications
  const fetchActiveNotifications = async () => {
    try {
      const response = await api.get('/active-notifications');
      console.log('SimpleBillboard: Received notifications:', response.data);
      setActiveNotifications(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActiveNotifications();
  }, []);

  // Polling every 10 seconds for faster updates
  useEffect(() => {
    const interval = setInterval(fetchActiveNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
            <h1>Child Pickup Requests</h1>
          </div>
          <div className="billboard-status">
            <div className="last-updated">
              {isLoading ? 'Loading...' : `Last updated: ${formatTime(lastUpdated)}`}
            </div>
            <div className="notification-count">
              {activeNotifications.length} child{activeNotifications.length !== 1 ? 'ren' : ''} ready for pickup
            </div>
          </div>
        </div>
        <div className="billboard-controls">
          <button 
            className="btn-icon" 
            onClick={fetchActiveNotifications} 
            title="Refresh Now"
            disabled={isLoading}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="billboard-content">
        {isLoading ? (
          <div className="loading-message">
            <h2>Loading pickup requests...</h2>
          </div>
        ) : activeNotifications.length > 0 ? (
          <div className="locations-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            {(() => {
              // Group notifications by location
              const locationGroups = {};
              activeNotifications.forEach(notification => {
                const loc = notification.locationName || 'Unknown Location';
                if (!locationGroups[loc]) locationGroups[loc] = [];
                locationGroups[loc].push(notification);
              });
              return Object.entries(locationGroups).map(([locationName, notifications]) => (
                <div key={locationName} style={{ width: '100%' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2e77bb', marginBottom: '1.2rem', letterSpacing: '1px', textAlign: 'left', borderBottom: '3px solid #2e77bb', paddingBottom: '0.5rem' }}>
                    {locationName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.map((notification, idx) => (
                      <div key={notification.id + '-' + idx} className="notification-card" style={{
                        background: '#fff',
                        border: '3px solid #e0e7ef',
                        borderRadius: '16px',
                        boxShadow: '0 4px 16px rgba(46,119,187,0.08)',
                        padding: '1.2rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '80px',
                        width: '100%',
                        gap: '2rem',
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#101828', flex: 1, textAlign: 'left' }}>
                          {notification.childName}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2e77bb', flex: 1, textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}>
                          {notification.securityCode}
                        </div>
                        <div style={{ fontSize: '2rem', color: '#888', fontWeight: 500, flex: 1, textAlign: 'right' }}>
                          {notification.notifiedAt ? formatTime(notification.notifiedAt) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="no-notifications">
            <h2>No Active Pickup Requests</h2>
            <p>Waiting for parents to arrive...</p>
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              maxWidth: '400px',
              margin: '20px auto 0'
            }}>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Instructions for Volunteers:</h3>
              <ol style={{ margin: 0, paddingLeft: '20px', textAlign: 'left' }}>
                <li>When a card appears above, find the child</li>
                <li>Bring them to the pickup area</li>
                <li>Check them out in PCO</li>
                <li>Card will automatically disappear</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleBillboard; 