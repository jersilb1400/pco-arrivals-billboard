// src/components/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import NavBar from './NavBar';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get current user info
        const userResponse = await api.get('/user-info');
        setCurrentUser(userResponse.data);
        
        // Get authorized users list
        const response = await api.get('/admin/users');
        setUsers(response.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/');
        } else {
          setError('Failed to load users. Please try again.');
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUserId) {
      setError('Planning Center User ID is required');
      return;
    }
    
    try {
      const response = await api.post('/admin/users', {
        userId: newUserId,
        name: newUserName,
        email: newUserEmail
      });
      
      // Add new user to the list
      setUsers([...users, response.data]);
      
      // Clear form
      setNewUserId('');
      setNewUserName('');
      setNewUserEmail('');
      
      // Show success message
      setSuccessMessage('User added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Failed to add user:', error);
      setError(error.response?.data?.message || 'Failed to add user. Please try again.');
    }
  };

  const handleRemoveUser = async (userId) => {
    // Don't allow removing yourself
    if (userId === currentUser?.id) {
      setError("You cannot remove your own account");
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`);
      
      // Remove user from the list
      setUsers(users.filter(user => user.id !== userId));
      
      // Show success message
      setSuccessMessage('User removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Failed to remove user:', error);
      setError('Failed to remove user. Please try again.');
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container">
        <NavBar user={currentUser} currentPage="users" />
        <div className="loading-message">
          <h2>Loading...</h2>
          <p>Fetching user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <NavBar user={currentUser} currentPage="users" />
      
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage authorized users for the PCO Arrivals Billboard application</p>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="error-dismiss"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="success-dismiss"
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="admin-section">
        <div className="card">
          <h2>Add New User</h2>
          <p className="section-subtitle">Add a new authorized user to access the application</p>
          
          <form onSubmit={handleAddUser} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userId">Planning Center User ID <span className="required">*</span></label>
                <input 
                  type="text"
                  id="userId"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="text-input"
                  placeholder="e.g. 12345678"
                  required
                />
                <small className="form-help">The numeric ID from the user's PCO account</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="userName">User Name</label>
                <input 
                  type="text"
                  id="userName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="text-input"
                  placeholder="e.g. John Smith"
                />
                <small className="form-help">Optional: For your reference only</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="userEmail">User Email</label>
                <input 
                  type="email"
                  id="userEmail"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="text-input"
                  placeholder="e.g. john@example.com"
                />
                <small className="form-help">Optional: For your reference only</small>
              </div>
            </div>
            
            <button type="submit" className="btn-primary">
              Add User
            </button>
          </form>
        </div>
      </div>
      
      <div className="admin-section">
        <div className="card">
          <div className="card-header-with-actions">
            <h2>Authorized Users</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="users-table-container">
            {filteredUsers.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className={user.id === currentUser?.id ? 'current-user-row' : ''}>
                      <td>{user.id}</td>
                      <td>{user.name || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleRemoveUser(user.id)}
                          className="btn-danger btn-sm"
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? "You cannot remove your own account" : "Remove user"}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;