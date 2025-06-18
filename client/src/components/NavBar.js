// src/components/NavBar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function NavBar({
  currentPage,
  selectedEvent,
  selectedEventName,
  selectedDate,
  securityCodes = [],
  existingSecurityCodes = []
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();

  // Prefer props, but fall back to location.state if not provided
  const eventId = selectedEvent || location.state?.eventId;
  const eventName = selectedEventName || location.state?.eventName;
  const eventDate = selectedDate || location.state?.selectedDate;
  const codes = securityCodes.length ? securityCodes : (location.state?.securityCodes || []);
  const existingCodes = existingSecurityCodes.length ? existingSecurityCodes : (location.state?.existingSecurityCodes || []);
  const user = session?.user;

  const handleLogout = () => {
    window.location.href = `/api/auth/logout`;
  };
  
  const handleLogin = () => {
    window.location.href = `/api/auth/pco`;
  };

  // Custom handler for Dashboard to preserve state
  const handleDashboardClick = (e) => {
    e.preventDefault();
    navigate('/admin', {
      state: {
        eventId,
        eventName,
        selectedDate: eventDate,
        securityCodes: codes,
        existingSecurityCodes: existingCodes,
        selectedLocation: location.state?.selectedLocation,
        locationName: location.state?.locationName,
        fromNav: true // Add this flag to indicate navigation from navbar
      }
    });
  };

  // Debug: Uncomment to check what props are being received
  // console.log('NavBar props:', { user, currentPage, selectedEvent, selectedEventName });

  return (
    <div className="navbar custom-navbar">
      <div className="navbar-left">
        <img 
          src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
          alt="Logo"
          className="navbar-logo"
        />
        <span className="navbar-title">
          PCO Arrivals Billboard
        </span>
      </div>
      <div className="navbar-center">
        {user && (
          <a
            href="/admin"
            onClick={handleDashboardClick}
            className={`navbar-link ${currentPage === 'admin' ? 'active' : ''}`}
          >
            Dashboard
          </a>
        )}
        {user?.isAdmin && (
          <Link 
            to="/admin/users" 
            className={`navbar-link ${currentPage === 'users' ? 'active' : ''}`}
            state={{
              eventId,
              eventName,
              selectedDate: eventDate,
              securityCodes: codes,
              existingSecurityCodes: existingCodes,
              fromNav: true
            }}
          >
            User Management
          </Link>
        )}
      </div>
      <div className="navbar-right">
        {user ? (
          <div className="user-info user-info-vertical">
            {user.avatar && (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="user-avatar"
              />
            )}
            <span className="user-name">{user.name}</span>
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