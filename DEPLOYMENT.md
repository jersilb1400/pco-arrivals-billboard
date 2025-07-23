# Deployment Guide

## Overview

This application can be deployed in two ways:

1. **Single Service Deployment** (Recommended) - Frontend and backend served from the same domain
2. **Separate Services Deployment** - Frontend and backend as separate services

## Option 1: Single Service Deployment (Recommended)

This approach serves both the React frontend and Node.js backend from the same domain, eliminating CORS issues and simplifying the deployment.

### Configuration

1. **Update render.yaml** (already configured):
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
   ```

2. **API Configuration**: The client is configured to use relative paths (`/api`) for API calls, which works perfectly with this setup.

3. **Deploy**: Push to your main branch and Render will automatically deploy.

### Benefits
- ✅ No CORS issues
- ✅ Single domain for everything
- ✅ Simpler configuration
- ✅ Better performance (no cross-domain requests)

## Option 2: Separate Services Deployment

If you prefer to keep frontend and backend as separate services:

### Frontend Service Configuration

1. **Environment Variables**:
   ```
   REACT_APP_API_BASE=https://your-backend-service.onrender.com/api
   ```

2. **Update render.yaml**:
   ```yaml
   services:
     - type: web
       name: pco-arrivals-client
       runtime: node
       rootDir: client
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: REACT_APP_API_BASE
           value: https://your-backend-service.onrender.com/api
   ```

### Backend Service Configuration

1. **Environment Variables**:
   ```
   CLIENT_URL=https://your-frontend-service.onrender.com
   REDIRECT_URI=https://your-frontend-service.onrender.com/auth/callback
   ```

## Troubleshooting 404 Errors

### Problem: "Sign in with Planning Center" returns 404

**Cause**: The frontend is trying to access `/api/auth/pco` on the wrong domain.

**Solutions**:

1. **For Single Service Deployment**:
   - Ensure the server is configured to serve static files
   - Verify the build process copies the React app to `server/client/`
   - Check that the server serves `index.html` for non-API routes

2. **For Separate Services Deployment**:
   - Set `REACT_APP_API_BASE` to point to your backend service URL
   - Ensure CORS is properly configured on the backend
   - Verify the backend service is running and accessible

### Quick Fix

If you're currently experiencing 404 errors:

1. **Check your current deployment**:
   ```bash
   # Check if you have separate services
   curl https://arrivals.gracefm.org/api/auth-status
   ```

2. **If using separate services**, update the frontend environment variable:
   ```
   REACT_APP_API_BASE=https://your-backend-service.onrender.com/api
   ```

3. **If using single service**, ensure the build process is working:
   ```bash
   ./build-and-deploy.sh
   ```

## Environment Variables Reference

### Frontend (Client)
- `REACT_APP_API_BASE`: API base URL (use `/api` for single service, full URL for separate services)

### Backend (Server)
- `CLIENT_URL`: Frontend URL for redirects
- `REDIRECT_URI`: OAuth callback URL
- `PCO_CLIENT_ID`: Planning Center OAuth client ID
- `PCO_CLIENT_SECRET`: Planning Center OAuth client secret
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Session encryption secret

## Health Checks

- **Single Service**: `/api/auth-status`
- **Separate Services**: 
  - Frontend: `/`
  - Backend: `/api/auth-status`

## Monitoring

Check your Render dashboard for:
- Build logs
- Runtime logs
- Environment variables
- Service health status 