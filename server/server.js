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
const { requireAuth, requireAuthOnly } = require('./middleware/auth');

// Import routes
// Note: Admin routes are defined directly in this file, not imported
// Note: Auth routes are defined directly in this file, not imported

// Create Express app instance
const app = express();
app.set('trust proxy', 1); // trust first proxy for secure cookies on Render

// Environment variables (from .env file)
const CLIENT_ID = process.env.PCO_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.PCO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'; 
const REDIRECT_URI = 'https://pco-arrivals-billboard.onrender.com/auth/callback';
const PORT = process.env.PORT || 3001;
const PCO_API_BASE = 'https://api.planningcenteronline.com/check-ins/v2';
const ACCESS_TOKEN = process.env.PCO_ACCESS_TOKEN;

// Environment variables for cookie settings
const COOKIE_SECRET = process.env.SESSION_SECRET || process.env.COOKIE_SECRET || 'pco-arrivals-session-secret';
const REMEMBER_ME_DAYS = 30; // Number of days to remember the user

// IDs of PCO users who are allowed to access the application
// Either hardcode them here or load from environment variables
const AUTHORIZED_USER_IDS = (process.env.AUTHORIZED_USERS || '').split(',').filter(id => id);

// Global billboard state manager
let globalBillboardState = {
  activeBillboard: null,
  lastUpdated: null,
  createdBy: null
};

// Simple cache for check-in data to reduce API calls
let checkInCache = {
  data: null,
  eventId: null,
  lastUpdated: null,
  cacheTimeout: 30000 // 30 seconds cache
};

// Simple notification system for child pickup
let activeNotifications = [];

// Function to update global billboard state
function updateGlobalBillboardState(eventId, eventName, securityCodes, eventDate, userId, userName) {
  globalBillboardState = {
    activeBillboard: {
      eventId,
      eventName,
      securityCodes: securityCodes || [],
      eventDate
    },
    lastUpdated: new Date(),
    createdBy: {
      id: userId,
      name: userName
    }
  };
  console.log('Global billboard state updated:', globalBillboardState);
}

// Function to clear global billboard state
function clearGlobalBillboardState() {
  globalBillboardState = {
    activeBillboard: null,
    lastUpdated: null,
    createdBy: null
  };
  console.log('Global billboard state cleared');
}

// Function to get cached check-in data
function getCachedCheckInData(eventId) {
  if (checkInCache.eventId === eventId && 
      checkInCache.data && 
      checkInCache.lastUpdated && 
      (Date.now() - checkInCache.lastUpdated.getTime()) < checkInCache.cacheTimeout) {
    return checkInCache.data;
  }
  return null;
}

// Function to update check-in cache
function updateCheckInCache(eventId, data) {
  checkInCache = {
    data,
    eventId,
    lastUpdated: new Date(),
    cacheTimeout: 30000
  };
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'https://arrivals.gracefm.org',
      'https://pco-arrivals-billboard-client.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true', // Use secure in production or when forced
    sameSite: 'lax', // Changed from 'none' to 'lax' for better mobile browser compatibility
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    // Add domain setting for better cross-subdomain support
    domain: process.env.NODE_ENV === 'production' ? '.gracefm.org' : undefined
  }
}));

// Note: This server only serves API endpoints
// The React frontend should be deployed separately

// Utility functions to load and save users
function loadAuthorizedUsers() {
  if (!fs.existsSync(path.join(__dirname, 'authorized_users.json'))) return [];
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'authorized_users.json'), 'utf-8'));
}

function saveAuthorizedUsers(users) {
  const filePath = path.join(__dirname, 'authorized_users.json');
  console.log(`[DEBUG] Saving ${users.length} users to:`, filePath);
  console.log(`[DEBUG] Users to save:`, users);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log(`[DEBUG] Successfully saved authorized_users.json`);
  } catch (error) {
    console.error(`[DEBUG] Error saving authorized_users.json:`, error);
    throw error;
  }
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
// (removed requireAuth and requireAuthOnly, now imported from middleware/auth.js)

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

// Mount routes
// Note: Admin routes are defined directly in this file, not mounted from admin.routes.js
// Note: Auth routes are defined directly in this file, not mounted from auth.routes.js

