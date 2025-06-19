import React, { useState } from 'react';
import api from '../utils/api';

function SecurityCodeEntry() {
  const [securityCode, setSecurityCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!securityCode.trim()) {
      setMessage('Please enter a security code');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/security-code-entry', {
        securityCode: securityCode.trim().toUpperCase()
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

  return (
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
            <li>Parent arrives and gives you their security code</li>
            <li>Enter the security code above</li>
            <li>Child's name will appear on the pickup billboard</li>
            <li>Pickup volunteers will bring the child to the pickup area</li>
            <li>Once checked out, the notification will be removed</li>
          </ol>
        </div>

        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3'
        }}>
          <strong style={{ color: '#1976d2' }}>Quick Links:</strong>
          <div style={{ marginTop: '10px' }}>
            <a 
              href="/billboard" 
              style={{ 
                color: '#1976d2', 
                textDecoration: 'none', 
                marginRight: '20px',
                fontWeight: '500'
              }}
            >
              📺 View Pickup Billboard
            </a>
            <a 
              href="/location-status" 
              style={{ 
                color: '#1976d2', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              📍 View Location Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityCodeEntry; 