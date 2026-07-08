import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import {
  Container,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

function LocationStatus() {
  const [locations, setLocations] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [globalBillboard, setGlobalBillboard] = useState(null);
  const [locationsSessionKey, setLocationsSessionKey] = useState(null);
  const [notificationsSessionKey, setNotificationsSessionKey] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [isActiveSessionTrusted, setIsActiveSessionTrusted] = useState(false);
  const activeSessionTrustedRef = useRef(false);
  const confirmedSessionKeyRef = useRef(null);
  const globalBillboardRequestIdRef = useRef(0);

  const getSessionKey = useCallback((billboard) => {
    if (!billboard) {
      return null;
    }

    return `${String(billboard.eventId)}|${String(billboard.eventDate || '')}`;
  }, []);

  // Fetch all locations with remaining children
  const fetchLocations = useCallback(async () => {
    try {
      if (!globalBillboard || !isActiveSessionTrusted) {
        setLocations([]);
        setLocationsSessionKey(null);
        return;
      }
      const params = new URLSearchParams();
      params.append('eventId', globalBillboard.eventId);
      if (globalBillboard.eventDate) {
        params.append('date', globalBillboard.eventDate);
      }
      const response = await api.get(`/location-status?${params.toString()}`);
      if (response.status === 429 || !Array.isArray(response.data)) {
        throw new Error('Location status data is unavailable');
      }
      const responseSessionKey = getSessionKey(globalBillboard);
      setLocations(response.data);
      setLocationsSessionKey(responseSessionKey);
      if (activeSessionTrustedRef.current && confirmedSessionKeyRef.current === responseSessionKey) {
        setDataError(null);
      }
    } catch (error) {
      console.error('Error fetching location status:', error);
      setDataError('Location status is temporarily unavailable for the confirmed active event.');
      throw error;
    }
  }, [globalBillboard, getSessionKey, isActiveSessionTrusted]);

  // Fetch active notifications
  const fetchActiveNotifications = useCallback(async () => {
    try {
      if (!globalBillboard || !isActiveSessionTrusted) {
        setActiveNotifications([]);
        setNotificationsSessionKey(null);
        return;
      }

      const response = await api.get('/active-notifications', {
        params: {
          eventId: globalBillboard.eventId,
          eventDate: globalBillboard.eventDate
        }
      });
      if (!Array.isArray(response.data)) {
        throw new Error('Active notifications data is unavailable');
      }
      setActiveNotifications(response.data);
      setNotificationsSessionKey(getSessionKey(globalBillboard));
    } catch (error) {
      console.error('Error fetching active notifications:', error);
    }
  }, [globalBillboard, getSessionKey, isActiveSessionTrusted]);

  // Fetch both location status and active notifications
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLocations(), fetchActiveNotifications()]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchLocations, fetchActiveNotifications]);

  // Initial load
  useEffect(() => {
    if (globalBillboard) {
      fetchAllData();
    }
  }, [globalBillboard, fetchAllData]);

  // Poll every 10 seconds for updates
  useEffect(() => {
    if (!globalBillboard) return;
    const interval = setInterval(fetchAllData, 10000); // Increased from 3 to 10 seconds
    return () => clearInterval(interval);
  }, [globalBillboard, fetchAllData]);

  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      const requestId = globalBillboardRequestIdRef.current + 1;
      globalBillboardRequestIdRef.current = requestId;

      try {
        const response = await api.get('/global-billboard');
        if (requestId !== globalBillboardRequestIdRef.current) {
          return;
        }

        const activeBillboard = response.data.activeBillboard || null;
        const activeSessionKey = getSessionKey(activeBillboard);
        setGlobalBillboard(activeBillboard);
        confirmedSessionKeyRef.current = activeSessionKey;
        activeSessionTrustedRef.current = true;
        setIsActiveSessionTrusted(true);
        if (!activeBillboard) {
          setLocations([]);
          setActiveNotifications([]);
          setLocationsSessionKey(null);
          setNotificationsSessionKey(null);
          confirmedSessionKeyRef.current = null;
          setDataError(null);
          setLoading(false);
        }
      } catch (error) {
        if (requestId !== globalBillboardRequestIdRef.current) {
          return;
        }

        console.error('Error fetching global billboard for location status:', error);
        activeSessionTrustedRef.current = false;
        setIsActiveSessionTrusted(false);
        setDataError('Unable to confirm the active event. Location status is temporarily unavailable.');
        setLoading(false);
      }
    };
    fetchGlobalBillboard();
    const interval = setInterval(fetchGlobalBillboard, 30000); // Increased from 15 to 30 seconds
    return () => clearInterval(interval);
  }, [getSessionKey]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentSessionKey = getSessionKey(globalBillboard);
  const visibleLocations = isActiveSessionTrusted && locationsSessionKey === currentSessionKey ? locations : [];
  const visibleActiveNotifications = isActiveSessionTrusted && notificationsSessionKey === currentSessionKey ? activeNotifications : [];

  // Sort locations by number of children (descending)
  const sortedLocations = [...visibleLocations].sort((a, b) => b.childCount - a.childCount);

  // Removed unused notificationsByLocation variable

  const totalChildrenInCare = visibleLocations.reduce((total, loc) => total + loc.childCount, 0);
  const totalWaitingForPickup = visibleActiveNotifications.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png"
              alt="Logo"
              sx={{ height: 48, width: 'auto', filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' }}
            />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Location Status Overview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                <Chip
                  label={`${totalChildrenInCare} children in care`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {loading ? 'Loading...' : `Last updated: ${formatTime(lastUpdated)}`}
                </Typography>
                {totalWaitingForPickup > 0 && (
                  <Chip
                    label={`${totalWaitingForPickup} waiting for pickup`}
                    color="warning"
                    variant="filled"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllData}
            disabled={loading}
            sx={{ fontWeight: 600 }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      <Card elevation={2} sx={{ borderRadius: 2, mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 3 }}>
            Active Security Codes by Location
          </Typography>
          {dataError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {dataError}
            </Alert>
          )}
          {sortedLocations.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No active security codes.
            </Alert>
          ) : (
            <Grid container columns={12} spacing={3}>
              {sortedLocations.map((location) => (
                <Grid xs={12} md={6} key={location.id}>
                  <Paper elevation={1} sx={{ p: 3, border: '2px solid', borderColor: 'primary.light', borderRadius: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '2rem' }}>
                        {location.name}
                      </Typography>
                      <Chip
                        label={`${location.children.length} code${location.children.length !== 1 ? 's' : ''}`}
                        color="primary"
                        variant="outlined"
                        size="medium"
                        sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {location.children.length > 0 ? (
                      <Box>
                        {location.children.map((child) => (
                          <Box key={child.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                            <Chip
                              label={(child.securityCode && child.securityCode.trim()) ? child.securityCode.toUpperCase() : 'N/A'}
                              color="primary"
                              variant="filled"
                              sx={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '3px', minWidth: 90 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.2rem' }}>
                              {child.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                              ⏰ {formatTime(child.checkInTime)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No active security codes for this location
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default LocationStatus; 