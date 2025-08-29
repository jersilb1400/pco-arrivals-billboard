import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../utils/api';

function SimpleBillboard() {
  const theme = useTheme();
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalBillboard, setGlobalBillboard] = useState(null);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  
  // Audio reference for sound notifications
  const audioRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Fetch global billboard state
  const fetchGlobalBillboard = useCallback(async () => {
    try {
      const response = await api.get('/global-billboard');
      setGlobalBillboard(response.data);
    } catch (error) {
      console.error('Error fetching global billboard:', error);
      setError('Failed to fetch billboard data');
    }
  }, []);

  // Fetch active notifications
  const fetchActiveNotifications = useCallback(async (billboardData = null) => {
    try {
      const currentBillboard = billboardData || globalBillboard;
      if (currentBillboard?.activeBillboard) {
        const response = await api.get('/active-notifications', {
          params: {
            eventId: currentBillboard.activeBillboard.eventId,
            eventDate: currentBillboard.activeBillboard.eventDate
          }
        });
        setActiveNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [globalBillboard]);

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('billboardSoundEnabled');
    if (savedSoundPreference !== null) {
      setSoundEnabled(JSON.parse(savedSoundPreference));
    }
  }, []);

  // Load audio file
  useEffect(() => {
    // Create a chime sound using Web Audio API instead of external file
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Store the audio context for later use
      audioRef.current = {
        context: audioContext
      };
      
      setAudioLoaded(true);
    } catch (error) {
      console.warn('Web Audio API not supported, sound notifications disabled:', error);
      setAudioLoaded(false);
    }
    
    // Cleanup
    return () => {
      if (audioRef.current && audioRef.current.context) {
        audioRef.current.context.close();
        audioRef.current = null;
      }
    };
  }, []);

  // Save sound preference to localStorage
  const handleSoundToggle = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('billboardSoundEnabled', JSON.stringify(newSoundState));
  };

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    console.log('🔊 playNotificationSound called:', { soundEnabled, audioLoaded, hasAudioRef: !!audioRef.current });
    
    if (soundEnabled && audioLoaded && audioRef.current) {
      try {
        const { context } = audioRef.current;
        console.log('🔊 Audio context state:', context.state);
        
        // Resume context if suspended (required by modern browsers)
        if (context.state === 'suspended') {
          console.log('🔊 Resuming suspended audio context...');
          context.resume().then(() => {
            console.log('🔊 Audio context resumed successfully');
            // Play sound after context is resumed
            playSoundAfterResume(context);
          }).catch(error => {
            console.error('🔊 Failed to resume audio context:', error);
          });
        } else {
          // Context is already running, play sound immediately
          playSoundAfterResume(context);
        }
        
      } catch (error) {
        console.warn('🔊 Error in playNotificationSound:', error);
      }
    } else {
      console.log('🔊 Sound not played - conditions not met:', { soundEnabled, audioLoaded, hasAudioRef: !!audioRef.current });
    }
  }, [soundEnabled, audioLoaded]);

  // Helper function to play sound after context is ready
  const playSoundAfterResume = (context) => {
    try {
      console.log('🔊 Playing chime sound...');
      
      // Create new oscillator for each play (can't reuse)
      const newOscillator = context.createOscillator();
      const newGainNode = context.createGain();
      
      newOscillator.connect(newGainNode);
      newGainNode.connect(context.destination);
      
      // Set up the chime sound
      newOscillator.type = 'sine';
      newOscillator.frequency.setValueAtTime(800, context.currentTime);
      newOscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1);
      newOscillator.frequency.setValueAtTime(600, context.currentTime + 0.2);
      
      newGainNode.gain.setValueAtTime(0.3, context.currentTime);
      newGainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      // Play the sound
      newOscillator.start(context.currentTime);
      newOscillator.stop(context.currentTime + 0.5);
      
      console.log('🔊 Chime sound started successfully');
      
    } catch (error) {
      console.error('🔊 Error playing sound after resume:', error);
    }
  };

  // Check for new notifications and play sound
  useEffect(() => {
    console.log('🔊 Notification count changed:', { 
      current: activeNotifications.length, 
      previous: previousNotificationCount,
      shouldPlay: activeNotifications.length > previousNotificationCount && previousNotificationCount > 0
    });
    
    if (activeNotifications.length > previousNotificationCount && previousNotificationCount > 0) {
      // New notifications were added
      console.log('🔊 New notifications detected, playing sound...');
      playNotificationSound();
    }
    setPreviousNotificationCount(activeNotifications.length);
  }, [activeNotifications.length, previousNotificationCount, playNotificationSound]);

  // Fetch data on mount and set up polling
  useEffect(() => {
    // Initial data fetch
    const initialFetch = async () => {
      await fetchGlobalBillboard();
      // Wait a bit for globalBillboard to be set, then fetch notifications
      setTimeout(() => {
        fetchActiveNotifications();
      }, 100);
    };
    
    initialFetch();
    
    // Set up polling interval
    const interval = setInterval(async () => {
      const billboardResponse = await api.get('/global-billboard');
      setGlobalBillboard(billboardResponse.data);
      
      // Fetch notifications with the fresh billboard data
      if (billboardResponse.data?.activeBillboard) {
        try {
          const notificationsResponse = await api.get('/active-notifications', {
            params: {
              eventId: billboardResponse.data.activeBillboard.eventId,
              eventDate: billboardResponse.data.activeBillboard.eventDate
            }
          });
          setActiveNotifications(notificationsResponse.data);
        } catch (error) {
          console.error('Error fetching notifications in interval:', error);
        }
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

  // Handle notifications when global billboard changes (but avoid infinite loops)
  useEffect(() => {
    if (globalBillboard?.activeBillboard) {
      fetchActiveNotifications(globalBillboard);
    }
  }, [globalBillboard?.activeBillboard?.eventId, globalBillboard?.activeBillboard?.eventDate]); // Only depend on the actual data, not the whole object

  // Get child emoji based on name
  const getChildEmoji = (childName) => {
    const emojis = ['👶', '👧', '👦', '🧒', '👶', '👧', '👦', '🧒'];
    const index = childName.length % emojis.length;
    return emojis[index];
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      px: 2
    }}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Sound Toggle Button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mb: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          p: 1,
          gap: 1
        }}>
          {/* Test Sound Button */}
          <Tooltip title="Test sound notification">
            <IconButton
              onClick={() => {
                console.log('🔊 Test sound button clicked');
                playNotificationSound();
              }}
              color="secondary"
              sx={{
                backgroundColor: 'secondary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                }
              }}
            >
              🔊
            </IconButton>
          </Tooltip>
          
          {/* Sound Toggle Button */}
          <Tooltip title={soundEnabled ? "Turn off sound notifications" : "Turn on sound notifications"}>
            <IconButton
              onClick={handleSoundToggle}
              color={soundEnabled ? "primary" : "default"}
              sx={{
                backgroundColor: soundEnabled ? 'primary.main' : 'grey.300',
                color: soundEnabled ? 'white' : 'grey.600',
                '&:hover': {
                  backgroundColor: soundEnabled ? 'primary.dark' : 'grey.400',
                }
              }}
            >
              {soundEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={64} sx={{ mb: 3 }} />
              <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading pickup requests...
              </Typography>
            </Box>
          </Box>
        )}

        {/* No Active Billboard Message */}
        {!isLoading && !globalBillboard?.activeBillboard && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: 'grey.100',
            borderRadius: 2
          }}>
            <Typography variant="h4" color="text.secondary">
              No active billboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              An admin needs to set up an active event and billboard first.
            </Typography>
          </Box>
        )}

        {/* Active Billboard Display */}
        {!isLoading && globalBillboard?.activeBillboard && (
          <Box>
            {/* Event Header */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: 4,
              backgroundColor: 'primary.main',
              color: 'white',
              py: 3,
              borderRadius: 2,
              boxShadow: 3
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {globalBillboard.activeBillboard.eventName}
              </Typography>
              {globalBillboard.activeBillboard.eventDate && (
                <Typography variant="h5" sx={{ opacity: 0.9 }}>
                  {(() => {
                    const eventDate = globalBillboard.activeBillboard.eventDate;
                    console.log('📅 Billboard event date:', eventDate);
                    
                    try {
                      // Handle different date formats
                      let dateObj;
                      if (typeof eventDate === 'string') {
                        // If it's already a date string, parse it
                        dateObj = new Date(eventDate);
                      } else if (eventDate instanceof Date) {
                        // If it's already a Date object
                        dateObj = eventDate;
                      } else {
                        console.warn('📅 Unknown date format:', eventDate);
                        return 'Date not available';
                      }
                      
                      // Check if date is valid
                      if (isNaN(dateObj.getTime())) {
                        console.warn('📅 Invalid date:', eventDate);
                        return 'Invalid date';
                      }
                      
                      console.log('📅 Parsed date object:', dateObj);
                      
                      // Format the date
                      const formattedDate = dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      
                      console.log('📅 Formatted date:', formattedDate);
                      return formattedDate;
                      
                    } catch (error) {
                      console.error('📅 Error formatting date:', error);
                      return 'Date formatting error';
                    }
                  })()}
                </Typography>
              )}
            </Box>

            {/* Notifications Display */}
            {activeNotifications.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}>
                <Typography variant="h5" color="text.secondary">
                  No children waiting for pickup
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Children will appear here when their security code is entered.
                </Typography>
              </Box>
            ) : (
              <Grid 
                container 
                spacing={{ xs: 2, sm: 3, md: 3 }}
                sx={{
                  // Force two-column layout on tablets and larger
                  display: 'flex',
                  flexWrap: 'nowrap',
                  minHeight: '70vh'
                }}
              >
                {/* Left Column */}
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={6} 
                  sx={{ 
                    flex: '0 0 50%', 
                    maxWidth: '50%',
                    minWidth: '50%',
                    // Ensure proper spacing on tablets
                    pr: { xs: 1, sm: 1.5, md: 1.5 }
                  }}
                >
                  {activeNotifications
                    .filter((_, index) => index % 2 === 0)
                    .map((notification) => (
                      <Card
                        key={notification.id}
                        sx={{
                          mb: { xs: 1.5, sm: 2, md: 2 },
                          minHeight: { xs: '100px', sm: '120px', md: '120px' },
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: '2px solid #4a5568',
                          borderRadius: { xs: '8px', sm: '12px', md: '12px' },
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <CardContent sx={{ 
                          p: { xs: 1.5, sm: 2, md: 2 }, 
                          textAlign: 'center' 
                        }}>
                          {/* Child Name */}
                          <Typography variant="h3" sx={{
                            fontWeight: 900,
                            color: 'black',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                            letterSpacing: '2px',
                            fontSize: { 
                              xs: '2.5rem', 
                              sm: '3rem', 
                              md: '3.5rem', 
                              lg: '4rem' 
                            },
                            textAlign: 'center',
                            lineHeight: 1.2
                          }}>
                            {getChildEmoji(notification.childName)} {notification.childName}
                          </Typography>
                          
                          {/* Security Code */}
                          <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: 'black',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                            fontSize: { 
                              xs: '1.5rem', 
                              sm: '1.8rem', 
                              md: '2rem', 
                              lg: '2.5rem' 
                            },
                            mt: 1,
                            mb: 1
                          }}>
                            {notification.securityCode}
                          </Typography>
                          
                          {/* Time and Location */}
                          <Typography variant="h6" sx={{
                            color: 'black',
                            fontSize: { 
                              xs: '1rem', 
                              sm: '1.1rem', 
                              md: '1.2rem', 
                              lg: '1.5rem' 
                            },
                            opacity: 0.9
                          }}>
                            {formatTime(notification.notifiedAt)} • {notification.locationName}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>

                {/* Right Column */}
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={6} 
                  sx={{ 
                    flex: '0 0 50%', 
                    maxWidth: '50%',
                    minWidth: '50%',
                    // Ensure proper spacing on tablets
                    pl: { xs: 1, sm: 1.5, md: 1.5 }
                  }}
                >
                  {activeNotifications
                    .filter((_, index) => index % 2 === 1)
                    .map((notification) => (
                      <Card
                        key={notification.id}
                        sx={{
                          mb: { xs: 1.5, sm: 2, md: 2 },
                          minHeight: { xs: '100px', sm: '120px', md: '120px' },
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          color: 'white',
                          border: '2px solid #4a5568',
                          borderRadius: { xs: '8px', sm: '12px', md: '12px' },
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <CardContent sx={{ 
                          p: { xs: 1.5, sm: 2, md: 2 }, 
                          textAlign: 'center' 
                        }}>
                          {/* Child Name */}
                          <Typography variant="h3" sx={{
                            fontWeight: 900,
                            color: 'black',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                            letterSpacing: '2px',
                            fontSize: { 
                              xs: '2.5rem', 
                              sm: '3rem', 
                              md: '3.5rem', 
                              lg: '4rem' 
                            },
                            textAlign: 'center',
                            lineHeight: 1.2
                          }}>
                            {getChildEmoji(notification.childName)} {notification.childName}
                          </Typography>
                          
                          {/* Security Code */}
                          <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: 'black',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                            fontSize: { 
                              xs: '1.5rem', 
                              sm: '1.8rem', 
                              md: '2rem', 
                              lg: '2.5rem' 
                            },
                            mt: 1,
                            mb: 1
                          }}>
                            {notification.securityCode}
                          </Typography>
                          
                          {/* Time and Location */}
                          <Typography variant="h6" sx={{
                            color: 'black',
                            fontSize: { 
                              xs: '1rem', 
                              sm: '1.1rem', 
                              md: '1.2rem', 
                              lg: '1.5rem' 
                            },
                            opacity: 0.9
                          }}>
                            {formatTime(notification.notifiedAt)} • {notification.locationName}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default SimpleBillboard; 