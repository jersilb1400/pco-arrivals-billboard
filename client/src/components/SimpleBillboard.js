import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ChildCare as ChildIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import api from '../utils/api';

function SimpleBillboard() {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active notifications
  const fetchActiveNotifications = async () => {
    try {
      const response = await api.get('/active-notifications');
      console.log('SimpleBillboard: Received notifications:', response.data);
      setActiveNotifications(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActiveNotifications();
  }, []);

  // Polling every 10 seconds for faster updates
  useEffect(() => {
    const interval = setInterval(fetchActiveNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Group notifications by location
  const locationGroups = {};
  activeNotifications.forEach(notification => {
    const loc = notification.locationName || 'Unknown Location';
    if (!locationGroups[loc]) locationGroups[loc] = [];
    locationGroups[loc].push(notification);
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png"
              alt="Logo"
              sx={{
                height: 48,
                width: 'auto',
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Child Pickup Requests
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                <Chip
                  icon={<ChildIcon />}
                  label={`${activeNotifications.length} child${activeNotifications.length !== 1 ? 'ren' : ''} ready for pickup`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {isLoading ? 'Loading...' : `Last updated: ${formatTime(lastUpdated)}`}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton
            onClick={fetchActiveNotifications}
            disabled={isLoading}
            size="large"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading pickup requests...
            </Typography>
          </Box>
        </Box>
      ) : activeNotifications.length > 0 ? (
        <Grid container spacing={3}>
          {Object.entries(locationGroups).map(([locationName, notifications]) => (
            <Grid item xs={12} key={locationName}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <LocationIcon color="primary" />
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {locationName}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {notifications.map((notification, idx) => (
                      <Grid item xs={12} key={notification.id + '-' + idx}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            border: '2px solid',
                            borderColor: 'primary.light',
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 3,
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                              <ChildIcon color="primary" sx={{ fontSize: 32 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {notification.childName}
                              </Typography>
                            </Box>
                            
                            <Chip
                              label={notification.securityCode}
                              color="primary"
                              variant="filled"
                              sx={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                px: 2,
                                py: 1,
                                minWidth: 120,
                              }}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <ScheduleIcon color="action" />
                              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {notification.notifiedAt ? formatTime(notification.notifiedAt) : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <ChildIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              No Active Pickup Requests
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Waiting for parents to arrive...
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, maxWidth: 500, mx: 'auto', bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Instructions for Volunteers:
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 3, textAlign: 'left' }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  When a card appears above, find the child
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Bring them to the pickup area
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Check them out in PCO
                </Typography>
                <Typography component="li" variant="body2">
                  Card will automatically disappear
                </Typography>
              </Box>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default SimpleBillboard; 