// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const connectDB = require('./db/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const MongoStore = require('connect-mongo');
const fetchCheckinsByEventTime = require('./utils/fetchCheckinsByEventTime');
const { Parser } = require('json2csv'); // For CSV export (optional)

// Create Express app instance
const app = express();

// Environment variables (from .env file)
const CLIENT_ID = process.env.PCO_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.PCO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'; 
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://pco-arrivals-billboard-client.onrender.com/auth/callback';
const PORT = process.env.PORT || 3001;
const PCO_API_BASE = 'https://api.planningcenteronline.com/check-ins/v2';
const ACCESS_TOKEN = process.env.PCO_ACCESS_TOKEN;

// Environment variables for cookie settings
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'pco-arrivals-session-secret';
const REMEMBER_ME_DAYS = 30; // Number of days to remember the user

// IDs of PCO users who are allowed to access the application
// Either hardcode them here or load from environment variables
const AUTHORIZED_USER_IDS = (process.env.AUTHORIZED_USERS || '').split(',').filter(id => id);

// Middleware
app.use(cors({
  origin: 'https://pco-arrivals-billboard-client.onrender.com',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update session configuration to use MongoDB for persistence
app.use(session({
  secret: COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://jeremy:<db_password>@pco-arrivals-dashboard.v8j7apq.mongodb.net/?retryWrites=true&w=majority&appName=pco-arrivals-dashboard',
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files if in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

// Utility functions to load and save users
function loadAuthorizedUsers() {
  if (!fs.existsSync(path.join(__dirname, 'authorized_users.json'))) return [];
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'authorized_users.json'), 'utf-8'));
}

function saveAuthorizedUsers(users) {
  fs.writeFileSync(path.join(__dirname, 'authorized_users.json'), JSON.stringify(users, null, 2));
}

// Load users at startup
let authorizedUsers = loadAuthorizedUsers();

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
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  res.json(authorizedUsers);
});

app.post('/api/admin/users', requireAuth, (req, res) => {
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { userId, name, email } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  if (authorizedUsers.some(user => user.id === userId)) {
    return res.status(400).json({ message: 'User with this ID already exists' });
  }
  const newUser = { id: userId, name, email };
  authorizedUsers.push(newUser);
  saveAuthorizedUsers(authorizedUsers); // Persist the change
  res.status(201).json(newUser);
});

app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const userId = req.params.id;
  if (userId === req.session.user.id) {
    return res.status(400).json({ message: 'Cannot remove your own account' });
  }
  const userIndex = authorizedUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  authorizedUsers.splice(userIndex, 1);
  saveAuthorizedUsers(authorizedUsers); // Persist the change
  res.status(200).json({ message: 'User removed successfully' });
});

