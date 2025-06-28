import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  AppBar,
  Toolbar,
  Link,
  Chip,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import api from '../utils/api';

function SecurityCodeEntry() {
  const [securityCode, setSecurityCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [globalBillboard, setGlobalBillboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll global billboard state every 15 seconds
  useEffect(() => {
    const fetchGlobalBillboard = async () => {
      try {
        console.log('SecurityCodeEntry: Fetching global billboard state...');
        const response = await api.get('/global-billboard');
        console.log('SecurityCodeEntry: Global billboard response:', response.data);
        setGlobalBillboard(response.data.activeBillboard || null);
      } catch (error) {
        console.error('SecurityCodeEntry: Error fetching global billboard:', error);
        setGlobalBillboard(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGlobalBillboard();
    const interval = setInterval(fetchGlobalBillboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!securityCode.trim()) {
      setMessage('Please enter a security code');
      setMessageType('error');
      return;
    }
    if (!globalBillboard) {
      setMessage('No active event selected. Please contact an admin.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/security-code-entry', {
        securityCode: securityCode.trim().toUpperCase(),
        eventId: globalBillboard.eventId,
        eventDate: globalBillboard.eventDate
      });

      if (response.data.success) {
        let nameString = response.data.childName;
        if (!nameString && response.data.addedChildren) {
          nameString = response.data.addedChildren.map(c => c.childName).join(', ');
        }
        if (nameString) {
          setMessage(`Success! ${nameString} has been added to the pickup list.`);
        } else {
          setMessage(response.data.message || 'Security code accepted.');
        }
        setMessageType('success');
        setSecurityCode('');
      } else {
        setMessage(response.data.message || 'Security code not found');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error submitting security code:', error);
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update menu links to include eventId and eventDate as query params
  const eventId = globalBillboard?.eventId;
  const eventDate = globalBillboard?.eventDate;
  const menuSuffix = eventId && eventDate ? `?eventId=${eventId}&eventDate=${eventDate}` : '';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Menu */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            PCO Arrivals System
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              href={`/billboard${menuSuffix}`}
              color="inherit"
              startIcon={<DashboardIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Pickup Billboard
            </Button>
            <Button
              component={Link}
              href={`/location-status${menuSuffix}`}
              color="inherit"
              startIcon={<LocationIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Location Status
            </Button>
            <Button
              component={Link}
              href={`/admin${menuSuffix}`}
              color="inherit"
              startIcon={<DashboardIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Admin Panel
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src="https://thechurchco-production.s3.amazonaws.com/uploads/sites/1824/2020/02/Website-Logo1.png"
                alt="Church Logo"
                sx={{
                  height: 120,
                  width: 'auto',
                  mb: 3,
                  filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
                }}
              />
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Volunteer Check-In Station
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Enter the security code from a parent to notify pickup volunteers
              </Typography>
              
              {globalBillboard && (
                <Chip
                  label={`Active Event: ${globalBillboard.eventName}`}
                  color="primary"
                  variant="outlined"
                  size="large"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>

            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading system status...
                </Typography>
              </Box>
            ) : !globalBillboard ? (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom>
                  ⚠️ No Active Event Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  An administrator needs to select an event and security codes before volunteers can enter security codes.
                </Typography>
                <Button
                  component={Link}
                  href="/admin"
                  variant="contained"
                  startIcon={<DashboardIcon />}
                  sx={{ mt: 1 }}
                >
                  Go to Admin Panel
                </Button>
              </Alert>
            ) : (
              <>
                {/* Success/Error Messages */}
                {message && (
                  <Alert 
                    severity={messageType === 'success' ? 'success' : 'error'} 
                    sx={{ mb: 3 }}
                    onClose={() => setMessage('')}
                  >
                    {message}
                  </Alert>
                )}

                {/* Security Code Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto' }}>
                  <TextField
                    fullWidth
                    label="Security Code"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter security code"
                    variant="outlined"
                    size="large"
                    autoFocus
                    disabled={isSubmitting}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: <QrCodeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting || !securityCode.trim()}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <QrCodeIcon />}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Security Code'}
                  </Button>
                </Box>

                {/* Instructions */}
                <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Instructions for Volunteers:
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: 3 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Ask the parent for their security code
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Enter the code in the field above
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Click "Submit Security Code"
                    </Typography>
                    <Typography component="li" variant="body2">
                      The child will appear on the pickup billboard
                    </Typography>
                  </Box>
                </Paper>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default SecurityCodeEntry; 