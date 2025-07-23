# PCO Arrivals Billboard - Complete Setup Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **MongoDB**: Atlas cluster or local instance
- **Planning Center Online Account**: With API access

### Required Accounts
- **Planning Center Online**: For OAuth and API access
- **Render.com**: For deployment (or alternative hosting)
- **MongoDB Atlas**: For database hosting (or local MongoDB)

## Planning Center Online Setup

### 1. Create PCO Application
1. Log into Planning Center Online
2. Go to **Develop** → **Applications**
3. Click **Create Application**
4. Fill in the details:
   - **Name**: PCO Arrivals Billboard
   - **Description**: Child pickup notification system
   - **Redirect URI**: `https://your-domain.com/auth/callback` (update after deployment)

### 2. Get API Credentials
After creating the application, note down:
- **Client ID**: Used in OAuth flow
- **Client Secret**: Used in OAuth flow
- **Access Token**: For API calls
- **Access Secret**: For API calls

### 3. Configure Scopes
Ensure your application has the following scopes:
- `check_ins` - For accessing check-in data
- `people` - For accessing user information

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/pco-arrivals-billboard.git
cd pco-arrivals-billboard
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd server
npm install
```

#### Frontend Dependencies
```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env)
Create `server/.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pco-arrivals?retryWrites=true&w=majority

# Planning Center OAuth
PCO_CLIENT_ID=your_client_id
PCO_CLIENT_SECRET=your_client_secret
PCO_ACCESS_TOKEN=your_access_token
PCO_ACCESS_SECRET=your_access_secret

# Session Management
SESSION_SECRET=your-super-secret-session-key-here

# Application URLs
CLIENT_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3001/auth/callback

# Authorized Users (comma-separated PCO user IDs)
AUTHORIZED_USERS=163050178,61313200
```

#### Frontend Environment (.env.development)
Create `client/.env.development`:
```env
REACT_APP_API_BASE=http://localhost:3001/api
NODE_ENV=development
```

### 4. Database Setup

#### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create new cluster
3. Create database user with read/write permissions
4. Get connection string
5. Update `MONGODB_URI` in backend `.env`

#### Local MongoDB Setup
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string for local MongoDB
MONGODB_URI=mongodb://localhost:27017/pco-arrivals
```

### 5. Start Development Servers

#### Start Backend
```bash
cd server
npm run dev
# or
npm start
```

#### Start Frontend
```bash
cd client
npm start
```

#### Verify Setup
- Backend: http://localhost:3001/api/auth-status
- Frontend: http://localhost:3000
- Database: Check MongoDB connection in backend logs

## Production Deployment

### Option 1: Render.com Deployment

#### 1. Create Render Account
1. Sign up at [render.com](https://render.com)
2. Connect your GitHub repository

#### 2. Deploy Backend Service
1. Click **New** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `pco-arrivals-server`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

#### 3. Deploy Frontend Service
1. Click **New** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `pco-arrivals-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

#### 4. Configure Environment Variables

**Backend Service Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pco-arrivals?retryWrites=true&w=majority
PCO_CLIENT_ID=your_client_id
PCO_CLIENT_SECRET=your_client_secret
PCO_ACCESS_TOKEN=your_access_token
PCO_ACCESS_SECRET=your_access_secret
SESSION_SECRET=your-super-secret-session-key-here
CLIENT_URL=https://your-frontend-domain.onrender.com
REDIRECT_URI=https://your-backend-domain.onrender.com/auth/callback
AUTHORIZED_USERS=163050178,61313200
```

**Frontend Service Variables:**
```
NODE_ENV=production
REACT_APP_API_BASE=https://your-backend-domain.onrender.com/api
```

#### 5. Update PCO Redirect URI
1. Go to your PCO application settings
2. Update redirect URI to: `https://your-backend-domain.onrender.com/auth/callback`

### Option 2: Single Service Deployment

#### 1. Update render.yaml
```yaml
services:
  - type: web
    name: pco-arrivals-billboard
    runtime: node
    rootDir: .
    buildCommand: |
      cd client && npm install && npm run build
      cd ../server && npm install
      cp -r ../client/build ../server/client
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLIENT_URL
        value: https://your-domain.com
      - key: REDIRECT_URI
        value: https://your-domain.com/auth/callback
    healthCheckPath: /api/auth-status
    autoDeploy: true
```

#### 2. Update Server Configuration
Ensure `server/server.js` serves static files:
```javascript
// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'client')));

// Handle unmatched routes
app.use('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    // Handle API routes
    res.status(404).json({ error: 'API route not found' });
  } else {
    // Serve the React app
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  }
});
```

#### 3. Update Frontend API Configuration
Update `client/src/utils/api.js`:
```javascript
if (process.env.NODE_ENV === 'production') {
  API_BASE = process.env.REACT_APP_API_BASE || '/api';
}
```

