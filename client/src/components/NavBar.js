// src/components/NavBar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ user, currentPage }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    window.location.href = 'http://localhost:3001/auth/logout';
  };
  
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/pco';
  };
  
  return (
    <div className="navbar">
      <div className="navbar-brand">
        <img 
          src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
          alt="Logo"
          className="navbar-logo"
        />
        <span className="navbar-title">PCO Arrivals Billboard</span>
      </div>
      
      <div className="navbar-nav">
        <Link 
          to="/admin" 
          className={`navbar-link ${currentPage === 'admin' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        {user?.isAdmin && (
          <Link 
            to="/admin/users" 
            className={`navbar-link ${currentPage === 'users' ? 'active' : ''}`}
          >
            User Management
          </Link>
        )}
      </div>
      
      <div className="navbar-actions">
        {user ? (
          <div className="navbar-user">
            <div className="user-info">
              {user.avatar && (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user.name}</span>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="btn-logout"
              title="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin} 
            className="btn-login"
            title="Login with Planning Center"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}

export default NavBar;