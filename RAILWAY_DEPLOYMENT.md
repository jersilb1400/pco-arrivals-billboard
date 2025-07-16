# Railway Deployment Guide

## Overview
This guide will help you deploy the PCO Arrivals Billboard server to Railway, separate from the React frontend on Render.

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Create a new project

## Step 2: Deploy Server
1. **Connect GitHub Repository**
   - Click "Deploy from GitHub repo"
   - Select your `pco-arrivals-billboard` repository
   - Choose the `main` branch

2. **Configure Service**
   - Railway will auto-detect it's a Node.js project
   - Set the **Root Directory** to `server`
   - Set the **Start Command** to `npm start`

3. **Environment Variables**
   Add these environment variables in Railway:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   PCO_CLIENT_ID=your_pco_client_id
   PCO_CLIENT_SECRET=your_pco_client_secret
   PCO_ACCESS_TOKEN=your_pco_access_token
   PCO_ACCESS_SECRET=your_pco_access_secret
   REDIRECT_URI=https://your-railway-domain.railway.app/auth/callback
   SESSION_SECRET=your_session_secret
   CLIENT_URL=https://arrivals.gracefm.org
   ```

## Step 3: Get Railway Domain
1. After deployment, Railway will provide a domain like:
   `https://pco-arrivals-server-production-xxxx.up.railway.app`

2. Copy this domain for the next step

## Step 4: Update Client Configuration
1. **Update Production Environment**
   Edit `client/.env.production`:
   ```
   REACT_APP_API_BASE=https://your-railway-domain.railway.app/api
   ```

2. **Redeploy Client**
   - Commit and push the changes
   - Render will automatically redeploy the client

## Step 5: Update OAuth Redirect URI
1. Go to your PCO application settings
2. Update the redirect URI to:
   `https://your-railway-domain.railway.app/auth/callback`

## Step 6: Test the Application
1. Visit `https://arrivals.gracefm.org`
2. Test the login flow
3. Verify all API calls work

## Troubleshooting
- Check Railway logs for any errors
- Verify all environment variables are set correctly
- Ensure the OAuth redirect URI matches exactly
- Test API endpoints directly using the Railway domain

## Benefits of This Approach
- ✅ Clean separation of concerns
- ✅ Client service works perfectly on Render
- ✅ Server can be scaled independently
- ✅ Easier debugging and maintenance
- ✅ More reliable deployments 