## Configuration Files

### 1. package.json Files

#### Backend (server/package.json)
```json
{
  "name": "pco-arrivals-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "express-session": "^1.17.3",
    "connect-mongo": "^5.0.0",
    "mongoose": "^8.0.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.5",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

#### Frontend (client/package.json)
```json
{
  "name": "pco-arrivals-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/icons-material": "^7.1.2",
    "@mui/material": "^7.0.2",
    "axios": "^1.9.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.5.2",
    "react-scripts": "^5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://localhost:3001"
}
```

### 2. Build Scripts

#### build-and-deploy.sh
```bash
#!/bin/bash

echo "🚀 Starting build process..."

# Build the React client
echo "📦 Building React client..."
cd client
npm install
npm run build
cd ..

# Copy the built client to the server directory
echo "📋 Copying built client to server directory..."
rm -rf server/client
cp -r client/build server/client

echo "✅ Build complete! The server/client directory now contains the built React app."
echo "🎯 You can now deploy the server directory to Render."
```

#### deploy-separate-services.sh
```bash
#!/bin/bash

echo "🚀 Deploying PCO Arrivals Billboard as separate services..."

echo "📋 Current Configuration:"
echo "  - Frontend: https://your-frontend-domain.com"
echo "  - Backend: https://your-backend-domain.com"
echo "  - API Base: https://your-backend-domain.com/api"

echo ""
echo "✅ Configuration Summary:"
echo "  - render.yaml: Configured for separate services"
echo "  - Frontend API Base: https://your-backend-domain.com/api"
echo "  - Backend CORS: Configured to allow frontend domain"
echo "  - OAuth Redirect: https://your-frontend-domain.com/auth/callback"

echo ""
echo "📤 Next Steps:"
echo "1. Commit and push these changes to trigger deployment"
echo "2. Monitor the Render dashboard for build status"
echo "3. Test the login flow at https://your-frontend-domain.com/login"
```

## Security Configuration

### 1. Environment Variables Security
- Use strong, unique session secrets
- Never commit `.env` files to version control
- Use different secrets for development and production
- Rotate secrets regularly

### 2. CORS Configuration
```javascript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://your-frontend-domain.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 3. Rate Limiting
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

## Testing and Verification

### 1. Health Checks
```bash
# Backend health check
curl https://your-backend-domain.com/api/auth-status

# Frontend health check
curl https://your-frontend-domain.com/
```

### 2. OAuth Flow Testing
1. Visit login page
2. Click "Sign in with Planning Center"
3. Complete OAuth flow
4. Verify redirect to admin panel
5. Check session persistence

### 3. API Testing
```bash
# Test authentication
curl -X GET "https://your-backend-domain.com/api/auth-status" \
  -H "Cookie: connect.sid=your_session_cookie"

# Test events endpoint
curl -X GET "https://your-backend-domain.com/api/events" \
  -H "Cookie: connect.sid=your_session_cookie"
```

### 4. Database Verification
```bash
# Check MongoDB connection
mongo "mongodb+srv://cluster.mongodb.net/pco-arrivals" \
  --username your_username \
  --password your_password

# Check collections
show collections
db.sessions.find().limit(5)
```

## Troubleshooting

### Common Issues

#### 1. OAuth Redirect Errors
**Problem**: 404 errors on OAuth callback
**Solution**: 
- Verify `REDIRECT_URI` matches PCO application settings
- Check that callback route exists in server
- Ensure HTTPS is used in production

#### 2. Session Issues
**Problem**: Users logged out frequently
**Solution**:
- Check MongoDB connection
- Verify session secret is set
- Check cookie settings for HTTPS

#### 3. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**:
- Update CORS allowed origins
- Check API base URL configuration
- Verify credentials are included in requests

#### 4. Database Connection Issues
**Problem**: MongoDB connection failures
**Solution**:
- Check connection string format
- Verify network access and IP whitelist
- Check database user permissions

#### 5. Build Failures
**Problem**: Deployment fails during build
**Solution**:
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for syntax errors in code

### Debug Endpoints
```bash
# Environment variables
curl https://your-backend-domain.com/api/debug/env

# Session test
curl https://your-backend-domain.com/test-session

# Health check
curl https://your-backend-domain.com/api/auth-status
```

## Maintenance

### 1. Regular Tasks
- Monitor application logs
- Check database performance
- Update dependencies
- Review security settings
- Backup database

### 2. Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track user authentication success rates
- Monitor PCO API rate limits

### 3. Updates
- Keep dependencies updated
- Monitor for security vulnerabilities
- Test updates in development first
- Use blue-green deployment for zero downtime

This setup guide provides complete instructions for installing, configuring, and deploying the PCO Arrivals Billboard application from scratch. 