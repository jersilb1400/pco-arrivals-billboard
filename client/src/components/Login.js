import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

function Login() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true' || false
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth-status');
        if (response.data.authenticated) {
          if (response.data.user?.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/unauthorized');
          }
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthStatus('unauthenticated');
        setError('Failed to connect to server. Please try again.');
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleLogin = () => {
    // Save rememberMe preference to localStorage
    localStorage.setItem('rememberMe', rememberMe);

    // Redirect to your server's OAuth endpoint using the API base URL
    const apiBase = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:3001/api';
    window.location.href = `${apiBase}/auth/pco?remember=${rememberMe}&prompt=login`;
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  if (authStatus === 'checking') {
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
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pco-logo" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <img 
          src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
          alt="Logo"
          className="church-logo"
          style={{ display: 'block', margin: '0 auto' }}
        />
      </div>
      <div className="card login-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 400 }}>
        <h2 className="login-title" style={{ textAlign: 'center' }}>Sign in to PCO Arrivals Billboard</h2>
        {/* <p className="login-subtitle">Access your Check-Ins Arrivals Billboard</p> */}
        {error && (
          <div className="login-error">
            <p>{error}</p>
          </div>
        )}
        <button className="btn-primary login-button" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
          <span className="login-button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM11 6V8H15V12H11V14L7 10L11 6ZM9 8V9H5V11H9V12L11 10L9 8Z" fill="currentColor"/>
            </svg>
          </span>
          Sign in with Planning Center
        </button>
        <div className="remember-me-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <label className="remember-me-label">
            <input 
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeChange}
              className="remember-me-checkbox"
            />
            <span className="remember-me-text">Remember me for 30 days</span>
          </label>
        </div>
        <div className="login-info" style={{ textAlign: 'center' }}>
          <p>You'll be redirected to Planning Center to authorize this application. Only authorized Planning Center users can access this application.</p>
        </div>
      </div>
      <div className="login-footer" style={{ width: '100%', textAlign: 'center', marginTop: 24 }}>
        <p>Need access? Please contact your Planning Center administrator.</p>
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Login with Different Account
        </button>
      </div>
    </div>
  );
}

export default Login;