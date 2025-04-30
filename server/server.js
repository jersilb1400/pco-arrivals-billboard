// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Create Express app instance
const app = express();

// Environment variables (from .env file)
const CLIENT_ID = process.env.PCO_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.PCO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'; 
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/auth/callback';
const PORT = process.env.PORT || 3001;
const PCO_API_BASE = 'https://api.planningcenteronline.com/check-ins/v2';

// Environment variables for cookie settings
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'pco-arrivals-session-secret';
const REMEMBER_ME_DAYS = 30; // Number of days to remember the user

// IDs of PCO users who are allowed to access the application
// Either hardcode them here or load from environment variables
const AUTHORIZED_USER_IDS = (process.env.AUTHORIZED_USERS || '').split(',').filter(id => id);

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update session configuration to support remember me
app.use(session({
  secret: COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // Default to 24 hours
  }
}));

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// User database - for a simple implementation, store in memory
// In production, use a database like MongoDB
let authorizedUsers = [
  // Seed with default admin user(s) if provided
  ...(process.env.ADMIN_USER_ID ? [{ id: process.env.ADMIN_USER_ID, name: 'Administrator' }] : [])
];

// Load authorized users from environment or config file
if (AUTHORIZED_USER_IDS.length > 0) {
  // Add each authorized user ID to the list if not already present
  AUTHORIZED_USER_IDS.forEach(id => {
    if (!authorizedUsers.some(user => user.id === id)) {
      authorizedUsers.push({ id });
    }
  });
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if user is authorized (admin)
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  next();
}

// Utility function to ensure token is valid
async function ensureValidToken(req) {
  // If no token exists or session is invalid, return null
  if (!req.session.accessToken) {
    return null;
  }
  
  const now = new Date().getTime();
  
  // If token is expired and we have a refresh token, try to refresh
  if (req.session.tokenExpiry && now >= req.session.tokenExpiry && req.session.refreshToken) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', req.session.refreshToken);
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);

      const tokenResponse = await axios.post(
        'https://api.planningcenteronline.com/oauth/token', 
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      req.session.accessToken = tokenResponse.data.access_token;
      req.session.refreshToken = tokenResponse.data.refresh_token;
      req.session.tokenExpiry = new Date().getTime() + (tokenResponse.data.expires_in * 1000);
      
      return req.session.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      // Clear invalid tokens
      req.session.accessToken = null;
      req.session.refreshToken = null;
      return null;
    }
  }
  
  return req.session.accessToken;
}

// Routes

// Auth status endpoint
app.get('/api/auth-status', (req, res) => {
  const isAuthenticated = !!req.session.accessToken;
  const userData = req.session.user || null;
  
  // Add some user-friendly information
  res.json({ 
    authenticated: isAuthenticated,
    user: userData,
    loginUrl: isAuthenticated ? null : '/auth/pco',
    message: isAuthenticated 
      ? `Logged in as ${userData?.name || 'User'}` 
      : 'Not logged in'
  });
});

// User info endpoint
app.get('/api/user-info', requireAuth, (req, res) => {
  res.json(req.session.user);
});

// User management endpoints
app.get('/api/admin/users', requireAuth, (req, res) => {
  // Only admins can access the user list
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  res.json(authorizedUsers);
});

app.post('/api/admin/users', requireAuth, (req, res) => {
  // Only admins can add users
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  const { userId, name, email } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // Check if user already exists
  if (authorizedUsers.some(user => user.id === userId)) {
    return res.status(400).json({ message: 'User with this ID already exists' });
  }
  
  // Add new user
  const newUser = { id: userId, name, email };
  authorizedUsers.push(newUser);
  
  // In a real application, save to database here
  
  res.status(201).json(newUser);
});

app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
  // Only admins can remove users
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  const userId = req.params.id;
  
  // Don't allow removing the current user
  if (userId === req.session.user.id) {
    return res.status(400).json({ message: 'Cannot remove your own account' });
  }
  
  // Check if user exists
  const userIndex = authorizedUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Remove user
  authorizedUsers.splice(userIndex, 1);
  
  // In a real application, update database here
  
  res.status(200).json({ message: 'User removed successfully' });
});

