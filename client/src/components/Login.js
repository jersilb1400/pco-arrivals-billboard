import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSession } from '../context/SessionContext';
import api from '../utils/api';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

function Login() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { session, checkSession } = useSession();

  // Handle authentication status changes
  useEffect(() => {
    if (session) {
      console.log('🔐 Login component: Session status changed:', {
        authenticated: session.authenticated,
        user: session.user?.name,
        isAdmin: session.user?.isAdmin
      });
      
      if (session.authenticated) {
        if (session.user?.isAdmin) {
          console.log('🔐 Login component: Redirecting to admin');
          navigate('/admin');
        } else {
          console.log('🔐 Login component: Redirecting to unauthorized');
          navigate('/unauthorized');
        }
      } else {
        console.log('🔐 Login component: User not authenticated, showing login form');
      }
    }
  }, [session, navigate]);

  const handleLogin = async () => {
    if (!userId.trim()) {
      setError('Please enter your User ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with User ID:', userId);
      
      // Call the simple login endpoint
      const response = await api.get(`/auth/login?userId=${encodeURIComponent(userId)}`);
      
      if (response.data.success) {
        console.log('🔐 Login successful:', response.data.user);
        
        // Store authentication data in localStorage
        localStorage.setItem('pco_api_key', response.data.apiKey);
        localStorage.setItem('pco_user_id', response.data.user.id);
        
        // Check session to update the context
        await checkSession();
        
        // Navigate to admin
        navigate('/admin');
      } else {
        setError('Login failed. Please check your User ID.');
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      if (error.response?.status === 403) {
        setError('User not authorized. Please contact your administrator.');
      } else if (error.response?.status === 400) {
        setError('Please enter a valid User ID.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Logging in...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png"
            alt="Logo"
            sx={{
              height: 120,
              width: 'auto',
              maxWidth: '100%',
              filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
            }}
          />
        </Box>

        {/* Login Card */}
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
              Enter your User ID to access the PCO Arrivals Billboard
            </Typography>

            {error && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="body2" color="error.contrastText">
                  {error}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                User ID
              </Typography>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your User ID"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              disabled={loading || !userId.trim()}
              sx={{
                py: 1.5,
                mb: 3,
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Only authorized users can access this application. 
              Contact your administrator if you need access.
            </Typography>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Need access? Please contact your administrator.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            size="small"
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;