// Auth status endpoint
app.get('/api/auth-status', (req, res) => {
  console.log('Auth status check - Session:', {
    hasAccessToken: !!req.session.accessToken,
    hasUser: !!req.session.user,
    userIsAdmin: req.session.user?.isAdmin,
    sessionId: req.sessionID
  });
  
  const isAuthenticated = !!req.session.accessToken;
  const userData = req.session.user || null;
  
  // Add some user-friendly information
  res.json({ 
    authenticated: isAuthenticated,
    user: userData,
    loginUrl: isAuthenticated ? null : '/api/auth/pco',
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

app.put('/api/admin/users/:id', requireAuth, (req, res) => {
  if (!req.session.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const userId = req.params.id;
  const { name, email } = req.body;
  
  console.log(`[DEBUG] PUT /api/admin/users/${userId} called with:`, { name, email });
  console.log(`[DEBUG] Current authorizedUsers:`, authorizedUsers);
  
  const userIndex = authorizedUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    console.log(`[DEBUG] User not found: ${userId}`);
    return res.status(404).json({ message: 'User not found' });
  }
  
  console.log(`[DEBUG] Found user at index ${userIndex}:`, authorizedUsers[userIndex]);
  
  // Update user details
  const updatedUser = {
    ...authorizedUsers[userIndex],
    name: name || authorizedUsers[userIndex].name,
    email: email || authorizedUsers[userIndex].email
  };
  
  authorizedUsers[userIndex] = updatedUser;
  
  console.log(`[DEBUG] Updated user:`, updatedUser);
  console.log(`[DEBUG] Saving authorizedUsers:`, authorizedUsers);
  
  try {
    saveAuthorizedUsers(authorizedUsers); // Persist the change
    console.log(`[DEBUG] Successfully saved authorizedUsers to file`);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(`[DEBUG] Error saving authorizedUsers:`, error);
    res.status(500).json({ error: 'Failed to save user details' });
  }
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
app.get('/api/auth/pco', (req, res) => {
  console.log('🔵 OAuth route hit: /api/auth/pco');
  console.log('🔵 Query params:', req.query);
  req.session.rememberMe = req.query.remember === 'true';
  
  // Enhanced mobile debugging
  const userAgent = req.get('User-Agent') || '';
  const isMobile = isMobileDevice(userAgent) || req.query.mobile === 'true';
  console.log('📱 OAuth initiation from mobile:', { isMobile, userAgent: userAgent.substring(0, 100) + '...' });
  const scopes = ['check_ins', 'people'];
  const redirectUri = REDIRECT_URI;
  const authUrl = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join(' ')}`;
  console.log('🔵 Redirecting to:', authUrl);
  res.redirect(authUrl);
});

// OAuth callback route (must be before catch-all)
app.get('/auth/callback', async (req, res) => {
  console.log('==== /auth/callback route hit ====');
  console.log('🔵 /auth/callback hit with query:', req.query);
  
  // Enhanced mobile debugging
  const userAgent = req.get('User-Agent') || '';
  const isMobile = isMobileDevice(userAgent);
  console.log('📱 Mobile detection:', { isMobile, userAgent: userAgent.substring(0, 100) + '...' });
  console.log('🍪 Cookie header present:', !!req.get('Cookie'));
  console.log('🌐 Request origin:', req.get('Origin') || 'No origin header');
  const { code } = req.query;
  if (!code) {
    console.log('❌ No authorization code provided');
    return res.status(400).send('Authorization code missing');
  }
  
  console.log('🟢 Processing authorization code:', code.substring(0, 10) + '...');
  
  try {
    // Form data for token request
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    
    console.log('🟢 Exchanging code for token...');
    const tokenResponse = await axios.post(
      'https://api.planningcenteronline.com/oauth/token', 
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('🟢 Token exchange successful');
    
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
      console.log('🟢 Fetching user information...');
      const userResponse = await axios.get('https://api.planningcenteronline.com/people/v2/me', {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`,
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
      
      console.log('🟢 User data fetched:', req.session.user.name, 'ID:', userId);
      
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
        
        console.log(`🟢 First user automatically authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        console.log('🟢 CLIENT_URL:', process.env.CLIENT_URL);
        console.log('🔵 [DEBUG] Before session.save:', req.sessionID, req.session);
        return req.session.save((err) => {
          if (err) {
            console.error('❌ [DEBUG] Session save error:', err);
            return res.status(500).send('Session save failed');
          }
          console.log('🟢 [DEBUG] After session.save:', req.sessionID, req.session);
          res.redirect('/api/auth/success');
        });
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
        console.log(`🟢 User authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        
        // Redirect to admin panel
        console.log('🟢 CLIENT_URL:', process.env.CLIENT_URL);
        console.log('🔵 [DEBUG] Before session.save:', req.sessionID, req.session);
        return req.session.save((err) => {
          if (err) {
            console.error('❌ [DEBUG] Session save error:', err);
            return res.status(500).send('Session save failed');
          }
          console.log('🟢 [DEBUG] After session.save:', req.sessionID, req.session);
          res.redirect('/api/auth/success');
        });
      } else {
        console.log(`🟡 User not authorized: ${req.session.user.name} (${req.session.user.email}) - ID: ${userId}`);
        
        // Unauthorized user
        req.session.user.isAdmin = false;
        console.log('🟢 CLIENT_URL:', process.env.CLIENT_URL);
        console.log('🔵 [DEBUG] Before session.save:', req.sessionID, req.session);
        return req.session.save((err) => {
          if (err) {
            console.error('❌ [DEBUG] Session save error:', err);
            return res.status(500).send('Session save failed');
          }
          console.log('🟢 [DEBUG] After session.save:', req.sessionID, req.session);
          res.redirect('/api/auth/success');
        });
      }
    } catch (userError) {
      console.error('❌ Failed to fetch user data:', userError.response?.data || userError.message);
      req.session.destroy();
      res.status(500).send('Authentication successful but failed to retrieve user data. Please try again.');
    }
  } catch (error) {
    console.error('❌ OAuth Error:', error.response?.data || error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Keep the API callback route for backward compatibility but make it redirect to the main callback
app.get('/api/auth/callback', async (req, res) => {
  console.log('🟡 /api/auth/callback hit - redirecting to /auth/callback');
  const queryString = req.url.split('?')[1] || '';
  res.redirect(`/auth/callback?${queryString}`);
});

// Intermediate success route to set cookie and redirect to client
app.get('/api/auth/success', (req, res) => {
  console.log('🟡 /api/auth/success hit');
  console.log('🟡 Session user:', req.session.user);
  
  let clientUrl = process.env.CLIENT_URL;
  
  // If CLIENT_URL is not set, try to determine from request headers
  if (!clientUrl) {
    // Use the host header to determine the domain
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    clientUrl = `${protocol}://${host}`;
    console.log('🟡 CLIENT_URL not set, using derived URL:', clientUrl);
  }
  
  // Fallback to localhost only in development
  if (!clientUrl && process.env.NODE_ENV === 'development') {
    clientUrl = 'http://localhost:3000';
  }
  
  console.log('🟡 Redirecting to client URL:', clientUrl + '/admin');
  res.send(`
    <html>
      <body>
        <script>
          window.location.href = '${clientUrl}/admin';
        </script>
      </body>
    </html>
  `);
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    REDIRECT_URI: process.env.REDIRECT_URI,
    HARDCODED_REDIRECT_URI: REDIRECT_URI,
    host: req.get('host'),
    'x-forwarded-proto': req.get('x-forwarded-proto'),
    'x-forwarded-host': req.get('x-forwarded-host'),
    referer: req.get('referer'),
    secure: req.secure
  });
});

// Debug endpoint to check all active notifications
app.get('/api/debug/notifications', (req, res) => {
  res.json({
    totalNotifications: activeNotifications.length,
    notifications: activeNotifications,
    globalBillboardState: globalBillboardState
  });
});

// Debug endpoint to check session and global state
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userIsAdmin: req.session?.user?.isAdmin,
    hasAccessToken: !!req.session?.accessToken,
    globalBillboardState: globalBillboardState,
    authorizedUsers: authorizedUsers.length
  });
});

// Helper function to detect mobile devices
function isMobileDevice(userAgent) {
  const mobileKeywords = [
    'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
    'Windows Phone', 'Opera Mini', 'IEMobile', 'Mobile Safari'
  ];
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

// Debug endpoint for mobile-specific issues
app.get('/api/debug/mobile', (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = isMobileDevice(userAgent);
  
  res.json({
    userAgent,
    isMobile,
    headers: {
      'user-agent': req.get('User-Agent'),
      'accept': req.get('Accept'),
      'accept-language': req.get('Accept-Language'),
      'accept-encoding': req.get('Accept-Encoding'),
      'connection': req.get('Connection'),
      'upgrade-insecure-requests': req.get('Upgrade-Insecure-Requests'),
      'sec-fetch-dest': req.get('Sec-Fetch-Dest'),
      'sec-fetch-mode': req.get('Sec-Fetch-Mode'),
      'sec-fetch-site': req.get('Sec-Fetch-Site'),
      'cookie': req.get('Cookie') ? 'Present' : 'Not Present'
    },
    session: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.session?.user,
      hasAccessToken: !!req.session?.accessToken,
      cookieSettings: {
        secure: req.session?.cookie?.secure,
        sameSite: req.session?.cookie?.sameSite,
        httpOnly: req.session?.cookie?.httpOnly,
        domain: req.session?.cookie?.domain,
        maxAge: req.session?.cookie?.maxAge
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      clientUrl: process.env.CLIENT_URL,
      redirectUri: REDIRECT_URI
    }
  });
});

// Debug endpoint to check cross-user access and active sessions
app.get('/api/debug/cross-user-access', async (req, res) => {
  try {
    // Get all active sessions from MongoDB store
    const sessionStore = req.sessionStore;
    let activeSessions = [];
    
    if (sessionStore && sessionStore.store && sessionStore.store.get) {
      try {
        // This is a simplified approach - in production you might want to use a more robust method
        activeSessions = await new Promise((resolve) => {
          sessionStore.store.get('*', (err, sessions) => {
            if (err) {
              console.log('[DEBUG] Could not retrieve all sessions:', err.message);
              resolve([]);
            } else {
              resolve(sessions || []);
            }
          });
        });
      } catch (sessionError) {
        console.log('[DEBUG] Session retrieval error:', sessionError.message);
      }
    }
    
    res.json({
      currentUser: req.session?.user ? {
        id: req.session.user.id,
        name: req.session.user.name,
        isAdmin: req.session.user.isAdmin
      } : null,
      globalBillboardState: {
        hasActiveBillboard: !!globalBillboardState.activeBillboard,
        eventName: globalBillboardState.activeBillboard?.eventName,
        eventId: globalBillboardState.activeBillboard?.eventId,
        createdBy: globalBillboardState.createdBy,
        lastUpdated: globalBillboardState.lastUpdated
      },
      activeNotifications: {
        count: activeNotifications.length,
        recent: activeNotifications.slice(0, 5) // Show first 5
      },
      authorizedUsers: authorizedUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      })),
      sessionInfo: {
        totalSessions: activeSessions.length,
        sessionStoreType: sessionStore?.constructor?.name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error in cross-user access debug:', error);
    res.status(500).json({ error: 'Debug endpoint error', message: error.message });
  }
});

// Update logout route to clear cookies properly
app.get('/api/auth/logout', (req, res) => {
  console.log('🔴 Logout route hit');
  console.log('🔴 Environment variables:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - CLIENT_URL:', process.env.CLIENT_URL);
  console.log('🔴 Request headers:');
  console.log('  - host:', req.get('host'));
  console.log('  - x-forwarded-proto:', req.get('x-forwarded-proto'));
  console.log('  - x-forwarded-host:', req.get('x-forwarded-host'));
  console.log('  - referer:', req.get('referer'));
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.clearCookie('connect.sid');

    // Support redirectTo query parameter
    let clientUrl = process.env.CLIENT_URL;
    console.log('🔴 Initial clientUrl from env:', clientUrl);
    
    // If CLIENT_URL is not set, try to determine from request headers
    if (!clientUrl) {
      // Use the host header to determine the domain
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
      clientUrl = `${protocol}://${host}`;
      console.log('🔴 CLIENT_URL not set, using derived URL:', clientUrl);
    }
    
    // Fallback to localhost only in development
    if (!clientUrl && process.env.NODE_ENV === 'development') {
      clientUrl = 'http://localhost:3000';
      console.log('🔴 Using localhost fallback for development');
    }
    
    console.log('🔴 Final clientUrl:', clientUrl);
    
    let redirectTo = req.query.redirectTo;
    console.log('🔴 redirectTo query param:', redirectTo);
    
    if (redirectTo) {
      // Only allow redirects to the client URL or its subpaths for security
      const allowedOrigins = [clientUrl];
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:3000');
      }
      
      console.log('🔴 Allowed origins:', allowedOrigins);
      
      try {
        const url = new URL(redirectTo, clientUrl);
        console.log('🔴 Parsed redirect URL:', url.href);
        if (allowedOrigins.some(origin => url.origin === origin)) {
          console.log('🔴 Redirecting to:', url.href);
          return res.redirect(url.href);
        } else {
          console.log('🔴 Redirect URL not allowed:', url.href);
        }
      } catch (e) {
        console.log('🔴 Invalid redirect URL:', redirectTo, 'Error:', e.message);
        // Invalid URL, fall back to default
      }
    }
    
    const finalRedirectUrl = `${clientUrl}/login`;
    console.log('🔴 Final logout redirect to:', finalRedirectUrl);
    res.redirect(finalRedirectUrl);
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
app.get('/api/events-by-date', requireAuthOnly, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { date } = req.query;
    console.log('Server: events-by-date called with date:', date);
    
    // Validate date format
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Server: Invalid date format received:', date);
      return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
    }
    
    // Format the URL based on whether a date is provided
    let url = `${PCO_API_BASE}/events`;
    if (date) {
      // PCO date filter format: YYYY-MM-DD
      const formattedDate = date.split('T')[0];
      // Include all events for the specific date, including past events
      url += `?where[starts_at]=${formattedDate}&include=time`;
    }
    
    console.log(`Server: Fetching events from: ${url}`);
    
    const response = await axios.get(url, {
      auth: {
        username: process.env.PCO_ACCESS_TOKEN,
        password: process.env.PCO_ACCESS_SECRET
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`Server: PCO API response status: ${response.status}`);
    console.log(`Server: PCO API returned ${response.data.data?.length || 0} events`);
    
    // Filter events to only exclude archived ones
    const nonArchivedEvents = response.data.data.filter(event => event.attributes.archived !== true);
    
    // Sort events by start time
    const sortedEvents = nonArchivedEvents.sort((a, b) => {
      const timeA = new Date(a.attributes.starts_at);
      const timeB = new Date(b.attributes.starts_at);
      return timeA - timeB;
    });
    
    // Debug logging
    console.log(`Server: Selected date: ${date}`);
    console.log(`Server: Total events found: ${response.data.data.length}`);
    console.log(`Server: Non-archived events: ${sortedEvents.length}`);
    sortedEvents.forEach(event => {
      console.log(`Server: Event: ${event.attributes.name}, Date: ${event.attributes.starts_at}, Archived: ${event.attributes.archived}`);
    });
    
    res.json(sortedEvents);
  } catch (error) {
    console.error('Server: API Error:', error.response?.data || error.message);
    console.error('Server: Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method
    });
    
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: status === 401 ? 'Authentication expired' : 'Failed to fetch events',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/security-codes', requireAuthOnly, async (req, res) => {
  try {
    const accessToken = await ensureValidToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { eventId, securityCodes, eventName, eventDate } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    // If securityCodes is provided and non-empty, use optimized logic
    if (securityCodes && securityCodes.length > 0) {
      try {
        // Check cache first
        let allCheckIns, included;
        const cachedData = getCachedCheckInData(eventId);
        
        if (cachedData) {
          console.log('Using cached check-in data for event:', eventId);
          allCheckIns = cachedData.data;
          included = cachedData.included;
        } else {
          console.log('Fetching fresh check-in data for event:', eventId);
          // Make a single API call to get all check-ins for the event
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
          
          allCheckIns = checkInResponse.data.data;
          included = checkInResponse.data.included || [];
          
          // Cache the data
          updateCheckInCache(eventId, { data: allCheckIns, included });
        }
        
        // Filter check-ins by the requested security codes
        const filteredCheckIns = allCheckIns.filter(checkIn => 
          securityCodes.includes(checkIn.attributes.security_code?.toLowerCase())
        );
        
        const results = [];
        
        // Group check-ins by security code and household
        const groupedCheckIns = {};
        
        filteredCheckIns.forEach(checkIn => {
          const securityCode = checkIn.attributes.security_code?.toLowerCase();
          if (!groupedCheckIns[securityCode]) {
            groupedCheckIns[securityCode] = {};
          }
          
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
          
          if (!groupedCheckIns[securityCode][householdId]) {
            groupedCheckIns[securityCode][householdId] = {
              householdName,
              members: []
            };
          }
          
          groupedCheckIns[securityCode][householdId].members.push({
            id: checkIn.id,
            firstName: person?.attributes?.first_name || 'Unknown',
            lastName: person?.attributes?.last_name || 'Unknown',
            eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name,
            securityCode: checkIn.attributes.security_code,
            checkedOut: !!checkIn.attributes.checked_out_at,
            checkInTime: checkIn.attributes.created_at,
            checkOutTime: checkIn.attributes.checked_out_at,
            householdName
          });
        });
        
        // Add all grouped members to results
        Object.values(groupedCheckIns).forEach(securityCodeGroup => {
          Object.values(securityCodeGroup).forEach(group => {
            results.push(...group.members);
          });
        });
        
        // Add error entries for security codes that weren't found
        const foundSecurityCodes = new Set(filteredCheckIns.map(ci => ci.attributes.security_code?.toLowerCase()));
        securityCodes.forEach(code => {
          if (!foundSecurityCodes.has(code.toLowerCase())) {
            results.push({
              securityCode: code,
              error: 'No check-in found with this security code'
            });
          }
        });
        
        // Update global billboard state if eventName is provided
        if (eventName) {
          const userId = req.session.user?.id;
          const userName = req.session.user?.name;
          updateGlobalBillboardState(eventId, eventName, securityCodes, eventDate, userId, userName);
        }
        
        res.json(results);
      } catch (apiError) {
        console.error('PCO API Error:', apiError.response?.data || apiError.message);
        
        // If we hit rate limiting, return cached data if available
        if (apiError.response?.status === 429) {
          console.log('Rate limited by PCO API, returning cached data if available');
          const cachedData = getCachedCheckInData(eventId);
          if (cachedData) {
            // Process cached data
            const filteredCheckIns = cachedData.data.filter(checkIn => 
              securityCodes.includes(checkIn.attributes.security_code?.toLowerCase())
            );
            // Return basic results from cache
            res.json(filteredCheckIns.map(checkIn => ({
              id: checkIn.id,
              firstName: checkIn.attributes.first_name || 'Unknown',
              lastName: checkIn.attributes.last_name || 'Unknown',
              securityCode: checkIn.attributes.security_code,
              checkedOut: !!checkIn.attributes.checked_out_at,
              checkInTime: checkIn.attributes.created_at
            })));
          } else {
            // No cache available, return error
            res.json(securityCodes.map(code => ({
              securityCode: code,
              error: 'Rate limited - please try again in a few seconds'
            })));
          }
        } else {
          res.status(500).json({ error: 'Failed to fetch security code data' });
        }
      }
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

app.get('/api/events/:eventId/active-people', requireAuthOnly, async (req, res) => {
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
app.get('/api/events/:eventId/locations', requireAuthOnly, async (req, res) => {
  try {
    const { eventId } = req.params;
    const accessToken = await ensureValidToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    console.log(`[DEBUG] Fetching locations for event: ${eventId}`);
    
    let allLocations = [];
    let nextPage = `${PCO_API_BASE}/events/${eventId}/locations?per_page=100`;
    console.log(`[DEBUG] Initial PCO API URL: ${nextPage}`);
    
    while (nextPage) {
      try {
        const response = await axios.get(nextPage, {
          auth: {
            username: process.env.PCO_ACCESS_TOKEN,
            password: process.env.PCO_ACCESS_SECRET
          },
          headers: { 'Accept': 'application/json' }
        });
        
        console.log(`[DEBUG] PCO API response status: ${response.status}`);
        console.log(`[DEBUG] PCO API returned ${response.data.data?.length || 0} locations`);
        
        allLocations = allLocations.concat(response.data.data || []);
        nextPage = response.data.links?.next;
      } catch (apiError) {
        console.error(`[DEBUG] PCO API error for URL ${nextPage}:`, apiError.response?.data || apiError.message);
        if (apiError.response?.status === 404) {
          console.log(`[DEBUG] Event ${eventId} not found or has no locations`);
          break;
        }
        throw apiError;
      }
    }
    
    console.log(`[DEBUG] Total locations found: ${allLocations.length}`);
    res.json(allLocations);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch locations for event' });
  }
});

// GET /api/events/:eventId/locations/:locationId/active-checkins?date=YYYY-MM-DD
app.get('/api/events/:eventId/locations/:locationId/active-checkins', requireAuthOnly, async (req, res) => {
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

    console.log(`[DEBUG] PCO returned check-ins:`, JSON.stringify(allCheckIns, null, 2));
    console.log(`[DEBUG] PCO returned ${allCheckIns.length} check-ins`);
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

// Get all active check-ins
app.get('/api/check-ins', requireAuth, async (req, res) => {
  try {
    const { locationId } = req.query;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Get check-ins from PCO API
    const response = await axios.get(`${PCO_API_BASE}/check_ins?include=person,locations`, {
      auth: {
        username: process.env.PCO_ACCESS_TOKEN,
        password: process.env.PCO_ACCESS_SECRET
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const allCheckIns = response.data.data;
    const allIncluded = response.data.included || [];

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

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Global billboard state endpoints
app.get('/api/global-billboard', (req, res) => {
  try {
    // Log access for debugging cross-user access
    const userInfo = req.session?.user ? {
      id: req.session.user.id,
      name: req.session.user.name,
      isAdmin: req.session.user.isAdmin
    } : 'No user session';
    
    console.log(`[CROSS-USER] Global billboard accessed by:`, userInfo);
    console.log(`[CROSS-USER] Current global state:`, {
      hasActiveBillboard: !!globalBillboardState.activeBillboard,
      eventName: globalBillboardState.activeBillboard?.eventName,
      createdBy: globalBillboardState.createdBy,
      lastUpdated: globalBillboardState.lastUpdated
    });
    
    res.json(globalBillboardState);
  } catch (error) {
    console.error('Error getting global billboard state:', error);
    res.status(500).json({ error: 'Failed to get global billboard state' });
  }
});

app.post('/api/global-billboard', requireAuthOnly, async (req, res) => {
  try {
    const { eventId, eventName, securityCodes, eventDate } = req.body;
    const userId = req.session.user?.id;
    const userName = req.session.user?.name;
    
    console.log(`[CROSS-USER] Setting global billboard by user:`, { userId, userName });
    
    if (!eventId || !eventName) {
      return res.status(400).json({ error: 'Event ID and event name are required' });
    }
    
    updateGlobalBillboardState(eventId, eventName, securityCodes, eventDate, userId, userName);
    
    // Log the update for cross-user debugging
    console.log(`[CROSS-USER] Global billboard updated successfully by ${userName} (${userId})`);
    console.log(`[CROSS-USER] New state:`, globalBillboardState);
    
    res.json(globalBillboardState);
  } catch (error) {
    console.error('Error setting global billboard state:', error);
    res.status(500).json({ error: 'Failed to set global billboard state' });
  }
});

app.delete('/api/global-billboard', requireAuthOnly, (req, res) => {
  try {
    clearGlobalBillboardState();
    // Also clear active notifications when global billboard is cleared
    const beforeCount = activeNotifications.length;
    activeNotifications.length = 0;
    console.log(`Global billboard state and ${beforeCount} active notifications cleared`);
    res.json({ 
      message: 'Global billboard state and active notifications cleared',
      notificationsCleared: beforeCount
    });
  } catch (error) {
    console.error('Error clearing global billboard state:', error);
    res.status(500).json({ error: 'Failed to clear global billboard state' });
  }
});

// GET /api/billboard/check-ins - Get active check-ins for a location
app.get('/api/billboard/check-ins', requireAuthOnly, async (req, res) => {
  try {
    const { locationId, eventId, date } = req.query;
    
    console.log(`[DEBUG] /api/billboard/check-ins called with locationId: ${locationId}, eventId: ${eventId}, date: ${date}`);

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Build the URL with date filter if provided
    let url = `${PCO_API_BASE}/events/${eventId}/check_ins?include=person,locations&per_page=100`;
    if (date) {
      // Add date filter to only get check-ins for the specific date
      url += `&where[created_at][gte]=${date}T00:00:00Z&where[created_at][lt]=${date}T23:59:59Z`;
    }
    
    console.log(`[DEBUG] Fetching check-ins from PCO with URL: ${url}`);
    
    // Fetch check-ins for the specific event with pagination
    let allCheckIns = [];
    let allIncluded = [];
    let nextPage = url;
    
    console.log(`[DEBUG] Starting to fetch check-ins with pagination from: ${nextPage}`);
    
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

      const { data, included, links } = response.data;
      allCheckIns = allCheckIns.concat(data || []);
      if (included) allIncluded = allIncluded.concat(included);
      nextPage = links && links.next ? links.next : null;
      
      console.log(`[DEBUG] Fetched page with ${data?.length || 0} check-ins, total so far: ${allCheckIns.length}`);
    }
    
    console.log(`[DEBUG] Finished fetching all pages. Total check-ins: ${allCheckIns.length}, total included: ${allIncluded.length}`);

    const checkIns = allCheckIns;
    const included = allIncluded;

    console.log(`[DEBUG] Total check-ins returned from PCO for event ${eventId}${date ? ` on date ${date}` : ''}: ${checkIns.length}`);
    console.log(`[DEBUG] Total included items: ${included.length}`);
    
    // Process check-ins for the specific event
    const eventCheckIns = [];
    let checkInsWithLocations = 0;
    let checkInsWithoutLocations = 0;
    let checkedOutCount = 0;
    let noPersonDataCount = 0;

    checkIns.forEach((checkIn, index) => {
      // Log check-ins that are being filtered out
      if (checkIn.attributes.checked_out_at) {
        console.log(`[DEBUG] Skipping checked-out check-in ${checkIn.id} (checked out at: ${checkIn.attributes.checked_out_at})`);
        checkedOutCount++;
        return; // Skip checked out check-ins
      }

      const location = included.find(item =>
        item.type === 'Location' &&
        item.id === checkIn.relationships.locations?.data?.[0]?.id
      );
      
      const person = included.find(item => 
        item.type === 'Person' && 
        item.id === checkIn.relationships.person?.data?.id
      );
      
      if (person) {
        const checkInTimeRaw = checkIn.attributes.created_at;
        let checkInTime = '';
        if (checkInTimeRaw) {
          const dateObj = new Date(checkInTimeRaw);
          checkInTime = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
        }
        const checkInData = {
          id: checkIn.id,
          name: `${person.attributes.first_name} ${person.attributes.last_name}`,
          securityCode: checkIn.attributes.security_code || '',
          checkInTime,
          locationName: location ? location.attributes.name : 'No Location Assigned',
          locationId: location ? location.id : null,
          eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name
        };
        
        eventCheckIns.push(checkInData);
        
        if (location) {
          checkInsWithLocations++;
        } else {
          checkInsWithoutLocations++;
        }
      } else {
        console.log(`[DEBUG] Check-in ${index} has no person data:`, checkIn.id, checkIn.attributes);
        noPersonDataCount++;
      }
    });

    console.log(`[DEBUG] Processing summary for event ${eventId}:`);
    console.log(`[DEBUG] - Total check-ins from PCO: ${checkIns.length}`);
    console.log(`[DEBUG] - Checked out (filtered out): ${checkedOutCount}`);
    console.log(`[DEBUG] - No person data (filtered out): ${noPersonDataCount}`);
    console.log(`[DEBUG] - Active check-ins (included): ${eventCheckIns.length}`);
    console.log(`[DEBUG] - Check-ins with locations: ${checkInsWithLocations}`);
    console.log(`[DEBUG] - Check-ins without locations: ${checkInsWithoutLocations}`);

    // If locationId is provided, filter by location (but still show those without locations)
    if (locationId && locationId !== 'all') {
      const filteredCheckIns = eventCheckIns.filter(checkIn => 
        checkIn.locationId === locationId || checkIn.locationId === null
      );
      console.log(`[DEBUG] Filtered to ${filteredCheckIns.length} check-ins for locationId ${locationId} (including those without locations)`);
      res.json(filteredCheckIns);
    } else {
      // Return all active check-ins for the event
      console.log(`[DEBUG] Returning all ${eventCheckIns.length} active check-ins for event ${eventId}`);
      res.json(eventCheckIns);
    }
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Check for billboard updates endpoint
app.get('/api/billboard-updates', requireAuthOnly, async (req, res) => {
  try {
    const { lastUpdate, eventId } = req.query;
    
    // If no global billboard state, return empty
    if (!globalBillboardState.activeBillboard) {
      return res.json({
        hasUpdates: false,
        lastUpdated: null,
        activeBillboard: null
      });
    }
    
    // Check if the event matches
    if (eventId && globalBillboardState.activeBillboard.eventId !== eventId) {
      return res.json({
        hasUpdates: false,
        lastUpdated: globalBillboardState.lastUpdated,
        activeBillboard: globalBillboardState.activeBillboard
      });
    }
    
    // Check if there are updates since last check
    const hasUpdates = !lastUpdate || 
      new Date(globalBillboardState.lastUpdated) > new Date(lastUpdate);
    
    res.json({
      hasUpdates,
      lastUpdated: globalBillboardState.lastUpdated,
      activeBillboard: globalBillboardState.activeBillboard,
      createdBy: globalBillboardState.createdBy
    });
  } catch (error) {
    console.error('Error checking billboard updates:', error);
    res.status(500).json({ error: 'Failed to check billboard updates' });
  }
});

// Test session route for debugging session/cookie issues
app.get('/test-session', (req, res) => {
  req.session.test = 'hello';
  req.session.save((err) => {
    if (err) return res.status(500).send('Session save failed');
    res.send('Session set');
  });
});

// POST /api/security-code-entry - Volunteers enter security codes from parents
app.post('/api/security-code-entry', async (req, res) => {
  try {
    const { securityCode, eventId, eventDate } = req.body;
    
    if (!securityCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security code is required' 
      });
    }

    if (!eventId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID is required' 
      });
    }

    if (!eventDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event date is required' 
      });
    }

    console.log(`[SECURITY CODE] Searching for security code ${securityCode} in event ${eventId} on date ${eventDate}`);

    // Search for active check-ins with this security code, filtered by event and date
    const url = `${PCO_API_BASE}/check_ins?where[security_code]=${securityCode}&where[event_id]=${eventId}&include=person,locations`;
    console.log(`[SECURITY CODE] PCO API URL: ${url}`);
    
    const checkInResponse = await axios.get(url, {
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

    console.log(`[SECURITY CODE] Found ${checkIns.length} total check-ins with security code ${securityCode} in event ${eventId}`);

    // Filter by date and active status
    const activeCheckIns = checkIns.filter(checkIn => {
      const isActive = !checkIn.attributes.checked_out_at;
      const checkInDate = new Date(checkIn.attributes.created_at).toISOString().split('T')[0];
      const matchesDate = checkInDate === eventDate;
      
      console.log(`[SECURITY CODE] Check-in ${checkIn.id}: active=${isActive}, date=${checkInDate}, matches=${matchesDate}`);
      
      return isActive && matchesDate;
    });

    console.log(`[SECURITY CODE] Found ${activeCheckIns.length} active check-ins for date ${eventDate}`);

    if (activeCheckIns.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No active check-in found with this security code for the current event and date. The child may have already been checked out or may not be checked in for this event.' 
      });
    }

    const addedChildren = [];
    for (const activeCheckIn of activeCheckIns) {
      // Get person and location information
      const person = included.find(item => 
        item.type === 'Person' && 
        item.id === activeCheckIn.relationships.person?.data?.id
      );
      const location = included.find(item =>
        item.type === 'Location' &&
        item.id === activeCheckIn.relationships.locations?.data?.[0]?.id
      );
      const childName = person ? 
        `${person.attributes.first_name} ${person.attributes.last_name}` : 
        'Unknown Child';
      const locationName = location?.attributes?.name || 'Unknown Location';
      
      // Check if notification already exists
      const existingNotification = activeNotifications.find(n => 
        n.checkInId === activeCheckIn.id
      );
      if (!existingNotification) {
        // Create new notification
        const notification = {
          id: Date.now().toString() + Math.floor(Math.random() * 10000),
          checkInId: activeCheckIn.id,
          securityCode: securityCode.toUpperCase(),
          childName,
          locationName,
          notifiedAt: new Date().toISOString(),
          checkInTime: activeCheckIn.attributes.created_at,
          personId: person?.id,
          locationId: location?.id,
          eventId: eventId,
          eventDate: eventDate
        };
        console.log(`[SECURITY CODE] Created notification:`, {
          childName,
          securityCode: securityCode.toUpperCase(),
          eventId,
          eventDate,
          notificationId: notification.id
        });
        activeNotifications.push(notification);
        addedChildren.push({ childName, locationName });
        console.log(`[SECURITY CODE] New pickup request: ${childName} (${securityCode}) from ${locationName} in event ${eventId}`);
      }
    }

    if (addedChildren.length > 0) {
      // Always include childName for frontend compatibility
      let childName = '';
      if (addedChildren.length === 1) {
        childName = addedChildren[0].childName;
      } else {
        childName = addedChildren.map(c => c.childName).join(', ');
      }
      res.json({ 
        success: true, 
        addedChildren,
        childName,
        message: `${addedChildren.length} child(ren) have been added to the pickup list.` 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'All children with this security code are already on the pickup list.' 
      });
    }

  } catch (error) {
    console.error('Error processing security code entry:', error);
    if (error.response?.status === 429) {
      res.status(429).json({ 
        success: false, 
        message: 'Service temporarily unavailable. Please try again in a moment.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred. Please try again.' 
      });
    }
  }
});

// GET /api/active-notifications - Get all active notifications
app.get('/api/active-notifications', async (req, res) => {
  try {
    const { eventId, eventDate } = req.query;
    console.log(`[DEBUG] /api/active-notifications called with ${activeNotifications.length} notifications`);
    if (eventId && eventDate) {
      console.log(`[DEBUG] Filtering by event: ${eventId}, date: ${eventDate}`);
    }
    
    // Filter notifications by event if specified, but be more lenient
    let filteredNotifications = activeNotifications;
    if (eventId && eventDate) {
      // First try exact match
      filteredNotifications = activeNotifications.filter(n => 
        n.eventId === eventId && n.eventDate === eventDate
      );
      
      // If no exact matches, try just eventId (in case date format differs)
      if (filteredNotifications.length === 0) {
        filteredNotifications = activeNotifications.filter(n => n.eventId === eventId);
        console.log(`[DEBUG] No exact matches, trying eventId only: ${filteredNotifications.length} notifications`);
      }
      
      // If still no matches, show all notifications (for debugging)
      if (filteredNotifications.length === 0) {
        console.log(`[DEBUG] No matches found, showing all notifications for debugging`);
        filteredNotifications = activeNotifications;
      }
      
      console.log(`[DEBUG] Filtered to ${filteredNotifications.length} notifications for event ${eventId}`);
    }
    
    // Only check PCO for checked-out children if we have notifications and it's not too frequent
    if (filteredNotifications.length > 0) {
      const checkInIds = filteredNotifications.map(n => n.checkInId);
      console.log(`[DEBUG] Checking PCO for ${checkInIds.length} check-in IDs`);
      
      try {
        // Use a more efficient approach - check in smaller batches
        const batchSize = 10;
        const checkedOutIds = [];
        
        for (let i = 0; i < checkInIds.length; i += batchSize) {
          const batch = checkInIds.slice(i, i + batchSize);
          console.log(`[DEBUG] Checking batch ${Math.floor(i/batchSize) + 1}: ${batch.length} check-ins`);
          
          const batchResults = await Promise.all(
            batch.map(async (id) => {
              try {
                const resp = await axios.get(
                  `${PCO_API_BASE}/check_ins/${id}`,
                  {
                    auth: {
                      username: process.env.PCO_ACCESS_TOKEN,
                      password: process.env.PCO_ACCESS_SECRET
                    },
                    headers: { 'Accept': 'application/json' }
                  }
                );
                return resp.data.data;
              } catch (err) {
                console.error(`[DEBUG] Individual call failed for ${id}:`, err.message);
                return null;
              }
            })
          );
          
          // Check which ones are checked out
          batchResults.forEach(checkIn => {
            if (checkIn && checkIn.attributes && checkIn.attributes.checked_out_at) {
              checkedOutIds.push(checkIn.id);
            }
          });
        }
        
        console.log(`[DEBUG] Found ${checkedOutIds.length} checked-out check-ins:`, checkedOutIds);
        
        if (checkedOutIds.length > 0) {
          const beforeCount = filteredNotifications.length;
          filteredNotifications = filteredNotifications.filter(n => 
            !checkedOutIds.includes(n.checkInId)
          );
          const afterCount = filteredNotifications.length;
          if (beforeCount !== afterCount) {
            console.log(`[DEBUG] Removed ${beforeCount - afterCount} notifications for checked-out children`);
          }
        }
      } catch (apiError) {
        console.error('[DEBUG] Error checking PCO for checked-out children:', apiError.message);
        // Continue with existing notifications if API call fails
        if (apiError.response?.status === 429) {
          console.log('[DEBUG] Rate limited - keeping existing notifications');
        }
      }
    } else {
      console.log(`[DEBUG] No active notifications to check`);
    }
    
    console.log(`[DEBUG] Returning ${filteredNotifications.length} notifications`);
    res.json(filteredNotifications);
  } catch (error) {
    console.error('Error getting active notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// POST /api/checkout-notification - Remove notification when child is checked out
app.post('/api/checkout-notification', async (req, res) => {
  try {
    const { checkInId } = req.body;
    
    if (!checkInId) {
      return res.status(400).json({ error: 'Check-in ID is required' });
    }

    // Remove notification from active list
    const initialLength = activeNotifications.length;
    activeNotifications = activeNotifications.filter(n => n.checkInId !== checkInId);
    
    const removed = initialLength !== activeNotifications.length;
    
    if (removed) {
      console.log(`Removed notification for check-in: ${checkInId}`);
    }

    res.json({ 
      success: true, 
      removed,
      message: removed ? 'Notification removed' : 'Notification not found' 
    });

  } catch (error) {
    console.error('Error checking out notification:', error);
    res.status(500).json({ error: 'Failed to checkout notification' });
  }
});

// Cleanup old notifications and check for checked-out children (run every 5 minutes)
setInterval(async () => {
  try {
    const currentTime = new Date();
    const thirtyMinutesAgo = new Date(currentTime.getTime() - 30 * 60 * 1000); // Increased to 30 minutes
    
    // Remove notifications older than 30 minutes
    const initialLength = activeNotifications.length;
    activeNotifications = activeNotifications.filter(notification => {
      const notificationTime = new Date(notification.notifiedAt);
      return notificationTime > thirtyMinutesAgo;
    });
    
    const removedByTime = initialLength - activeNotifications.length;
    if (removedByTime > 0) {
      console.log(`Cleaned up ${removedByTime} old notifications (older than 30 minutes)`);
    }

    // Check if any children have been checked out in PCO (less frequently)
    if (activeNotifications.length > 0) {
      const checkInIds = activeNotifications.map(n => n.checkInId);
      
      try {
        // Use individual calls in batches to avoid rate limiting
        const batchSize = 10;
        const checkedOutIds = [];
        
        for (let i = 0; i < checkInIds.length; i += batchSize) {
          const batch = checkInIds.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (id) => {
              try {
                const resp = await axios.get(
                  `${PCO_API_BASE}/check_ins/${id}`,
                  {
                    auth: {
                      username: process.env.PCO_ACCESS_TOKEN,
                      password: process.env.PCO_ACCESS_SECRET
                    },
                    headers: { 'Accept': 'application/json' }
                  }
                );
                return resp.data.data;
              } catch (err) {
                console.error(`Cleanup: Individual call failed for ${id}:`, err.message);
                return null;
              }
            })
          );
          
          // Check which ones are checked out
          batchResults.forEach(checkIn => {
            if (checkIn && checkIn.attributes && checkIn.attributes.checked_out_at) {
              checkedOutIds.push(checkIn.id);
            }
          });
        }

        if (checkedOutIds.length > 0) {
          const beforeCount = activeNotifications.length;
          activeNotifications = activeNotifications.filter(n => 
            !checkedOutIds.includes(n.checkInId)
          );
          const afterCount = activeNotifications.length;
          
          if (beforeCount !== afterCount) {
            console.log(`Removed ${beforeCount - afterCount} notifications for checked-out children`);
          }
        }
      } catch (apiError) {
        console.error('Error checking PCO for checked-out children:', apiError.message);
      }
    }
  } catch (error) {
    console.error('Error in cleanup interval:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

// GET /api/location-status - Get all locations with remaining children for a specific event/date
app.get('/api/location-status', async (req, res) => {
  try {
    console.log(`[DEBUG] /api/location-status called`);
    const { eventId, date } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    // Check cache first
    const cacheKey = `location-status-${eventId}-${date}`;
    const cachedData = getCachedCheckInData(eventId);
    
    if (cachedData && cachedData.data && cachedData.included) {
      console.log(`[DEBUG] Location-status: Using cached data for event ${eventId}`);
      const allCheckIns = cachedData.data;
      const allIncluded = cachedData.included;
      
      // Process cached data
      const checkIns = allCheckIns.filter(ci => !ci.attributes.checked_out_at);
      const locationMap = new Map();
      let checkInsWithLocations = 0;
      let checkInsWithoutLocations = 0;

      checkIns.forEach((checkIn, index) => {
        const location = allIncluded.find(item =>
          item.type === 'Location' &&
          item.id === checkIn.relationships.locations?.data?.[0]?.id
        );

        const person = allIncluded.find(item => 
          item.type === 'Person' && 
          item.id === checkIn.relationships.person?.data?.id
        );

        if (location && person) {
          checkInsWithLocations++;
          const locationId = location.id;
          const locationName = location.attributes.name;
          
          if (!locationMap.has(locationId)) {
            locationMap.set(locationId, {
              id: locationId,
              name: locationName,
              childCount: 0,
              children: []
            });
          }

          const locationData = locationMap.get(locationId);
          locationData.childCount++;
          locationData.children.push({
            id: checkIn.id,
            name: `${person.attributes.first_name} ${person.attributes.last_name}`,
            securityCode: checkIn.attributes.security_code,
            checkInTime: checkIn.attributes.created_at
          });
        } else {
          checkInsWithoutLocations++;
        }
      });

      const locations = Array.from(locationMap.values())
        .sort((a, b) => b.childCount - a.childCount);

      console.log(`[DEBUG] Location-status: Returning ${locations.length} locations from cache`);
      return res.json(locations);
    }

    // If no cache, fetch from PCO API with better error handling
    console.log(`[DEBUG] Location-status: No cache available, fetching from PCO API`);
    
    // Build the PCO API URL for the selected event and date
    let url = `${PCO_API_BASE}/events/${eventId}/check_ins?include=person,locations&per_page=100`;
    if (date) {
      url += `&where[created_at]=${date}`;
    }
    
    console.log(`[DEBUG] Location-status: Fetching check-ins with URL: ${url}`);
    
    // Get all active check-ins for the event/date with pagination
    let allCheckIns = [];
    let allIncluded = [];
    let nextPage = url;
    let pageCount = 0;
    const maxPages = 5; // Limit to prevent excessive API calls
    
    while (nextPage && pageCount < maxPages) {
      try {
        const checkInResponse = await axios.get(nextPage, {
          auth: {
            username: process.env.PCO_ACCESS_TOKEN,
            password: process.env.PCO_ACCESS_SECRET
          },
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const { data, included, links } = checkInResponse.data;
        allCheckIns = allCheckIns.concat(data || []);
        if (included) allIncluded = allIncluded.concat(included);
        nextPage = links && links.next ? links.next : null;
        pageCount++;
        
        console.log(`[DEBUG] Location-status: Fetched page ${pageCount} with ${data?.length || 0} check-ins, total so far: ${allCheckIns.length}`);
        
        // Add a small delay between requests to avoid rate limiting
        if (nextPage && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (apiError) {
        console.error(`[DEBUG] Location-status: API error on page ${pageCount}:`, apiError.response?.data || apiError.message);
        if (apiError.response?.status === 429) {
          console.log(`[DEBUG] Location-status: Rate limited, returning partial data`);
          break;
        }
        throw apiError;
      }
    }
    
    console.log(`[DEBUG] Location-status: Finished fetching ${pageCount} pages. Total check-ins: ${allCheckIns.length}`);
    
    // Cache the data for future use
    if (allCheckIns.length > 0) {
      updateCheckInCache(eventId, { data: allCheckIns, included: allIncluded });
    }
    
    const checkIns = allCheckIns.filter(ci => !ci.attributes.checked_out_at);
    const locationMap = new Map();
    let checkInsWithLocations = 0;
    let checkInsWithoutLocations = 0;

    checkIns.forEach((checkIn, index) => {
      const location = allIncluded.find(item =>
        item.type === 'Location' &&
        item.id === checkIn.relationships.locations?.data?.[0]?.id
      );

      const person = allIncluded.find(item => 
        item.type === 'Person' && 
        item.id === checkIn.relationships.person?.data?.id
      );

      if (location && person) {
        checkInsWithLocations++;
        const locationId = location.id;
        const locationName = location.attributes.name;
        
        if (!locationMap.has(locationId)) {
          locationMap.set(locationId, {
            id: locationId,
            name: locationName,
            childCount: 0,
            children: []
          });
        }

        const locationData = locationMap.get(locationId);
        locationData.childCount++;
        locationData.children.push({
          id: checkIn.id,
          name: `${person.attributes.first_name} ${person.attributes.last_name}`,
          securityCode: checkIn.attributes.security_code,
          checkInTime: checkIn.attributes.created_at
        });
      } else {
        checkInsWithoutLocations++;
      }
    });

    console.log(`[DEBUG] Location-status: Check-ins with locations: ${checkInsWithLocations}`);
    console.log(`[DEBUG] Location-status: Check-ins without locations: ${checkInsWithoutLocations}`);

    // Convert to array and sort by child count
    const locations = Array.from(locationMap.values())
      .sort((a, b) => b.childCount - a.childCount);

    console.log(`[DEBUG] Location-status: Returning ${locations.length} locations with total ${locations.reduce((sum, loc) => sum + loc.childCount, 0)} children`);

    res.json(locations);

  } catch (error) {
    console.error('Error fetching location status:', error);
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limited. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch location status' });
    }
  }
});

// POST /api/set-global-billboard - Set the global billboard state directly
app.post('/api/set-global-billboard', requireAuthOnly, async (req, res) => {
  try {
    const { eventId, eventName, securityCodes, eventDate } = req.body;
    console.log('Server: set-global-billboard called with:', { eventId, eventName, securityCodes, eventDate });
    
    if (!eventId || !eventName) {
      console.error('Server: Missing required fields:', { eventId, eventName });
      return res.status(400).json({ error: 'Event ID and Event Name are required' });
    }
    
    // Validate date format if provided
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      console.error('Server: Invalid eventDate format:', eventDate);
      return res.status(400).json({ error: 'Invalid eventDate format. Expected YYYY-MM-DD' });
    }
    
    const userId = req.session.user?.id;
    const userName = req.session.user?.name;
    
    console.log('Server: Updating global billboard state with user:', { userId, userName });
    
    // Clear notifications from past events when starting a new event
    const beforeCount = activeNotifications.length;
    if (beforeCount > 0) {
      activeNotifications.length = 0;
      console.log(`Server: Cleared ${beforeCount} notifications from previous events`);
    }
    
    updateGlobalBillboardState(eventId, eventName, securityCodes || [], eventDate, userId, userName);
    
    console.log('Server: Global billboard state updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Global billboard state updated successfully',
      globalBillboardState,
      notificationsCleared: beforeCount
    });
  } catch (error) {
    console.error('Server: Error setting global billboard state:', error);
    console.error('Server: Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to set global billboard state' });
  }
});

// Connect to MongoDB
connectDB();

// Apply rate limiting
app.use('/api', apiLimiter);
// Note: Auth routes are defined directly in this file, so we don't apply authLimiter to /api/auth

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

// Handle unmatched routes
app.use('*', (req, res) => {
  // Only handle API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    console.log('🔍 [CATCH-ALL] Unmatched API request:', {
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    headers: req.headers,
    ip: req.ip
  });
  res.status(404).json({ 
      error: 'API route not found',
    requestedPath: req.originalUrl,
    availableRoutes: [
      '/api/auth/pco',
      '/auth/callback', 
      '/api/auth/callback',
      '/api/auth-status',
      '/api/events',
      '/api/security-codes'
    ]
  });
  } else {
    // For non-API routes, return 404
    res.status(404).json({ 
      error: 'Route not found',
      message: 'This server only serves API endpoints. The React frontend should be deployed separately.',
      requestedPath: req.originalUrl
    });
  }
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
  console.log(`Hardcoded REDIRECT_URI: ${REDIRECT_URI}`);
  if (authorizedUsers.length === 0) {
    console.log('Warning: No authorized users configured. The first user to log in will be granted admin access.');
  } else {
    console.log(`Authorized users: ${authorizedUsers.length}`);
    console.log(`Remember Me duration: ${REMEMBER_ME_DAYS} days`);
  }
});
// Render deployment trigger - Wed Jul 16 15:57:44 CDT 2025