// OAuth routes
app.get('/auth/pco', (req, res) => {
  // Store the "remember me" preference in the session
  req.session.rememberMe = req.query.remember === 'true';
  
  const scopes = ['check_ins', 'people'];
  const authUrl = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes.join(' ')}`;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }
  
  try {
    // Form data for token request
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    
    const tokenResponse = await axios.post(
      'https://api.planningcenteronline.com/oauth/token', 
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Store tokens in session
    req.session.accessToken = tokenResponse.data.access_token;
    req.session.refreshToken = tokenResponse.data.refresh_token;
    req.session.tokenExpiry = new Date().getTime() + (tokenResponse.data.expires_in * 1000);
    
    // Apply "Remember me" if requested
    if (req.session.rememberMe) {
      req.session.cookie.maxAge = REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    }
    
    // Fetch user information
    try {
      const userResponse = await axios.get('https://api.planningcenteronline.com/people/v2/me', {
        headers: { 
          Authorization: `Bearer ${req.session.accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      // Store user information in session
      const userData = userResponse.data.data;
      const userId = userData.id;
      
      req.session.user = {
        id: userId,
        name: `${userData.attributes.first_name} ${userData.attributes.last_name}`,
        email: userData.attributes.email,
        avatar: userData.attributes.avatar,
        isAdmin: false // Default to non-admin
      };
      
      // Check if user is authorized
      const isAuthorized = authorizedUsers.some(user => user.id === userId);
      
      // If user is not in our authorized list but we're allowing all users, add them
      if (!isAuthorized && authorizedUsers.length === 0) {
        authorizedUsers.push({ 
          id: userId, 
          name: req.session.user.name, 
          email: req.session.user.email 
        });
        req.session.user.isAdmin = true; // First user becomes admin
        
        console.log(`First user automatically authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000/admin');
        return;
      }
      
      // Update user information if they're authorized
      if (isAuthorized) {
        // Update the user's info in our records
        const userIndex = authorizedUsers.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
          // Update name and email if they weren't set before
          if (!authorizedUsers[userIndex].name) {
            authorizedUsers[userIndex].name = req.session.user.name;
          }
          if (!authorizedUsers[userIndex].email) {
            authorizedUsers[userIndex].email = req.session.user.email;
          }
        }
        
        req.session.user.isAdmin = true; // All authorized users are admins for simplicity
        console.log(`User authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        
        // Redirect to admin panel
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000/admin');
      } else {
        console.log(`User not authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        
        // Unauthorized user
        req.session.user.isAdmin = false;
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000/unauthorized');
      }
    } catch (userError) {
      console.error('Failed to fetch user data:', userError.response?.data || userError.message);
      req.session.destroy();
      res.status(500).send('Authentication successful but failed to retrieve user data. Please try again.');
    }
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Update logout route to clear cookies properly
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    
    // Clear any additional cookies
    res.clearCookie('connect.sid');
    
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  });
});

// API endpoints
app.get('/api/events', requireAuth, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const response = await axios.get(`${PCO_API_BASE}/events`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Filter out archived events
    const nonArchivedEvents = response.data.data.filter(event => 
      !event.attributes.archived
    );
    
    res.json(nonArchivedEvents);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: status === 401 ? 'Authentication expired' : 'Failed to fetch events'
    });
  }
});

// Fetch events by date endpoint with archived filter
app.get('/api/events-by-date', requireAuth, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { date } = req.query;
    
    // Format the URL based on whether a date is provided
    let url = `${PCO_API_BASE}/events`;
    if (date) {
      // PCO date filter format: 2023-08-15
      const formattedDate = date.split('T')[0]; // Ensure date format is YYYY-MM-DD
      url += `?where[starts_at]=${formattedDate}`;
    }
    
    console.log(`Fetching events from: ${url}`);
    
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Filter out archived events
    const nonArchivedEvents = response.data.data.filter(event => 
      !event.attributes.archived
    );
    
    res.json(nonArchivedEvents);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: status === 401 ? 'Authentication expired' : 'Failed to fetch events'
    });
  }
});

app.post('/api/security-codes', requireAuth, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { eventId, securityCodes } = req.body;
    
    if (!eventId || !securityCodes || !securityCodes.length) {
      return res.status(400).json({ error: 'Event ID and security codes are required' });
    }
    
    const results = [];
    
    for (const code of securityCodes) {
      try {
        // Make sure to get the most recent check-in for this security code
        const checkInResponse = await axios.get(
          `${PCO_API_BASE}/events/${eventId}/check_ins?where[security_code]=${code}&include=person&order=-created_at`, {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (checkInResponse.data.data.length > 0) {
          const checkIn = checkInResponse.data.data[0]; // Get the most recent check-in
          const included = checkInResponse.data.included || [];
          const person = included.find(item => 
            item.type === 'Person' && 
            item.id === checkIn.relationships.person?.data?.id
          );
          
          results.push({
            id: checkIn.id,
            firstName: person?.attributes?.first_name || 'Unknown',
            lastName: person?.attributes?.last_name || 'Unknown',
            eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name,
            securityCode: code,
            checkedOut: !!checkIn.attributes.checked_out_at,
            checkInTime: checkIn.attributes.created_at,
            checkOutTime: checkIn.attributes.checked_out_at
          });
        } else {
          results.push({
            securityCode: code,
            error: 'No check-in found with this security code'
          });
        }
      } catch (codeError) {
        console.error(`Error fetching code ${code}:`, codeError.message);
        results.push({
          securityCode: code,
          error: codeError.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: status === 401 ? 'Authentication expired' : 'Failed to fetch security code data'
    });
  }
});

// Handle React routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PCO OAuth callback URL: ${REDIRECT_URI}`);
  if (authorizedUsers.length === 0) {
    console.log('Warning: No authorized users configured. The first user to log in will be granted admin access.');
  } else {
    console.log(`Authorized users: ${authorizedUsers.length}`);
    console.log(`Remember Me duration: ${REMEMBER_ME_DAYS} days`);
  }
});