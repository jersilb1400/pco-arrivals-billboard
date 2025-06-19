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

  // Simple polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchActiveNotifications, 30000);
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
          <div className="notifications-grid">
            {activeNotifications.map((notification) => (
              <div key={notification.id} className="notification-card">
                <div className="security-code-display">
                  {notification.securityCode}
                </div>
                <div className="child-info">
                  <div className="child-name">
                    {notification.childName}
                  </div>
                  <div className="location-info">
                    📍 {notification.locationName}
                  </div>
                  <div className="notification-time">
                    ⏰ Requested at: {formatTime(notification.notifiedAt)}
                  </div>
                </div>
                <div className="pickup-instructions" style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#856404',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  🚶‍♀️ Please bring to pickup area
                </div>
              </div>
            ))}
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