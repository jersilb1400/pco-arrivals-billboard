import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Person as ChildIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../utils/api';

function SimpleBillboard() {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [globalBillboard, setGlobalBillboard] = useState(null);

  // Fetch global billboard state
  const fetchGlobalBillboard = useCallback(async () => {
    try {
      const response = await api.get('/global-billboard');
      setGlobalBillboard(response.data.activeBillboard || null);
    } catch (error) {
      console.error('Error fetching global billboard:', error);
      setGlobalBillboard(null);
    }
  }, []);

  // Fetch active notifications
  const fetchActiveNotifications = useCallback(async () => {
    try {
      // Build query parameters for event-specific notifications
      const params = new URLSearchParams();
      if (globalBillboard?.eventId) params.append('eventId', globalBillboard.eventId);
      if (globalBillboard?.eventDate) params.append('eventDate', globalBillboard.eventDate);
      
      const response = await api.get(`/active-notifications?${params.toString()}`);
      console.log('SimpleBillboard: Received notifications:', response.data);
      setActiveNotifications(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [globalBillboard?.eventId, globalBillboard?.eventDate]);

  // Initial load
  useEffect(() => {
    fetchGlobalBillboard();
    fetchActiveNotifications();
  }, [fetchGlobalBillboard, fetchActiveNotifications]);

  // Polling every 10 seconds to reduce server load
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGlobalBillboard();
      fetchActiveNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchGlobalBillboard, fetchActiveNotifications]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Function to get fun child-based emoji based on name
  const getChildEmoji = (childName) => {
    const emojis = [
      '👶', '🧒', '👧', '👦', '👼', '🎈', '🎪', '🎨', '🎭', '🎯',
      '🎮', '🎲', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '🎬', '🎭',
      '🎪', '🎨', '🎯', '🎳', '🎮', '🎲', '🎸', '🎹', '🎺', '🎻',
      '🚀', '🚁', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉',
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣',
      '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️',
      '🌈', '⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '☀️', '🌙',
      '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓',
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒'
    ];
    
    // Use the child's name to consistently pick the same emoji
    const nameHash = childName.split('').reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
    
    return emojis[Math.abs(nameHash) % emojis.length];
  };

  // Group notifications by location
  const locationGroups = {};
  activeNotifications.forEach(notification => {
    const loc = notification.locationName || 'Unknown Location';
    if (!locationGroups[loc]) locationGroups[loc] = [];
    locationGroups[loc].push(notification);
  });

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      py: 4,
      px: 2
    }}>
      <Container maxWidth="xl">
        {/* TV-Optimized Header */}
        <Paper elevation={8} sx={{
          background: 'linear-gradient(135deg, #2e77bb 0%, #1e5aa0 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(46,119,187,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 3
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h2" sx={{
              fontWeight: 900,
              mb: 2,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '2px',
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' }
            }}>
              🎯 PICKUP REQUESTS (TV Mode)
            </Typography>
            <Typography variant="h4" sx={{
              fontWeight: 600,
              opacity: 0.9,
              mb: 1,
              fontSize: { xs: '1.5rem', md: '1.8rem', lg: '2rem' }
            }}>
              {globalBillboard?.eventName || 'Active Event'}
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              opacity: 0.8,
              fontSize: { xs: '1rem', md: '1.2rem', lg: '1.5rem' }
            }}>
              <Box component="span">📅 {formatTime(lastUpdated)}</Box>
              <Box component="span">🔢 {activeNotifications.length} children ready</Box>
              {globalBillboard?.securityCodes && (
                <Box component="span">🔑 {globalBillboard.securityCodes.length} codes active</Box>
              )}
            </Box>
          </Box>
          
          <IconButton
            onClick={fetchActiveNotifications}
            disabled={isLoading}
            size="large"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              p: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              },
              '&:disabled': {
                bgcolor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <RefreshIcon sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }} />
          </IconButton>
        </Paper>

        {/* TV-Optimized Content */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={64} sx={{ mb: 3 }} />
              <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading pickup requests...
              </Typography>
            </Box>
          </Box>
        ) : activeNotifications.length > 0 ? (
          <Box sx={{ p: 2 }}>
            {/* Two-Column Layout for TV Display */}
            <Grid container spacing={4} sx={{ minHeight: '70vh', display: 'flex', flexWrap: 'nowrap' }}>
              {/* Left Column */}
              <Grid item xs={12} md={6} sx={{ flex: '0 0 50%', maxWidth: '50%' }}>
                <Card elevation={8} sx={{
                  borderRadius: 4,
                  background: 'white',
                  border: '3px solid #e2e8f0',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                  height: 'fit-content'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                      <LocationIcon color="primary" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
                      <Typography variant="h3" sx={{
                        fontWeight: 900,
                        color: 'primary.main',
                        letterSpacing: '2px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' }
                      }}>
                        📍 Left Column
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {activeNotifications
                        .filter((_, index) => index % 2 === 0) // Even indices for left column
                        .map((notification, idx) => (
                        <Paper
                          key={notification.id + '-left-' + idx}
                          elevation={4}
                          sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            border: '3px solid',
                            borderColor: 'primary.main',
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(46,119,187,0.2)',
                            },
                            minHeight: { xs: '140px', md: '160px' }
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            width: '100%'
                          }}>
                            {/* Child Name - Large and Prominent */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              justifyContent: 'center',
                              mb: 1
                            }}>
                              <Typography variant="h3" sx={{
                                fontWeight: 900,
                                color: 'text.primary',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                                letterSpacing: '2px',
                                fontSize: { xs: '3rem', md: '3.5rem', lg: '4rem' },
                                textAlign: 'center',
                                lineHeight: 1.2
                              }}>
                                {getChildEmoji(notification.childName)} {notification.childName}
                              </Typography>
                            </Box>
                            
                            {/* Security Code - Directly Under Name */}
                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              mb: 2
                            }}>
                              <Chip
                                label={notification.securityCode}
                                color="primary"
                                variant="filled"
                                sx={{
                                  fontSize: { xs: '1.8rem', md: '2.2rem', lg: '2.5rem' },
                                  fontWeight: 900,
                                  letterSpacing: '3px',
                                  px: 3,
                                  py: 2,
                                  minWidth: 160,
                                  background: 'white',
                                  color: 'primary.main',
                                  border: '3px solid',
                                  borderColor: 'primary.main',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                                }}
                              />
                            </Box>
                            
                            {/* Time and Location Row */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 2
                            }}>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                <ScheduleIcon color="action" sx={{
                                  fontSize: { xs: '1.2rem', md: '1.4rem' }
                                }} />
                                <Typography variant="h5" color="text.secondary" sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '1rem', md: '1.2rem', lg: '1.4rem' }
                                }}>
                                  {notification.notifiedAt ? `⏰ ${formatTime(notification.notifiedAt)}` : ''}
                                </Typography>
                              </Box>
                              
                              {/* Location info */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LocationIcon color="action" sx={{ fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.6rem' } }} />
                                <Typography variant="h5" color="text.secondary" sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '1.1rem', md: '1.3rem', lg: '1.5rem' },
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                  📍 {notification.locationName}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6} sx={{ flex: '0 0 50%', maxWidth: '50%' }}>
                <Card elevation={8} sx={{
                  borderRadius: 4,
                  background: 'white',
                  border: '3px solid #e2e8f0',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                  height: 'fit-content'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                      <LocationIcon color="primary" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
                      <Typography variant="h3" sx={{
                        fontWeight: 900,
                        color: 'primary.main',
                        letterSpacing: '2px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' }
                      }}>
                        📍 Right Column
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {activeNotifications
                        .filter((_, index) => index % 2 === 1) // Odd indices for right column
                        .map((notification, idx) => (
                        <Paper
                          key={notification.id + '-right-' + idx}
                          elevation={4}
                          sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            border: '3px solid',
                            borderColor: 'primary.main',
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(46,119,187,0.2)',
                            },
                            minHeight: { xs: '140px', md: '160px' }
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            width: '100%'
                          }}>
                            {/* Child Name - Large and Prominent */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              justifyContent: 'center',
                              mb: 1
                            }}>
                              <Typography variant="h3" sx={{
                                fontWeight: 900,
                                color: 'text.primary',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                                letterSpacing: '2px',
                                fontSize: { xs: '3rem', md: '3.5rem', lg: '4rem' },
                                textAlign: 'center',
                                lineHeight: 1.2
                              }}>
                                {getChildEmoji(notification.childName)} {notification.childName}
                              </Typography>
                            </Box>
                            
                            {/* Security Code - Directly Under Name */}
                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              mb: 2
                            }}>
                              <Chip
                                label={notification.securityCode}
                                color="primary"
                                variant="filled"
                                sx={{
                                  fontSize: { xs: '1.8rem', md: '2.2rem', lg: '2.5rem' },
                                  fontWeight: 900,
                                  letterSpacing: '3px',
                                  px: 3,
                                  py: 2,
                                  minWidth: 160,
                                  background: 'white',
                                  color: 'primary.main',
                                  border: '3px solid',
                                  borderColor: 'primary.main',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                                }}
                              />
                            </Box>
                            
                            {/* Time and Location Row */}
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 2
                            }}>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}>
                                <ScheduleIcon color="action" sx={{
                                  fontSize: { xs: '1.2rem', md: '1.4rem' }
                                }} />
                                <Typography variant="h5" color="text.secondary" sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '1rem', md: '1.2rem', lg: '1.4rem' }
                                }}>
                                  {notification.notifiedAt ? `⏰ ${formatTime(notification.notifiedAt)}` : ''}
                                </Typography>
                              </Box>
                              
                              {/* Location info */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LocationIcon color="action" sx={{ fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.6rem' } }} />
                                <Typography variant="h5" color="text.secondary" sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '1.1rem', md: '1.3rem', lg: '1.5rem' },
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                  📍 {notification.locationName}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Card elevation={8} sx={{
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 8, textAlign: 'center' }}>
              <ChildIcon sx={{
                fontSize: { xs: '4rem', md: '5rem', lg: '6rem' },
                color: 'grey.400',
                mb: 3
              }} />
              <Typography variant="h3" gutterBottom sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' }
              }}>
                📋 No Pickup Requests
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{
                mb: 4,
                fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.6rem' }
              }}>
                Waiting for check-ins with the selected security codes...
              </Typography>
              
              <Paper elevation={4} sx={{
                p: 4,
                maxWidth: 600,
                mx: 'auto',
                bgcolor: 'grey.50',
                borderRadius: 3
              }}>
                <Typography variant="h5" gutterBottom sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', md: '1.8rem' }
                }}>
                  Instructions for Volunteers:
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 4, textAlign: 'left' }}>
                  <Typography component="li" variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                    When a card appears above, find the child
                  </Typography>
                  <Typography component="li" variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                    Bring them to the pickup area
                  </Typography>
                  <Typography component="li" variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                    Check them out in PCO
                  </Typography>
                  <Typography component="li" variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                    Card will automatically disappear
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default SimpleBillboard; 