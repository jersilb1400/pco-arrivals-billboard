import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function SecurityCodeEntry() {
  const [securityCode, setSecurityCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [globalBillboard, setGlobalBillboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll global billboard state every 15 seconds
  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        console.log('SecurityCodeEntry: Fetching global billboard state...');
        const response = await api.get('/global-billboard');
        console.log('SecurityCodeEntry: Global billboard response:', response.data);
        setGlobalBillboard(response.data.activeBillboard || null);
      } catch (error) {
        console.error('SecurityCodeEntry: Error fetching global billboard:', error);
        setGlobalBillboard(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGlobalBillboard();
    const interval = setInterval(fetchGlobalBillboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!securityCode.trim()) {
      setMessage('Please enter a security code');
      setMessageType('error');
      return;
    }
    if (!globalBillboard) {
      setMessage('No active event selected. Please contact an admin.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/security-code-entry', {
        securityCode: securityCode.trim().toUpperCase(),
        eventId: globalBillboard.eventId,
        eventDate: globalBillboard.eventDate
      });

      if (response.data.success) {
        setMessage(`Success! ${response.data.childName} has been added to the pickup list.`);
        setMessageType('success');
        setSecurityCode('');
      } else {
        setMessage(response.data.message || 'Security code not found');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error submitting security code:', error);
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update menu links to include eventId and eventDate as query params
  const eventId = globalBillboard?.eventId;
  const eventDate = globalBillboard?.eventDate;
  const menuSuffix = eventId && eventDate ? `?eventId=${eventId}&eventDate=${eventDate}` : '';

  return (
    <div>
      {/* Navigation Menu */}
      <nav style={{
        backgroundColor: '#2e77bb',
        padding: '15px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px'
        }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            PCO Arrivals System
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a 
              href={`/billboard${menuSuffix}`} 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              📺 Pickup Billboard
            </a>
            <a 
              href={`/location-status${menuSuffix}`} 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              📍 Location Status
            </a>
            <a 
              href={`/admin${menuSuffix}`} 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              ⚙️ Admin Panel
            </a>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img 
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
              alt="Church Logo"
              style={{ width: '200px', height: 'auto', marginBottom: '20px' }}
            />
            <h1 style={{ color: '#2e77bb', marginBottom: '10px' }}>Volunteer Check-In Station</h1>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              Enter the security code from a parent to notify pickup volunteers
            </p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '20px' }}>
                Loading system status...
              </div>
            </div>
          ) : !globalBillboard ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '1.2rem', color: '#856404', marginBottom: '15px' }}>
                ⚠️ No Active Event Selected
              </div>
              <div style={{ fontSize: '1rem', color: '#856404', marginBottom: '20px' }}>
                An administrator needs to select an event and security codes before volunteers can enter security codes.
              </div>
              <a 
                href="/admin" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#2e77bb',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1a5fa0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2e77bb'}
              >
                Go to Admin Panel
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="securityCode" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Security Code from Parent:
                </label>
                <input
                  type="text"
                  id="securityCode"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value.toUpperCase())}
                  placeholder="Enter security code (e.g., A1B2)"
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '18px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                  maxLength="6"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {message && (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                  color: messageType === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !securityCode.trim()}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '18px',
                  backgroundColor: isSubmitting ? '#ccc' : '#2e77bb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {isSubmitting ? 'Processing...' : 'Add to Pickup List'}
              </button>
            </form>
          )}

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>How it works:</h3>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Parents receive a security code when checking in their child</li>
              <li>When parents arrive for pickup, they give the security code to a volunteer</li>
              <li>Volunteers enter the security code here to notify pickup staff</li>
              <li>The child's name appears on the pickup billboard for staff to see</li>
              <li>Once the child is picked up, they are removed from the system</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityCodeEntry; 