// OAuth routes
app.get('/auth/pco', (req, res) => {
  req.session.rememberMe = req.query.remember === 'true';
  const scopes = ['check_ins', 'people'];
  const redirectUri = REDIRECT_URI;
  const authUrl = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join(' ')}`;
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
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: {
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
        console.log('CLIENT_URL:', process.env.CLIENT_URL);
        res.redirect(`${process.env.CLIENT_URL || 'https://pco-arrivals-billboard-client.onrender.com'}/admin`);
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
        console.log('CLIENT_URL:', process.env.CLIENT_URL);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/admin`);
      } else {
        console.log(`User not authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        
        // Unauthorized user
        req.session.user.isAdmin = false;
        console.log('CLIENT_URL:', process.env.CLIENT_URL);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/unauthorized`);
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
    
    console.log('CLIENT_URL:', process.env.CLIENT_URL);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/admin`);
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
      auth: {
        username: process.env.PCO_ACCESS_TOKEN,
        password: process.env.PCO_ACCESS_SECRET
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Filter out archived events
    const nonArchivedEvents = response.data.data.filter(event => event.attributes.archived !== true);
    
    // Log event IDs and names for debugging
    console.log('Fetched Events:');
    nonArchivedEvents.forEach(event => {
      console.log(`ID: ${event.id}, Name: ${event.attributes.name}`);
    });
    
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
      // PCO date filter format: YYYY-MM-DD
      const formattedDate = date.split('T')[0];
      // Include all events for the specific date, including past events
      url += `?where[starts_at]=${formattedDate}&include=time`;
    }
    
    console.log(`Fetching events from: ${url}`);
    
    const response = await axios.get(url, {
      auth: {
        username: process.env.PCO_ACCESS_TOKEN,
        password: process.env.PCO_ACCESS_SECRET
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Filter events to only exclude archived ones
    const nonArchivedEvents = response.data.data.filter(event => event.attributes.archived !== true);
    
    // Sort events by start time
    const sortedEvents = nonArchivedEvents.sort((a, b) => {
      const timeA = new Date(a.attributes.starts_at);
      const timeB = new Date(b.attributes.starts_at);
      return timeA - timeB;
    });
    
    // Debug logging
    console.log(`Selected date: ${date}`);
    console.log(`Total events found: ${response.data.data.length}`);
    console.log(`Non-archived events: ${sortedEvents.length}`);
    sortedEvents.forEach(event => {
      console.log(`Event: ${event.attributes.name}, Date: ${event.attributes.starts_at}, Archived: ${event.attributes.archived}`);
    });
    
    res.json(sortedEvents);
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
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    // If securityCodes is provided and non-empty, use existing logic
    if (securityCodes && securityCodes.length > 0) {
      const results = [];
      for (const code of securityCodes) {
        try {
          // Get all check-ins for this security code
          const checkInResponse = await axios.get(
            `${PCO_API_BASE}/events/${eventId}/check_ins?where[security_code]=${code}&include=person,household`, {
            auth: {
              username: process.env.PCO_ACCESS_TOKEN,
              password: process.env.PCO_ACCESS_SECRET
            },
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (checkInResponse.data.data.length > 0) {
            const checkIns = checkInResponse.data.data;
            const included = checkInResponse.data.included || [];
            
            // Group check-ins by household
            const householdGroups = {};
            
            checkIns.forEach(checkIn => {
              const person = included.find(item => 
                item.type === 'Person' && 
                item.id === checkIn.relationships.person?.data?.id
              );
              
              const household = included.find(item =>
                item.type === 'Household' &&
                item.id === person?.relationships?.household?.data?.id
              );
              
              const householdId = household?.id || 'no-household';
              const householdName = household?.attributes?.name || person?.attributes?.last_name + ' Household';
              
              if (!householdGroups[householdId]) {
                householdGroups[householdId] = {
                  householdName,
                  members: []
                };
              }
              
              householdGroups[householdId].members.push({
                id: checkIn.id,
                firstName: person?.attributes?.first_name || 'Unknown',
                lastName: person?.attributes?.last_name || 'Unknown',
                eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name,
                securityCode: code,
                checkedOut: !!checkIn.attributes.checked_out_at,
                checkInTime: checkIn.attributes.created_at,
                checkOutTime: checkIn.attributes.checked_out_at,
                householdName
              });
            });
            
            // Add all grouped members to results
            Object.values(householdGroups).forEach(group => {
              results.push(...group.members);
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
    } else {
      // No securityCodes provided: fetch all check-ins for the event
      const checkInResponse = await axios.get(
        `${PCO_API_BASE}/events/${eventId}/check_ins?include=person,household`, {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      const checkIns = checkInResponse.data.data;
      const included = checkInResponse.data.included || [];
      // Only include active (not checked out) check-ins
      const activePeople = checkIns
        .filter(checkIn => !checkIn.attributes.checked_out_at)
        .map(checkIn => {
          const person = included.find(item => 
            item.type === 'Person' && 
            item.id === checkIn.relationships.person?.data?.id
          );
          return {
            id: checkIn.id,
            firstName: person?.attributes?.first_name || 'Unknown',
            lastName: person?.attributes?.last_name || 'Unknown',
            securityCode: checkIn.attributes.security_code || '',
            checkInTime: checkIn.attributes.created_at,
            checkedOut: !!checkIn.attributes.checked_out_at
          };
        });
      res.json(activePeople);
    }
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: status === 401 ? 'Authentication expired' : 'Failed to fetch security code data'
    });
  }
});

app.get('/api/events/:eventId/active-people', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    // 1. Fetch all event times for the event
    const eventTimesResponse = await axios.get(
      `${PCO_API_BASE}/events/${eventId}/event_times`,
      {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    const eventTimes = eventTimesResponse.data.data;
    if (!eventTimes || eventTimes.length === 0) return res.json([]);

    let allCheckIns = [];
    let allIncluded = [];

    // 2. For each event time, fetch active check-ins
    for (const eventTime of eventTimes) {
      let nextPage = `${PCO_API_BASE}/event_times/${eventTime.id}/check_ins?include=person,household&per_page=100&where[checked_out_at]=null`;
      while (nextPage) {
        try {
          const response = await axios.get(nextPage, {
            auth: {
              username: process.env.PCO_ACCESS_TOKEN,
              password: process.env.PCO_ACCESS_SECRET
            },
            headers: {
              'Accept': 'application/json'
            }
          });
          allCheckIns = allCheckIns.concat(response.data.data || []);
          allIncluded = allIncluded.concat(response.data.included || []);
          nextPage = response.data.links?.next;
        } catch (err) {
          if (err.response && err.response.status === 404) {
            // Log and skip this event time, but do NOT throw
            console.warn(`404 Not Found for event_time ${eventTime.id}, skipping.`);
            break;
          } else {
            // For other errors, log and rethrow
            console.error(`Error fetching check-ins for event_time ${eventTime.id}:`, err.response?.data || err.message);
            throw err;
          }
        }
      }
    }

    // 3. Map to person info and filter by date if provided
    let activePeople = allCheckIns.map(checkIn => {
      const person = allIncluded.find(
        item => item.type === 'Person' && item.id === checkIn.relationships.person?.data?.id
      );
      const household = allIncluded.find(
        item => item.type === 'Household' && item.id === person?.relationships?.household?.data?.id
      );
      return {
        id: checkIn.id,
        firstName: person?.attributes?.first_name || 'Unknown',
        lastName: person?.attributes?.last_name || 'Unknown',
        securityCode: checkIn.attributes.security_code || '',
        checkInTime: checkIn.attributes.created_at,
        householdName: household?.attributes?.name || `${person?.attributes?.last_name || 'Unknown'} Household`,
        eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name,
        eventId: eventId
      };
    });

    // Filter by date if provided (YYYY-MM-DD)
    if (date) {
      activePeople = activePeople.filter(person => {
        const checkInDate = new Date(person.checkInTime).toISOString().split('T')[0];
        return checkInDate === date;
      });
    }

    res.json(activePeople);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch active people' });
  }
});

// GET /api/events/:eventId/event-times
app.get('/api/events/:eventId/event-times', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    let allEventTimes = [];
    let nextPage = `${PCO_API_BASE}/events/${eventId}/event_times`;
    while (nextPage) {
      const response = await axios.get(nextPage, {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      allEventTimes = allEventTimes.concat(response.data.data || []);
      nextPage = response.data.links?.next;
    }
    res.json(allEventTimes);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    // Return the actual error message from PCO if available
    const errorMsg = error.response?.data?.errors?.[0]?.detail || error.message || 'Failed to fetch event times';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/event-times/:eventTimeId/active-people
app.get('/api/event-times/:eventTimeId/active-people', requireAuth, async (req, res) => {
  try {
    const { eventTimeId } = req.params;
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    let allCheckIns = [];
    let allIncluded = [];
    let nextPage = `${PCO_API_BASE}/event_times/${eventTimeId}/check_ins?include=person,household&per_page=100&where[checked_out_at]=null`;
    while (nextPage) {
      const response = await axios.get(nextPage, {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      allCheckIns = allCheckIns.concat(response.data.data || []);
      allIncluded = allIncluded.concat(response.data.included || []);
      nextPage = response.data.links?.next;
    }

    const activePeople = allCheckIns.map(checkIn => {
      const person = allIncluded.find(
        item => item.type === 'Person' && item.id === checkIn.relationships.person?.data?.id
      );
      const household = allIncluded.find(
        item => item.type === 'Household' && item.id === person?.relationships?.household?.data?.id
      );
      return {
        id: checkIn.id,
        firstName: person?.attributes?.first_name || 'Unknown',
        lastName: person?.attributes?.last_name || 'Unknown',
        securityCode: checkIn.attributes.security_code || '',
        checkInTime: checkIn.attributes.created_at,
        householdName: household?.attributes?.name || `${person?.attributes?.last_name || 'Unknown'} Household`,
        eventTimeId: eventTimeId
      };
    });

    res.json(activePeople);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch active people for event time' });
  }
});

// GET /api/events/:eventId/remaining-checkins?date=YYYY-MM-DD
app.get('/api/events/:eventId/remaining-checkins', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { date } = req.query; // Expecting YYYY-MM-DD
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    // 1. Fetch all event times for the event
    let eventTimes = [];
    try {
      const eventTimesResponse = await axios.get(
        `${PCO_API_BASE}/events/${eventId}/event_times`,
        {
          auth: {
            username: process.env.PCO_ACCESS_TOKEN,
            password: process.env.PCO_ACCESS_SECRET
          },
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      eventTimes = eventTimesResponse.data.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.json({ message: 'No event times found for the selected event.', checkIns: [] });
      } else {
        throw err;
      }
    }

    // 2. Filter event times by date (if provided)
    let filteredEventTimes = eventTimes;
    if (date) {
      filteredEventTimes = eventTimes.filter(et => {
        // et.attributes.starts_at is ISO string
        return et.attributes.starts_at.startsWith(date);
      });
    }

    // If no event times found for the date, return a user-friendly message
    if (!filteredEventTimes.length) {
      return res.json({ message: 'No event times found for the selected date.', checkIns: [] });
    }

    // 3. For each event time, fetch check-ins where checked_out_at=null
    let allCheckIns = [];
    for (const eventTime of filteredEventTimes) {
      let nextPage = `${PCO_API_BASE}/event_times/${eventTime.id}/check_ins?where[checked_out_at]=null&include=person,household&per_page=100`;
      while (nextPage) {
        try {
          const response = await axios.get(nextPage, {
            auth: {
              username: process.env.PCO_ACCESS_TOKEN,
              password: process.env.PCO_ACCESS_SECRET
            },
            headers: {
              'Accept': 'application/json'
            }
          });
          allCheckIns = allCheckIns.concat(response.data.data || []);
          nextPage = response.data.links?.next;
        } catch (err) {
          if (err.response && err.response.status === 404) {
            // Log and skip this event time, but do NOT throw
            console.warn(`404 Not Found for event_time ${eventTime.id}, skipping.`);
            break;
          } else {
            // For other errors, log and rethrow
            console.error(`Error fetching check-ins for event_time ${eventTime.id}:`, err.response?.data || err.message);
            throw err;
          }
        }
      }
    }

    res.json({ checkIns: allCheckIns });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch remaining check-ins' });
  }
});

// GET /api/events/:eventId/locations
app.get('/api/events/:eventId/locations', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    let allLocations = [];
    let nextPage = `https://api.planningcenteronline.com/check-ins/v2/events/${eventId}/locations?per_page=100`;
    while (nextPage) {
      const response = await axios.get(nextPage, {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        },
        headers: { 'Accept': 'application/json' }
      });
      allLocations = allLocations.concat(response.data.data || []);
      nextPage = response.data.links?.next;
    }
    res.json(allLocations);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch locations for event' });
  }
});

