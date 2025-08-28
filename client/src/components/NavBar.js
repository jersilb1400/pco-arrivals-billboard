// src/components/NavBar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  Container,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useSession } from '../context/SessionContext';

function NavBar({
  currentPage,
  selectedEvent,
  selectedEventName,
  selectedDate,
  securityCodes = [],
  existingSecurityCodes = []
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useSession();

  // Prefer props, but fall back to location.state if not provided
  const eventId = selectedEvent || location.state?.eventId;
  const eventName = selectedEventName || location.state?.eventName;
  const eventDate = selectedDate || location.state?.selectedDate;
  const codes = securityCodes.length ? securityCodes : (location.state?.securityCodes || []);
  const existingCodes = existingSecurityCodes.length ? existingSecurityCodes : (location.state?.existingSecurityCodes || []);
  const user = session?.user;

  const handleLogout = async () => {
    try {
      // Clear frontend session state immediately
      setSession({ authenticated: false, user: null });
      
      // Show logout feedback
      console.log('🚪 Logging out user...');
      
      // Redirect to logout endpoint which will handle server-side cleanup
      const redirectTo = `${window.location.origin}/login`;
      window.location.href = `/api/auth/logout?redirectTo=${encodeURIComponent(redirectTo)}`;
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: still redirect to logout endpoint
      const redirectTo = `${window.location.origin}/login`;
      window.location.href = `/api/auth/logout?redirectTo=${encodeURIComponent(redirectTo)}`;
    }
  };
  
  const handleLogin = () => {
    window.location.href = `/api/auth/pco`;
  };

  // Custom handler for Dashboard to preserve state
  const handleDashboardClick = (e) => {
    e.preventDefault();
    navigate('/admin', {
      state: {
        eventId,
        eventName,
        selectedDate: eventDate,
        securityCodes: codes,
        existingSecurityCodes: existingCodes,
        selectedLocation: location.state?.selectedLocation,
        locationName: location.state?.locationName,
        fromNav: true
      }
    });
  };

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ px: { xs: 0 } }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png"
              alt="Logo"
              sx={{
                height: 40,
                width: 'auto',
                mr: 2,
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              PCO Arrivals Billboard
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {user && (
              <Button
                component="a"
                href="/admin"
                onClick={handleDashboardClick}
                startIcon={<DashboardIcon />}
                sx={{
                  color: currentPage === 'admin' ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                  }
                }}
              >
                Dashboard
              </Button>
            )}
            {user?.isAdmin && (
              <Button
                component={Link}
                to="/admin/users"
                startIcon={<PeopleIcon />}
                state={{
                  eventId,
                  eventName,
                  selectedDate: eventDate,
                  securityCodes: codes,
                  existingSecurityCodes: existingCodes,
                  fromNav: true
                }}
                sx={{
                  color: currentPage === 'users' ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                  }
                }}
              >
                User Management
              </Button>
            )}
          </Box>

          {/* User Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
            {user ? (
              <>
                {/* Active Billboard Status */}
                {eventName && (
                  <Chip
                    label={`Active: ${eventName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ display: { xs: 'none', lg: 'flex' } }}
                  />
                )}
                
                {/* User Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={user.avatar}
                    sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                  >
                    {user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                  >
                    {user.name}
                  </Typography>
                  <IconButton
                    onClick={handleLogout}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    title="Logout"
                  >
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                sx={{ fontWeight: 500 }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default NavBar;