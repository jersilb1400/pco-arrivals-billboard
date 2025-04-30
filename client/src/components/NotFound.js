import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/pco';
  };

  return (
    <div className="container">
      <div className="pco-logo">
        <img 
          src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png" 
          alt="Logo"
          className="church-logo"
        />
      </div>
      
      <div className="card error-container">
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>    
        
        <div className="not-found-actions">
          <Link to="/" className="btn-secondary">
            Go to Home
          </Link>
          <button onClick={handleLogin} className="btn-primary">
            Login to Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;