// GET /api/events/:eventId/locations/:locationId/active-checkins?date=YYYY-MM-DD
app.get('/api/events/:eventId/locations/:locationId/active-checkins', requireAuth, async (req, res) => {
  try {
    const { eventId, locationId } = req.params;
    const { date } = req.query;
    if (!date) {
      console.error('No date provided in request!');
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    // Build the Planning Center API URL with event, date, and include locations
    let url = `https://api.planningcenteronline.com/check-ins/v2/check_ins?where[event_id]=${eventId}&include=locations&where[created_at][gte]=${encodeURIComponent(date + 'T00:00:00Z')}`;

    console.log('[PCO API] Fetching check-ins with URL:', url);

    let allCheckIns = [];
    let allIncluded = [];
    let nextPage = url;
    while (nextPage) {
      const response = await axios.get(nextPage, {
        auth: {
          username: process.env.PCO_ACCESS_TOKEN,
          password: process.env.PCO_ACCESS_SECRET
        }
      });
      const { data, included, links } = response.data;
      allCheckIns = allCheckIns.concat(data);
      if (included) allIncluded = allIncluded.concat(included);
      nextPage = links && links.next ? links.next : null;
    }

    console.log('[PCO API] First 2 raw check-ins from PCO:', JSON.stringify(allCheckIns.slice(0,2), null, 2));
    console.log(`[PCO API] Total check-ins returned from PCO: ${allCheckIns.length}`);
    const locationCount = allIncluded.filter(item => item.type === 'Location').length;
    console.log(`[PCO API] Total locations in 'included': ${locationCount}`);

    // Build a map of locationId -> locationName
    const locationMap = {};
    allIncluded
      .filter(item => item.type === 'Location')
      .forEach(loc => {
        locationMap[loc.id] = loc.attributes.name;
      });

    // Format check-ins, filtering by locationId and only active (not checked out)
    const formatted = allCheckIns
      .filter(ci =>
        !ci.attributes.checked_out_at && // Only active check-ins
        Array.isArray(ci.relationships?.locations?.data) &&
        ci.relationships.locations.data.some(loc => loc.id === locationId)
      )
      .map(ci => {
        const locId = ci.relationships.locations.data.find(loc => loc.id === locationId)?.id || null;
        return {
          id: ci.id,
          security_code: ci.attributes.security_code,
          name: ci.attributes.person_name || [ci.attributes.first_name, ci.attributes.last_name].filter(Boolean).join(' ') || 'Unknown',
          created_at: ci.attributes.created_at,
          location_id: locId,
          location_name: locId ? locationMap[locId] || 'Unknown' : 'Unknown'
        };
      });

    console.log(`[PCO API] Check-ins after filtering by locationId (${locationId}): ${formatted.length}`);
    if (formatted.length > 0) {
      console.log('[PCO API] First 2 check-ins sent to frontend:', JSON.stringify(formatted.slice(0,2), null, 2));
    } else {
      console.log('[PCO API] No check-ins after filtering by locationId.');
    }

    res.json(formatted);
    console.log(`[PCO API] Returned ${formatted.length} check-ins for date=${date} and location=${locationId}`);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch active check-ins' });
  }
});

// Connect to MongoDB
connectDB();

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "PCO Arrivals Billboard API Documentation",
  customfavIcon: "/favicon.ico"
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error('Reason:', reason);
  logger.error('Promise:', promise);
  process.exit(1);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`PCO OAuth callback URL: ${REDIRECT_URI}`);
  if (authorizedUsers.length === 0) {
    console.log('Warning: No authorized users configured. The first user to log in will be granted admin access.');
  } else {
    console.log(`Authorized users: ${authorizedUsers.length}`);
    console.log(`Remember Me duration: ${REMEMBER_ME_DAYS} days`);
  }
});