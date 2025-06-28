// src/components/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
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
  const [addingUser, setAddingUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching user info...');
        // Get current user info
        const userResponse = await api.get('/user-info');
        console.log('User info response:', userResponse.data);
        setCurrentUser(userResponse.data);
        
        console.log('Fetching authorized users...');
        // Get authorized users list
        console.log('Making API call to /admin/users...');
        const response = await api.get('/admin/users');
        console.log('Authorized users response:', response.data);
        setUsers(response.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication error, redirecting to home...');
          navigate('/');
        } else {
          setError(`Failed to load users: ${error.response?.data?.message || error.message}`);
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
      setAddingUser(true);
      setError(null);
      
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
    } finally {
      setAddingUser(false);
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
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <NavBar user={currentUser} currentPage="users" />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="h5" color="text.secondary">
              Loading...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fetching user data
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar user={currentUser} currentPage="users" />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            User Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage authorized users for the PCO Arrivals Billboard application
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        
        {/* Add New User Section */}
        <Card sx={{ mb: 4, borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <AddIcon color="primary" />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                Add New User
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add a new authorized user to access the application
            </Typography>
            
            <Box component="form" onSubmit={handleAddUser} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  label="Planning Center User ID"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. 12345678"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="The numeric ID from the user's PCO account"
                />
                
                <TextField
                  label="User Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. John Smith"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Optional: For your reference only"
                />
                
                <TextField
                  label="User Email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Optional: For your reference only"
                />
              </Box>
              
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={addingUser || !newUserId}
                sx={{ alignSelf: 'flex-start' }}
              >
                {addingUser ? 'Adding...' : 'Add User'}
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        {/* Authorized Users Section */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Authorized Users ({users.length})
                </Typography>
              </Box>
              
              <TextField
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            {filteredUsers.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow 
                        key={user.id} 
                        sx={user.id === currentUser?.id ? { bgcolor: 'action.hover' } : {}}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.id}
                            {user.id === currentUser?.id && (
                              <Chip label="You" size="small" color="primary" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={user.id === currentUser?.id}
                            color="error"
                            title={user.id === currentUser?.id ? "You cannot remove your own account" : "Remove user"}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {searchQuery ? 'No users found matching your search.' : 'No authorized users found.'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default AdminUsers;