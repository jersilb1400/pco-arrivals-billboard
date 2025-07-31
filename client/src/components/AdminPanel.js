import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Launch as LaunchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  List as ListIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import NavBar from './NavBar';
import { useSession } from '../context/SessionContext';
import DateInput from './DateInput';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

function AdminPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [displayDate, setDisplayDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodes, setSecurityCodes] = useState([]);
  const [existingSecurityCodes, setExistingSecurityCodes] = useState([]);
  const [activeBillboard, setActiveBillboard] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [globalBillboardState, setGlobalBillboardState] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  // Removed unused notification state variables
  const [isAddingSecurityCode, setIsAddingSecurityCode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isManualChange, setIsManualChange] = useState(false);

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      navigate('/');
    }
  }, [session, sessionLoading, navigate]);

  // Fetch global billboard state when user navigates to this page
  useEffect(() => {
    if (session?.authenticated) {
      const fetchGlobalBillboard = async () => {
        try {
          const response = await api.get('/global-billboard');
          setGlobalBillboardState(response.data);
          console.log('AdminPanel: Fetched global billboard state on navigation:', response.data);
          
          // Sync with global state if there's an active billboard
          if (response.data?.activeBillboard) {
            syncWithGlobalBillboard(response.data);
          }
        } catch (error) {
          console.error('AdminPanel: Error fetching global billboard state:', error);
        }
      };
      
      fetchGlobalBillboard();
    }
  }, [session?.authenticated]);

  // Helper to sync local state with global billboard
  const syncWithGlobalBillboard = useCallback((global) => {
    console.log('AdminPanel: syncWithGlobalBillboard called with:', global);
    if (global?.activeBillboard) {
      console.log('AdminPanel: Syncing with active billboard:', global.activeBillboard);
      setActiveBillboard(global.activeBillboard);
      setSelectedEvent(global.activeBillboard.eventId);
      setSelectedDate(global.activeBillboard.eventDate || getTodayDate());
      setExistingSecurityCodes(global.activeBillboard.securityCodes || []);
    } else {
      console.log('AdminPanel: No active billboard - preserving user selections');
      setActiveBillboard(null);
      // Don't clear selectedEvent or selectedDate when there's no active billboard
      // This prevents losing user selections during normal operation
      console.log('AdminPanel: Preserving selectedEvent and selectedDate - no active billboard');
      setExistingSecurityCodes([]);
    }
  }, []);

  // Fetch global billboard state on mount and when returning from another page
  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        const response = await api.get('/global-billboard');
        setGlobalBillboardState(response.data);
        // Only sync if not adding a security code and not in manual change mode
        // Also don't sync if user has selected an event but no billboard is active
        const hasUserSelections = selectedEvent && !globalBillboardState?.activeBillboard;
        if (!isAddingSecurityCode && !isManualChange && !hasUserSelections) {
          console.log('AdminPanel: Syncing with global billboard state:', response.data);
          syncWithGlobalBillboard(response.data);
        } else {
          console.log('AdminPanel: Skipping global sync - isAddingSecurityCode:', isAddingSecurityCode, 'isManualChange:', isManualChange, 'hasUserSelections:', hasUserSelections);
        }
      } catch (error) {
        setGlobalBillboardState(null);
        if (!isManualChange) {
          console.log('AdminPanel: Clearing local state due to global billboard error');
          syncWithGlobalBillboard({}); // Ensure local state is cleared
        } else {
          console.log('AdminPanel: Skipping local state clear - manual change in progress');
        }
      }
    };
    
    if (session?.authenticated) {
      fetchGlobalBillboard();
      
      // Set up polling for global billboard updates
      const interval = setInterval(fetchGlobalBillboard, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [session, isAddingSecurityCode, isManualChange]);

  // Update display date whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(formatSelectedDateForDisplay(selectedDate));
    }
  }, [selectedDate]);

  // Restore state from navigation
  useEffect(() => {
    if (location.state) {
      const { eventId, selectedDate, securityCodes, existingSecurityCodes, fromNav, selectedLocation, activeSecurityCodes } = location.state;
      if (eventId) setSelectedEvent(eventId);
      if (selectedDate) setSelectedDate(selectedDate);
      if (securityCodes) setSecurityCodes(securityCodes);
      if (existingSecurityCodes) setExistingSecurityCodes(existingSecurityCodes);
      if (selectedLocation) setSelectedLocation(selectedLocation);
      // If coming back from Billboard, filter codes to only those still active
      if (activeSecurityCodes) {
        setSecurityCodes(prev => prev.filter(code => activeSecurityCodes.includes(code)));
        setExistingSecurityCodes(prev => prev.filter(code => activeSecurityCodes.includes(code)));
      }
      // If coming from navbar navigation, update active billboard
      if (fromNav && eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          setActiveBillboard({
            eventId,
            eventName: event.attributes.name,
            securityCodes: existingSecurityCodes || []
          });
        }
      }
    }
  }, [location.state, events]);

  // Check for existing billboard session from navigation state
  useEffect(() => {
    if (location.state?.fromBillboard) {
      const { eventId, securityCodes, eventName, eventDate } = location.state;
      if (eventDate) {
        setSelectedDate(eventDate);
        setDisplayDate(formatSelectedDateForDisplay(eventDate));
      } else {
        const today = getTodayDate();
        setSelectedDate(today);
        setDisplayDate(formatSelectedDateForDisplay(today));
      }
      setExistingSecurityCodes(securityCodes || []);
      setActiveBillboard({
        eventId,
        eventName,
        securityCodes: securityCodes || []
      });
    }
  }, [location.state]);

  // Fetch events for the selected date
  useEffect(() => {
    const fetchEventsByDate = async () => {
      try {
        setDateLoading(true);
        const dateForApi = selectedDate;
        console.log('AdminPanel: Fetching events for date:', dateForApi);
        
        const response = await api.get(`/events-by-date?date=${dateForApi}`);
        
        // Handle rate limiting response
        if (response.status === 429) {
          console.log('AdminPanel: Rate limited, skipping events fetch');
          setDateLoading(false);
          return;
        }
        
        console.log('AdminPanel: Events response:', response.data);
        setEvents(response.data);
        
        if (location.state?.fromBillboard && location.state?.eventId) {
          const eventExists = response.data.some(event => event.id === location.state.eventId);
          if (eventExists) {
            setSelectedEvent(location.state.eventId);
          } else {
            setSelectedEvent('');
          }
        }
        setDateLoading(false);
        
        // Don't reset manual change flag here - keep it active until user launches billboard
        console.log('AdminPanel: Events loaded successfully, keeping manual change flag active');
      } catch (error) {
        console.error('Error fetching events:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config
        });
        
        if (error.response?.status === 401) {
          navigate('/');
        } else {
          setDateLoading(false);
          // Set empty events array on error to prevent UI issues
          setEvents([]);
          // Show user-friendly error message
          setSnackbarMsg(`Failed to fetch events for ${selectedDate}. Please try again.`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    };
    if (selectedDate) {
      fetchEventsByDate();
    }
  }, [selectedDate, navigate, location.state]);

  // Fetch locations when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent) {
      setLocations([]);
      setSelectedLocation('');
      return;
    }
    const fetchLocations = async () => {
      try {
        const response = await api.get(`/events/${selectedEvent}/locations`);
        
        // Handle rate limiting response
        if (response.status === 429) {
          console.log('AdminPanel: Rate limited, skipping locations fetch');
          return;
        }
        
        setLocations(response.data);
        setSelectedLocation('');
      } catch (err) {
        console.error('Error fetching locations:', err);
        setLocations([]);
        setSelectedLocation('');
      }
    };
    fetchLocations();
  }, [selectedEvent]);

  // Function to set global billboard state
  const setGlobalState = async (eventId, eventName, securityCodes = [], eventDate) => {
    if (eventId && eventName) {
      try {
        console.log('AdminPanel: Setting global state:', { eventId, eventName, securityCodes, eventDate });
        const response = await api.post('/set-global-billboard', {
          eventId: eventId,
          eventName: eventName,
          securityCodes: securityCodes,
          eventDate: eventDate
        });
        
        console.log('AdminPanel: Global state response:', response.data);
        
        setActiveBillboard({
          eventId,
          eventName,
          securityCodes: securityCodes
        });
        
        console.log('AdminPanel: Global state set successfully');
        
        // Show success message
        setSnackbarMsg(`Active event set to: ${eventName}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error setting global state:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // Show user-friendly error message
        setSnackbarMsg('Failed to set active event. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    console.log('AdminPanel: Date changed to:', newDate);
    console.log('AdminPanel: Event target:', e.target);
    console.log('AdminPanel: Event type:', e.type);
    
    // Validate date format
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      console.error('AdminPanel: Invalid date format:', newDate);
      setSnackbarMsg('Invalid date format. Please select a valid date.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    console.log('AdminPanel: Setting manual change flag to true for date change');
    setIsManualChange(true);
    setSelectedDate(newDate);
    setSelectedEvent('');
    setSecurityCodes([]);
    setExistingSecurityCodes([]);
    setActiveBillboard(null);
    
    // Show loading message
    setSnackbarMsg(`Loading events for ${formatSelectedDateForDisplay(newDate)}...`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    // Keep manual change flag active until events are loaded
    // The flag will be reset when events are successfully loaded
  };

  const handleEventChange = async (e) => {
    const eventId = e.target.value;
    console.log('AdminPanel: Event changed to:', eventId);
    console.log('AdminPanel: Current selectedDate before event change:', selectedDate);
    console.log('AdminPanel: Setting manual change flag to true for event change');
    setIsManualChange(true);
    setSelectedEvent(eventId);
    setSecurityCodes([]);
    setExistingSecurityCodes([]);
    setActiveBillboard(null);
    
    // Preserve the selected date when changing events
    console.log('AdminPanel: Preserving selected date:', selectedDate);
    
    // Don't automatically set global state when changing events
    // Global state should only be set when launching the billboard
    
    // Keep manual change flag active - user is actively making changes
  };

  const handleAddSecurityCode = async () => {
    if (!securityCode.trim() || !selectedEvent) return;
    
    const code = securityCode.trim().toUpperCase();
    if (securityCodes.includes(code) || existingSecurityCodes.includes(code)) {
      return;
    }
    setSecurityCodes(prev => [...prev, code]);
    setSecurityCode('');

    setIsAddingSecurityCode(true);
    // Also trigger a pickup notification for the billboard
    try {
      const response = await api.post('/security-code-entry', {
        securityCode: code,
        eventId: selectedEvent,
        eventDate: selectedDate
      });
      let nameString = response.data.childName;
      if (!nameString && response.data.addedChildren) {
        nameString = response.data.addedChildren.map(c => c.childName).join(', ');
      }
      if (nameString) {
        setSnackbarMsg(`Success! ${nameString} has been added to the pickup list.`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMsg(response.data.message || 'Pickup notification sent!');
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error triggering pickup notification from admin:', error);
      setSnackbarMsg('Failed to trigger pickup notification.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // Allow global state sync again after 2 seconds
      setTimeout(() => setIsAddingSecurityCode(false), 2000);
    }
  };

  // Removed unused handleRemoveSecurityCode function

  const handleRemoveExistingCode = async (codeToRemove) => {
    setExistingSecurityCodes(prev => prev.filter(code => code !== codeToRemove));
  };

  const handleLaunchBillboard = async () => {
    if (!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)) {
      return;
    }
    
    const event = events.find(e => e.id === selectedEvent);
    if (!event) return;
    
    const allCodes = [...existingSecurityCodes, ...securityCodes];
    await setGlobalState(selectedEvent, event.attributes.name, allCodes, selectedDate);
    
    // Reset manual change flag when launching billboard
    setIsManualChange(false);
    
    navigate('/billboard', {
      state: {
        eventId: selectedEvent,
        eventName: event.attributes.name,
        securityCodes: allCodes,
        eventDate: selectedDate,
        fromAdmin: true
      }
    });
  };

  const handleClearBillboard = async () => {
    try {
      await api.post('/clear-global-billboard');
      setActiveBillboard(null);
      setGlobalBillboardState(null);
    } catch (error) {
      console.error('Error clearing billboard:', error);
    }
  };

  // Add this function to handle the DELETE request
  const handleDeleteGlobalBillboard = async () => {
    try {
      await api.delete('/global-billboard');
      setActiveBillboard(null);
      setGlobalBillboardState(null);
      setSelectedEvent('');
      setSelectedDate('');
      setDisplayDate('');
      setSecurityCodes([]);
      setExistingSecurityCodes([]);
      setActiveNotifications([]); // Clear pickup notifications
      setIsManualChange(false); // Reset manual change flag to allow normal sync
      setSnackbarMsg('Active billboard cleared for all users.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMsg('Failed to clear active billboard.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error clearing global billboard:', error);
    }
  };

  const handleFetchCheckIns = async () => {
    if (!selectedEvent || !selectedDate) {
      setCheckInError('Please select an event and date first.');
      return;
    }

    setLoadingCheckIns(true);
    setCheckInError('');

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('eventId', selectedEvent);
      if (selectedLocation) {
        params.append('locationId', selectedLocation);
      } else {
        params.append('locationId', 'all');
      }
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const response = await api.get(`/billboard/check-ins?${params.toString()}`);
      setCheckIns(response.data);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      setCheckInError('Failed to fetch check-ins. Please try again.');
    } finally {
      setLoadingCheckIns(false);
    }
  };

  // Fetch active pickup notifications
  const fetchActiveNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // Build query parameters for event-specific notifications
      const params = new URLSearchParams();
      if (selectedEvent) params.append('eventId', selectedEvent);
      if (selectedDate) params.append('eventDate', selectedDate);
      
      console.log('[AdminPanel] Fetching notifications with params:', params.toString());
      const response = await api.get(`/active-notifications?${params.toString()}`);
      console.log('[AdminPanel] Received notifications:', response.data?.length || 0);
      setActiveNotifications(response.data || []);
    } catch (error) {
      console.error('[AdminPanel] Error fetching notifications:', error);
      setActiveNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications when we have an event selected, regardless of billboard status
  useEffect(() => {
    if (selectedEvent && selectedDate) {
      fetchActiveNotifications();
      const interval = setInterval(fetchActiveNotifications, 10000); // 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedEvent, selectedDate]);

  // Reset manual change flag after user actions complete
  useEffect(() => {
    if (isManualChange) {
      const timer = setTimeout(() => {
        console.log('AdminPanel: Resetting manual change flag after delay');
        setIsManualChange(false);
      }, 10000); // 10 second delay to give users more time
      return () => clearTimeout(timer);
    }
  }, [isManualChange]);

  // Debug: Monitor selectedDate changes
  useEffect(() => {
    console.log('AdminPanel: selectedDate changed to:', selectedDate);
  }, [selectedDate]);

  // Debug: Monitor selectedEvent changes
  useEffect(() => {
    console.log('AdminPanel: selectedEvent changed to:', selectedEvent);
  }, [selectedEvent]);

  function formatSelectedDateForDisplay(dateString) {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (isNaN(date.getTime())) {
        console.error('Invalid date parts:', year, month, day);
        return 'Invalid date';
      }
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting selected date:', error);
      return 'Error formatting date';
    }
  }

  if (sessionLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Checking authentication status...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  const steps = ['Select Date', 'Select Event', 'Manage Security Codes & Launch Billboard'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar 
        currentPage="admin"
        selectedEvent={selectedEvent}
        selectedEventName={activeBillboard?.eventName}
        selectedDate={selectedDate}
        securityCodes={securityCodes}
        existingSecurityCodes={existingSecurityCodes}
      />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Quick Navigation Menu */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.light' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
              Quick Navigation
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Home
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ListIcon />}
                onClick={() => navigate('/location-status')}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Location Status
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/billboard')}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Billboard
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Active Billboard Banner */}
        {activeBillboard && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate('/billboard')}
                >
                  Return to Billboard
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearBillboard}
                  color="error"
                >
                  Clear Billboard (Local)
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleDeleteGlobalBillboard}
                  color="error"
                >
                  Clear Active Billboard (Global)
                </Button>
              </Box>
            }
          >
            <Typography variant="h6" gutterBottom>
              Active Billboard: {activeBillboard.eventName}
            </Typography>
            <Typography variant="body2">
              {existingSecurityCodes.length + securityCodes.length} security code{(existingSecurityCodes.length + securityCodes.length) !== 1 ? 's' : ''} added
              {globalBillboardState?.createdBy && (
                <> • Created by {globalBillboardState.createdBy.name} on{' '}
                {globalBillboardState.lastUpdated ? 
                  new Date(globalBillboardState.lastUpdated).toLocaleString() : 
                  'Unknown time'
                }</>
              )}
            </Typography>
          </Alert>
        )}

        {/* Stepper */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={selectedEvent ? (securityCodes.length > 0 || existingSecurityCodes.length > 0 ? 2 : 1) : 0} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container spacing={3} alignItems="stretch">
          {/* Step 1: Select Date */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <EventIcon color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Select Date
                  </Typography>
                </Box>
                <DateInput
                  label="Event Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  placeholder="mm/dd/yyyy"
                  sx={{ mb: 2 }}
                />
                {selectedDate && (
                  <Typography variant="body2" color="text.secondary">
                    Showing events for: {displayDate}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* Step 2: Select Event */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <EventIcon color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Select Event
                  </Typography>
                </Box>
                {dateLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading events for selected date...
                    </Typography>
                  </Box>
                ) : events.length > 0 ? (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Event</InputLabel>
                      <Select
                        value={selectedEvent}
                        onChange={handleEventChange}
                        label="Event"
                      >
                        <MenuItem value="">-- Select an Event --</MenuItem>
                        {events.map(event => (
                          <MenuItem key={event.id} value={event.id}>
                            {event.attributes.name} (ID: {event.id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Showing {events.length} active events
                    </Typography>
                    {selectedEvent && selectedDate && (
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={async () => {
                          const eventName = events.find(e => e.id === selectedEvent)?.attributes?.name || 'Event';
                          await setGlobalState(selectedEvent, eventName, [], selectedDate);
                        }}
                      >
                        Set as Active Event
                      </Button>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active events found for the selected date.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* Step 3: Manage Security Codes (move up, right of Select Event) */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Manage Security Codes
                  </Typography>
                </Box>
                {/* Existing Security Codes */}
                {existingSecurityCodes.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Current Security Codes
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {existingSecurityCodes.map(code => (
                        <Chip
                          key={`existing-${code}`}
                          label={code}
                          color="primary"
                          variant="outlined"
                          onDelete={() => handleRemoveExistingCode(code)}
                          deleteIcon={<RemoveIcon />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {/* Add New Security Code */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Add New Security Code
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Security Code"
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="Enter security code"
                      variant="outlined"
                      disabled={!selectedEvent}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSecurityCode()}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSecurityCode}
                      disabled={!selectedEvent || !securityCode.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
                {/* Launch Billboard Button */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LaunchIcon />}
                    onClick={handleLaunchBillboard}
                    disabled={!selectedEvent || (securityCodes.length === 0 && existingSecurityCodes.length === 0)}
                    sx={{ minWidth: 200 }}
                  >
                    Launch Billboard
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Step 2.5: Select Location (for check-ins) (move to second row, left) */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <LocationIcon color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Select Location (Optional)
                  </Typography>
                </Box>
                {locations.length > 0 ? (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        label="Location"
                      >
                        <MenuItem value="">-- All Locations --</MenuItem>
                        {locations.map(location => (
                          <MenuItem key={location.id} value={location.id}>
                            {location.attributes.name} (ID: {location.id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select a specific location to filter check-ins, or leave as "All Locations"
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Loading locations... You can still fetch check-ins for all locations.
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleFetchCheckIns}
                  disabled={!selectedEvent || !selectedDate || loadingCheckIns}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {loadingCheckIns ? 'Loading...' : 'Fetch Check-ins'}
                </Button>
                {checkInError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {checkInError}
                  </Alert>
                )}
                {checkIns.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Check-ins ({checkIns.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      {checkIns.map((checkIn, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                          {checkIn.name} ({checkIn.securityCode ? checkIn.securityCode : 'N/A'}) - {checkIn.locationName} ({new Date(checkIn.checkInTime).toLocaleTimeString()})
                        </Typography>
                      ))}
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* Awaiting Pickup Section (second row, right) */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Awaiting Pickup
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={fetchActiveNotifications}
                    disabled={loadingNotifications}
                    sx={{ ml: 'auto' }}
                  >
                    Refresh
                  </Button>
                </Box>
                {loadingNotifications ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading pickup notifications...
                    </Typography>
                  </Box>
                ) : activeNotifications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No children are currently awaiting pickup.
                  </Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Current Pickup Requests ({activeNotifications.length})
                    </Typography>
                    {activeNotifications.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Debug: Event {selectedEvent}, Date {selectedDate}
                      </Typography>
                    )}
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      {activeNotifications.map((n, idx) => (
                        <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                          {n.childName} ({n.securityCode}) - {n.locationName}
                        </Typography>
                      ))}
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminPanel;