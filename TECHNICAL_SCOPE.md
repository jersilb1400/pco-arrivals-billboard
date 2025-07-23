# PCO Arrivals Billboard - Complete Technical Scope

## Project Overview

The PCO Arrivals Billboard is a full-stack web application designed to manage child pickup notifications for church events using Planning Center Online (PCO) integration. The system provides real-time billboard displays, admin management, and volunteer interfaces for child pickup coordination.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   External      │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (PCO API)     │
│                 │    │                  │    │                 │
│ - Admin Panel   │    │ - Express Server │    │ - OAuth 2.0     │
│ - Billboards    │    │ - MongoDB        │    │ - Check-ins     │
│ - Login         │    │ - Session Mgmt   │    │ - Events        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 19.1.0, Material-UI 7.0.2, React Router DOM 7.5.2
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Authentication**: OAuth 2.0 with Planning Center Online
- **Deployment**: Render.com (separate services)
- **State Management**: React Context API + Local State
- **HTTP Client**: Axios with interceptors
- **Styling**: Material-UI with custom theme

## Frontend Architecture

### Project Structure
```
client/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── AdminPanel.js          # Main admin interface
│   │   ├── Billboard.js           # Main billboard display
│   │   ├── SimpleBillboard.js     # Simplified billboard
│   │   ├── LocationBillboard.js   # Location-specific billboard
│   │   ├── LocationStatus.js      # Location status display
│   │   ├── Login.js               # OAuth login interface
│   │   ├── NavBar.js              # Navigation component
│   │   ├── DateInput.js           # Custom date picker
│   │   ├── SecurityCodeEntry.js   # Security code input
│   │   ├── ProtectedRoute.js      # Route protection
│   │   ├── NotFound.js            # 404 page
│   │   └── Unauthorized.js        # Unauthorized access page
│   ├── context/
│   │   └── SessionContext.js      # Session state management
│   ├── utils/
│   │   ├── api.js                 # Axios configuration
│   │   ├── colors.js              # Color constants
│   │   └── theme.js               # Material-UI theme
│   ├── App.js                     # Main app component
│   ├── App.css                    # Global styles
│   └── index.js                   # App entry point
├── package.json
└── README.md
```

### Key Components

#### 1. AdminPanel.js
**Purpose**: Main administrative interface for managing events, security codes, and billboards.

**Key Features**:
- Date and event selection
- Security code management
- Global billboard state management
- Real-time notification monitoring
- Event data fetching and display

**State Management**:
```javascript
const [events, setEvents] = useState([]);
const [selectedEvent, setSelectedEvent] = useState('');
const [selectedDate, setSelectedDate] = useState(getTodayDate());
const [securityCodes, setSecurityCodes] = useState([]);
const [activeBillboard, setActiveBillboard] = useState(null);
const [activeNotifications, setActiveNotifications] = useState([]);
```

**Key Functions**:
- `handleDateChange()`: Manages date selection and event loading
- `handleEventChange()`: Manages event selection
- `handleAddSecurityCode()`: Adds security codes and triggers notifications
- `handleLaunchBillboard()`: Launches global billboard
- `fetchActiveNotifications()`: Polls for pickup notifications
- `setGlobalState()`: Updates global billboard state

#### 2. Billboard.js
**Purpose**: Main billboard display for child pickup notifications.

**Key Features**:
- Real-time arrival display
- Grouped by security code and household
- Auto-refresh with smart polling
- Fullscreen mode
- Authentication checks

**State Management**:
```javascript
const [arrivals, setArrivals] = useState([]);
const [globalBillboardState, setGlobalBillboardState] = useState(null);
const [isRefreshing, setIsRefreshing] = useState(false);
const [lastUpdated, setLastUpdated] = useState(new Date());
```

**Key Functions**:
- `refreshData()`: Fetches active notifications and updates arrivals
- `checkBillboardUpdates()`: Checks for global state updates
- `checkAuthStatus()`: Validates user authentication
- `groupedArrivals`: Memoized grouping of arrivals by security code

#### 3. DateInput.js
**Purpose**: Custom date picker component with calendar popup.

**Key Features**:
- Native date input with calendar icon
- Custom calendar popup
- Mobile-responsive design
- Month navigation
- Date validation

**Props**:
```javascript
{
  value: string,           // YYYY-MM-DD format
  onChange: function,      // Change handler
  label: string,          // Input label
  placeholder: string,    // Placeholder text
  fullWidth: boolean,     // Full width styling
  sx: object             // Custom styles
}
```

#### 4. Login.js
**Purpose**: OAuth authentication interface.

**Key Features**:
- Planning Center OAuth integration
- Remember me functionality
- Session validation
- Redirect handling

**Key Functions**:
- `handleLogin()`: Initiates OAuth flow
- `checkAuthStatus()`: Validates current session

### State Management

#### SessionContext.js
**Purpose**: Global session state management.

```javascript
const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    // Validates session with backend
  };

  const logout = async () => {
    // Handles logout process
  };

  return (
    <SessionContext.Provider value={{ session, loading, checkAuthStatus, logout }}>
      {children}
    </SessionContext.Provider>
  );
};
```

#### API Configuration (api.js)
**Purpose**: Centralized HTTP client configuration.

```javascript
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Request/Response interceptors for debugging and error handling
```

## Backend Architecture

### Project Structure
```
server/
├── config/
│   └── swagger.js              # API documentation
├── db/
│   └── config.js               # MongoDB connection
├── middleware/
│   ├── auth.js                 # Authentication middleware
│   ├── errorHandler.js         # Error handling middleware
│   └── rateLimiter.js          # Rate limiting
├── models/
│   └── User.js                 # User model (if needed)
├── routes/
│   ├── admin.routes.js         # Admin-specific routes
│   ├── auth.routes.js          # Authentication routes
│   └── billboard.routes.js     # Billboard-specific routes
├── utils/
│   ├── fetchCheckinsByEventTime.js  # PCO API utilities
│   └── logger.js               # Logging utilities
├── server.js                   # Main server file
├── package.json
└── authorized_users.json       # User authorization list
```

### Core Server Configuration

#### server.js - Main Application
**Key Features**:
- Express server setup with middleware
- OAuth 2.0 implementation
- Session management with MongoDB
- Global state management
- Real-time notification system

**Environment Variables**:
```javascript
const CLIENT_ID = process.env.PCO_CLIENT_ID;
const CLIENT_SECRET = process.env.PCO_CLIENT_SECRET;
const REDIRECT_URI = 'https://pco-arrivals-billboard.onrender.com/auth/callback';
const PORT = process.env.PORT || 3001;
const COOKIE_SECRET = process.env.SESSION_SECRET;
```

**Global State Management**:
```javascript
let globalBillboardState = {
  activeBillboard: null,
  lastUpdated: null,
  createdBy: null
};

let activeNotifications = [];
let checkInCache = {
  data: null,
  eventId: null,
  lastUpdated: null,
  cacheTimeout: 30000
};
```

### Authentication System

#### OAuth 2.0 Flow
1. **Authorization Request**: `/api/auth/pco`
   - Redirects to PCO OAuth endpoint
   - Scopes: `check_ins`, `people`

2. **Callback Processing**: `/auth/callback`
   - Exchanges authorization code for tokens
   - Fetches user information
   - Validates user authorization
   - Creates session

3. **Session Management**:
   - MongoDB session store
   - Secure cookies with HTTPS
   - Token refresh handling
   - Remember me functionality

#### User Authorization
```javascript
// Load authorized users from file or environment
const authorizedUsers = loadAuthorizedUsers();

// Check if user is authorized
const isAuthorized = authorizedUsers.some(user => user.id === userId);

// First user becomes admin if no users exist
if (!isAuthorized && authorizedUsers.length === 0) {
  authorizedUsers.push({ id: userId, name, email });
  req.session.user.isAdmin = true;
}
```

### API Endpoints

#### Authentication Endpoints
```javascript
GET  /api/auth/pco                    // Initiate OAuth flow
GET  /auth/callback                    // OAuth callback
GET  /api/auth-status                  // Check authentication status
GET  /api/user-info                    // Get user information
GET  /api/auth/logout                  // Logout user
```

#### Event Management Endpoints
```javascript
GET  /api/events                       // Get all events
GET  /api/events-by-date               // Get events by date
GET  /api/events/:eventId/event-times  // Get event times
GET  /api/events/:eventId/locations    // Get event locations
```

#### Check-in Management Endpoints
```javascript
POST /api/security-codes               // Get check-ins by security codes
GET  /api/events/:eventId/active-people // Get active check-ins
GET  /api/event-times/:eventTimeId/active-people // Get active people by event time
GET  /api/events/:eventId/remaining-checkins // Get remaining check-ins
```

#### Billboard Management Endpoints
```javascript
GET  /api/global-billboard             // Get global billboard state
POST /api/global-billboard             // Set global billboard state
DELETE /api/global-billboard           // Clear global billboard state
GET  /api/billboard-updates            // Check for updates
POST /api/set-global-billboard         // Set billboard state directly
```

#### Notification System Endpoints
```javascript
POST /api/security-code-entry          // Enter security code for pickup
GET  /api/active-notifications         // Get active notifications
POST /api/checkout-notification        // Remove notification on checkout
GET  /api/location-status              // Get location status
```

#### Location Management Endpoints
```javascript
GET  /api/events/:eventId/locations/:locationId/active-checkins // Get check-ins by location
```

### Middleware

#### Authentication Middleware
```javascript
const requireAuth = (req, res, next) => {
  // Validates session and user authentication
};

const requireAuthOnly = (req, res, next) => {
  // Validates authentication without admin check
};
```

#### Rate Limiting
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

#### Error Handling
```javascript
const errorHandler = (err, req, res, next) => {
  // Centralized error handling and logging
};
```

### Database Configuration

#### MongoDB Connection
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

#### Session Store
```javascript
app.use(session({
  secret: COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

## PCO API Integration

### API Configuration
```javascript
const PCO_API_BASE = 'https://api.planningcenteronline.com/check-ins/v2';
const PCO_PEOPLE_API = 'https://api.planningcenteronline.com/people/v2';
```

### Key API Endpoints Used
1. **Events**: `/events` - Get all events
2. **Event Times**: `/events/:id/event_times` - Get event times
3. **Check-ins**: `/check_ins` - Get check-in data
4. **Locations**: `/events/:id/locations` - Get event locations
5. **User Info**: `/people/v2/me` - Get current user

### Authentication
```javascript
// Basic auth for API calls
auth: {
  username: process.env.PCO_ACCESS_TOKEN,
  password: process.env.PCO_ACCESS_SECRET
}

// Bearer token for user-specific calls
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Accept': 'application/json'
}
```

## Real-time Features

### Notification System
```javascript
// Active notifications storage
let activeNotifications = [];

// Add notification
const notification = {
  id: Date.now().toString() + Math.random(),
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

// Cleanup old notifications
setInterval(async () => {
  // Remove notifications older than 10 minutes
  // Check for checked-out children
}, 2 * 60 * 1000);
```

### Global State Management
```javascript
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
}
```

## Deployment Configuration

### Render.com Blueprint (render.yaml)
```yaml
services:
  - type: web
    name: pco-arrivals-client
    runtime: node
    rootDir: client
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: REACT_APP_API_BASE
        value: https://pco-arrivals-billboard.onrender.com/api
    healthCheckPath: /
    autoDeploy: true

  - type: web
    name: pco-arrivals-server
    runtime: node
    rootDir: server
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production 
      - key: CLIENT_URL
        value: https://arrivals.gracefm.org
      - key: REDIRECT_URI
        value: https://pco-arrivals-billboard.onrender.com/auth/callback
    healthCheckPath: /api/auth-status
    autoDeploy: true
```

### Environment Variables

#### Frontend (.env.production)
```
REACT_APP_API_BASE=https://pco-arrivals-billboard.onrender.com/api
NODE_ENV=production
```

#### Backend (.env)
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
PCO_CLIENT_ID=your_client_id
PCO_CLIENT_SECRET=your_client_secret
PCO_ACCESS_TOKEN=your_access_token
PCO_ACCESS_SECRET=your_access_secret
SESSION_SECRET=your_session_secret
CLIENT_URL=https://arrivals.gracefm.org
REDIRECT_URI=https://pco-arrivals-billboard.onrender.com/auth/callback
AUTHORIZED_USERS=user_id1,user_id2
```

## Security Considerations

### Authentication Security
- OAuth 2.0 with secure token handling
- Session-based authentication with MongoDB storage
- Secure cookies with HTTPS enforcement
- Token refresh mechanism
- User authorization validation

### API Security
- Rate limiting on all endpoints
- CORS configuration for allowed origins
- Input validation and sanitization
- Error handling without sensitive data exposure
- Request logging and monitoring

### Data Security
- Environment variable protection
- Secure session management
- Input validation on all endpoints
- SQL injection prevention (MongoDB)
- XSS protection through proper escaping

## Performance Optimizations

### Frontend Optimizations
- React.memo for expensive components
- useCallback for function memoization
- useMemo for computed values
- Lazy loading of components
- Optimized re-renders

### Backend Optimizations
- Request caching (30-second cache for check-ins)
- Connection pooling for MongoDB
- Rate limiting to prevent abuse
- Efficient database queries
- Background cleanup processes

### API Optimizations
- Batch API calls where possible
- Pagination for large datasets
- Conditional requests based on updates
- Smart polling intervals (10 seconds)
- Error handling with graceful degradation

## Monitoring and Logging

### Logging Configuration
```javascript
const logger = require('./utils/logger');

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Error logging
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error('Reason:', reason);
  logger.error('Promise:', promise);
  process.exit(1);
});
```

### Health Checks
- `/api/auth-status` - Authentication status
- `/` - Frontend health check
- Database connection monitoring
- External API availability checks

## Error Handling

### Frontend Error Handling
- Axios interceptors for HTTP errors
- React error boundaries
- Graceful degradation for API failures
- User-friendly error messages
- Retry mechanisms for failed requests

### Backend Error Handling
- Centralized error handler middleware
- Proper HTTP status codes
- Detailed error logging
- Rate limiting error responses
- Database connection error handling

## Testing Strategy

### Frontend Testing
- Component unit tests with React Testing Library
- Integration tests for user flows
- API mocking for isolated testing
- Accessibility testing
- Cross-browser compatibility

### Backend Testing
- API endpoint testing
- Authentication flow testing
- Database integration tests
- Error scenario testing
- Performance testing

## Maintenance and Updates

### Regular Maintenance Tasks
- Database cleanup (old sessions, notifications)
- Log rotation and cleanup
- Dependency updates
- Security patches
- Performance monitoring

### Update Procedures
- Blue-green deployment strategy
- Database migration scripts
- Environment variable updates
- Configuration management
- Rollback procedures

## Troubleshooting Guide

### Common Issues
1. **OAuth Redirect Errors**: Check REDIRECT_URI configuration
2. **Session Issues**: Verify MongoDB connection and cookie settings
3. **API Rate Limiting**: Implement proper caching and reduce polling
4. **CORS Errors**: Verify allowed origins configuration
5. **Date Selection Issues**: Check date format validation and event loading

### Debug Endpoints
- `/api/debug/env` - Environment variable debugging
- `/test-session` - Session testing
- Console logging throughout the application
- Network tab monitoring for API calls

This technical scope provides a complete blueprint for rebuilding the PCO Arrivals Billboard application, covering all aspects from architecture to deployment and maintenance. 