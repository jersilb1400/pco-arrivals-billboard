import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../utils/api';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

function Login() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true' || false
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth-status');
        if (response.data.authenticated) {
          if (response.data.user?.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/unauthorized');
          }
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthStatus('unauthenticated');
        setError('Failed to connect to server. Please try again.');
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleLogin = () => {
    // Save rememberMe preference to localStorage
    localStorage.setItem('rememberMe', rememberMe);

    // Redirect to your server's OAuth endpoint using the API base URL
    const apiBase = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:3001/api';
    window.location.href = `${apiBase}/auth/pco?remember=${rememberMe}&prompt=login`;
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  if (authStatus === 'checking') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Checking authentication status...
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
              Sign in to access your PCO Arrivals Billboard
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              sx={{
                py: 1.5,
                mb: 3,
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Sign in with Planning Center
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  color="primary"
                />
              }
              label="Remember me for 30 days"
              sx={{ mb: 3 }}
            />

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              You'll be redirected to Planning Center to authorize this application. 
              Only authorized Planning Center users can access this application.
            </Typography>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Need access? Please contact your Planning Center administrator.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            size="small"
          >
            Login with Different Account
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;