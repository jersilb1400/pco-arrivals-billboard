import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, loading } = useSession();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">
          <h2>Loading...</h2>
          <p>Checking authentication status</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!session?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // If admin is required but user is not admin, redirect to unauthorized
  if (requireAdmin && !session?.user?.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and authorized, render the protected component
  return children;
}

export default ProtectedRoute; 