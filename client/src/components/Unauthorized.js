import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Home as HomeIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

function Unauthorized() {
  const handleLogin = () => {
    window.location.href = `/api/auth/pco`;
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 6, borderRadius: 3 }}>
          <SecurityIcon sx={{ fontSize: 80, color: 'warning.main', mb: 3 }} />
          
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Access Denied
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>
              Insufficient Permissions
            </Typography>
            <Typography variant="body1">
              You don't have the required permissions to access this page. 
              This area is restricted to administrators only.
            </Typography>
          </Alert>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            If you believe you should have access to this page, please contact your system administrator 
            or try logging in with a different account that has the appropriate permissions.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              size="large"
              startIcon={<HomeIcon />}
              sx={{ minWidth: 160 }}
            >
              Go Home
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              sx={{ minWidth: 160 }}
            >
              Login with Different Account
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Unauthorized;