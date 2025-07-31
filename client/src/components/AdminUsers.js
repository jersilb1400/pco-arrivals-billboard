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
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormHelperText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
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
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  
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

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || ''
    });
    setEditError(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    
    setEditLoading(true);
    setEditError(null);
    
    console.log('[DEBUG] Submitting edit for user:', editingUser.id);
    console.log('[DEBUG] Edit form data:', editFormData);
    
    try {
      // Update the user in the backend
      const response = await api.put(`/admin/users/${editingUser.id}`, {
        name: editFormData.name,
        email: editFormData.email
      });
      
      console.log('[DEBUG] Server response:', response.data);
      
      // Update the user in the local state using the response data
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? response.data
          : user
      ));
      
      console.log('[DEBUG] Updated local users state');
      
      // Close dialog and show success message
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({ name: '', email: '' });
      setSuccessMessage('User updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Failed to update user:', error);
      setEditError(error.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditFormData({ name: '', email: '' });
    setEditError(null);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <NavBar user={currentUser} currentPage="users" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading user data...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <NavBar user={currentUser} currentPage="users" />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
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
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Add New User
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new authorized user to access the application
          </Typography>
          
          <Box component="form" onSubmit={handleAddUser}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
              <TextField
                label="Planning Center User ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="e.g. 12345678"
                required
                fullWidth
                helperText="The numeric ID from the user's PCO account"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="User Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. John Smith"
                fullWidth
                helperText="Optional: For your reference only"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="User Email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                fullWidth
                helperText="Optional: For your reference only"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ minWidth: 120 }}
            >
              Add User
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2">
              Authorized Users
            </Typography>
            <TextField
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
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
                      sx={user.id === currentUser?.id ? { backgroundColor: 'primary.light' } : {}}
                    >
                      <TableCell>
                        <Chip 
                          label={user.id} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {user.name || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {user.email || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => handleEditUser(user)}
                            color="primary"
                            size="small"
                            title="Edit user details"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={user.id === currentUser?.id}
                            color="error"
                            size="small"
                            title={user.id === currentUser?.id ? "You cannot remove your own account" : "Remove user"}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No users found matching your search.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
            Edit User Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              User ID: <Chip label={editingUser?.id} size="small" variant="outlined" />
            </Typography>
            
            <TextField
              label="User Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="e.g. John Smith"
              fullWidth
              sx={{ mb: 3 }}
              helperText="Optional: For your reference only"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="User Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              placeholder="e.g. john@example.com"
              fullWidth
              helperText="Optional: For your reference only"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleEditCancel}
            startIcon={<CancelIcon />}
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            startIcon={editLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminUsers;