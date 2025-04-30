import React from 'react';
// Remove the unused Link import

function Unauthorized() {
  const handleLogout = () => {
    window.location.href = 'http://localhost:3001/auth/logout';
  };

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
        <h2>Access Denied</h2>
        <p>You don't have permission to access this application. Please contact your administrator if you believe this is an error.</p>
        
        <div className="unauthorized-actions">
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
          <button onClick={handleLogin} className="btn-primary">
            Login with Different Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;