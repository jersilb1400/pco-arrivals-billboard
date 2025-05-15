import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';

function AuthorizedUsers() {
  const { session, loading } = useSession();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!session?.authenticated || !session?.user?.isAdmin)) {
      navigate('/');
      return;
    }

    axios.get('http://localhost:3001/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]));
  }, [session, loading, navigate]);

  const handleRemoveUser = (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    axios.delete(`http://localhost:3001/api/admin/users/${userId}`)
      .then(() => setUsers(users.filter(user => user.id !== userId)))
      .catch(() => alert('Failed to remove user.'));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.id.toString().includes(searchTerm) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="container">
      <NavBar currentPage="users" user={session?.user} />
      <div className="users-table-container">
        <h2>Authorized Users</h2>
        <input
          className="user-search-input"
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name || <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td>{user.email || <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuthorizedUsers; 