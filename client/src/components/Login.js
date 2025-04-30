// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

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
        const response = await axios.get('http://localhost:3001/api/auth-status');
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
    
    // Redirect to OAuth with rememberMe parameter
    window.location.href = `http://localhost:3001/auth/pco?remember=${rememberMe}`;
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
    <div className="container">
      <div className="pco-logo">
        <img 
          src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
          alt="Logo"
          className="church-logo"
        />
      </div>
      
      <div className="card login-card">
        <h2 className="login-title">Sign in to PCO Arrivals Billboard</h2>
        <p className="login-subtitle">Access your Check-Ins Arrivals Billboard</p>
        
        {error && (
          <div className="login-error">
            <p>{error}</p>
          </div>
        )}
        
        <button className="btn-primary login-button" onClick={handleLogin}>
          <span className="login-button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM11 6V8H15V12H11V14L7 10L11 6ZM9 8V9H5V11H9V12L11 10L9 8Z" fill="currentColor"/>
            </svg>
          </span>
          Sign in with Planning Center
        </button>
        
        <div className="remember-me-container">
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
        
        <div className="login-info">
          <p>You'll be redirected to Planning Center to authorize this application. Only authorized Planning Center users can access this application.</p>
        </div>
      </div>
      
      <div className="login-footer">
        <p>Need access? Please contact your Planning Center administrator.</p>
      </div>
    </div>
  );
}

export default Login;