# Deployment Instructions

## Overview
This application is now configured to run as separate client and server instances, both locally and in production.

## Local Development

### Start Both Services
```bash
npm run dev
```

### Start Services Individually
```bash
# Start server only
npm run server:dev

# Start client only  
npm run client:dev
```

## Production Deployment

### Option 1: Render (Recommended)

#### Step 1: Deploy Client Service
1. Go to [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pco-arrivals-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `NODE_ENV=production`

#### Step 2: Deploy Server Service
1. Create another **Web Service**
2. Configure:
   - **Name**: `pco-arrivals-server`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=your_mongodb_connection_string
     PCO_CLIENT_ID=your_pco_client_id
     PCO_CLIENT_SECRET=your_pco_client_secret
     PCO_ACCESS_TOKEN=your_pco_access_token
     PCO_ACCESS_SECRET=your_pco_access_secret
     REDIRECT_URI=https://your-server-domain.onrender.com/auth/callback
     SESSION_SECRET=your_session_secret
     CLIENT_URL=https://your-client-domain.onrender.com
     ```

#### Step 3: Update Client Configuration
1. Get your server domain (e.g., `https://pco-arrivals-server.onrender.com`)
2. Update `client/.env.production`:
   ```
   REACT_APP_API_BASE=https://your-server-domain.onrender.com/api
   ```

#### Step 4: Update PCO OAuth Settings
1. Go to your PCO application settings
2. Update the redirect URI to your server domain:
   `https://your-server-domain.onrender.com/auth/callback`

### Option 2: Manual Deployment

#### Deploy Client to Render
- Use the client directory as the root
- Build command: `npm install && npm run build`
- Start command: `npm start`

#### Deploy Server to Railway/Heroku
- Use the server directory as the root
- Build command: `npm install`
- Start command: `npm start`

## Benefits of Separate Services

✅ **Cleaner Architecture**: Client and server are completely independent
✅ **Easier Debugging**: Issues are isolated to specific services
✅ **Independent Scaling**: Scale client and server separately
✅ **Simpler Deployments**: No complex build processes
✅ **Better Performance**: Each service optimized for its purpose

## Troubleshooting

### Client Can't Connect to Server
- Check that `REACT_APP_API_BASE` points to the correct server URL
- Verify the server is running and accessible
- Check CORS settings on the server

### OAuth Issues
- Ensure redirect URI matches exactly in PCO settings
- Verify the server domain is correct
- Check that the server is accessible from PCO

### Build Failures
- Client: Check for ESLint errors
- Server: Verify all dependencies are installed
- Both: Check environment variables are set correctly 