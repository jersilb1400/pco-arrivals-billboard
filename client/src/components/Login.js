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
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true' || false
  );
  const navigate = useNavigate();
  const { session, loading } = useSession();

  // Handle authentication status changes
  useEffect(() => {
    if (!loading && session) {
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
  }, [session, loading, navigate]);

  const handleLogin = () => {
    // Save rememberMe preference to localStorage
    localStorage.setItem('rememberMe', rememberMe);

    // Detect mobile device for enhanced debugging
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Mobile login attempt:', { isMobile, userAgent: navigator.userAgent.substring(0, 100) + '...' });

    // Redirect to your server's OAuth endpoint using the API base URL
    const apiBase = process.env.REACT_APP_API_BASE || 'https://pco-arrivals-billboard.onrender.com/api';
    const loginUrl = `${apiBase}/auth/pco?remember=${rememberMe}&prompt=login&mobile=${isMobile}`;
    
    console.log('🔐 Redirecting to login URL:', loginUrl);
    window.location.href = loginUrl;
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  // Show loading while SessionContext is checking authentication
  if (loading) {
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