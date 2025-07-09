# DNS Fix for OAuth Callback Issue

> **RESOLVED:** The correct solution is to point your custom domain (e.g., arrivals.gracefm.org) to your backend service on Render. The backend must serve both API and React app. The OAuth callback will work as long as /auth/callback is handled by the backend and the domain is attached to the backend service. See the README for the current working setup.

## Problem Summary

The OAuth callback is failing due to **two related issues**:

1. **DNS Routing Issue**: `arrivals.gracefm.org` points to the wrong Render service
2. **Frontend API Configuration**: Frontend is configured to call API on wrong domain

## ⚠️ Why the DNS Fix is REQUIRED for Login

- Browsers **will not send session cookies cross-origin** (from `arrivals.gracefm.org` to `pco-arrivals-billboard.onrender.com`), even if the backend sets `SameSite=None; Secure` and CORS is configured.
- **Result:** The backend creates and saves the session, but the frontend never sends the session cookie, so every API request is "unauthenticated."
- **Only solution:** Serve both frontend and backend from the **same domain** (or subdomain, with correct cookie domain settings).
- **Once DNS is fixed** and both are on the same domain, session cookies will work and login will succeed.

## Troubleshooting Note

> If you see successful OAuth and session save logs on the backend, but every `/api/auth-status` check shows `hasAccessToken: false`, this is a sign that the session cookie is not being sent due to cross-origin issues. This will be resolved once DNS is fixed and both services are on the same domain.

## Current DNS Configuration

```
arrivals.gracefm.org → pco-arrivals-billboard-client.onrender.com
```

## Current Frontend Configuration

```bash
# Client .env file
REACT_APP_API_BASE = /api
```

## Issues

### DNS Issue
- **DNS points to**: `pco-arrivals-billboard-client.onrender.com` (frontend/client service)
- **Server runs on**: `pco-arrivals-billboard.onrender.com` (backend/server service)
- **OAuth callback needs**: Backend service (where `/auth/callback` route is defined)

### Frontend API Issue
- **Frontend config**: `REACT_APP_API_BASE = /api` (relative path)
- **Result**: Frontend calls `https://arrivals.gracefm.org/api/auth/pco` → 404 (no backend there)
- **Should call**: `https://pco-arrivals-billboard.onrender.com/api/auth/pco`

## Current Working Configuration

For immediate OAuth functionality, the app is configured to use:
- **PCO OAuth Redirect URI**: `https://pco-arrivals-billboard.onrender.com/auth/callback`
- **Render Environment Variable**: `REDIRECT_URI=https://pco-arrivals-billboard.onrender.com/auth/callback`

## Required Changes

### 1. DNS Changes

#### Option 1: Point Main Domain to Backend
Update the CNAME record for `arrivals.gracefm.org`:
```
arrivals.gracefm.org → pco-arrivals-billboard.onrender.com
```

#### Option 2: Use Subdomain for Backend (Recommended)
Set up separate DNS records:
```
arrivals.gracefm.org → pco-arrivals-billboard-client.onrender.com (frontend)
api.arrivals.gracefm.org → pco-arrivals-billboard.onrender.com (backend)
```

### 2. Frontend Configuration Changes

#### Option 1: Point to Backend Service
Update client `.env` file:
```bash
# Change from:
REACT_APP_API_BASE = /api

# To:
REACT_APP_API_BASE = https://pco-arrivals-billboard.onrender.com/api
```

#### Option 2: Use Subdomain (if using Option 2 for DNS)
```bash
REACT_APP_API_BASE = https://api.arrivals.gracefm.org/api
```

## Complete Solution Steps

1. **Update DNS Records** in your domain registrar
2. **Update Frontend Environment Variable**:
   - `REACT_APP_API_BASE = https://pco-arrivals-billboard.onrender.com/api` (Option 1)
   - OR: `REACT_APP_API_BASE = https://api.arrivals.gracefm.org/api` (Option 2)
3. **Rebuild and redeploy frontend** to Render
4. **Wait for DNS propagation** (up to 48 hours)
5. **Update PCO OAuth App Settings**:
   - Redirect URI: `https://arrivals.gracefm.org/auth/callback` (Option 1)
   - OR: `https://api.arrivals.gracefm.org/auth/callback` (Option 2)
6. **Update Render Environment Variable**:
   - `REDIRECT_URI=https://arrivals.gracefm.org/auth/callback` (Option 1)
   - OR: `REDIRECT_URI=https://api.arrivals.gracefm.org/auth/callback` (Option 2)
7. **Test OAuth flow** with the new configuration

## Verification

After DNS changes, verify with:
```bash
nslookup arrivals.gracefm.org
# Should show: pco-arrivals-billboard.onrender.com (Option 1)
# OR: api.arrivals.gracefm.org → pco-arrivals-billboard.onrender.com (Option 2)
```

## Current Status

- ✅ OAuth works with Render default domain
- ✅ Custom domain routing works when the custom domain is attached to the backend service
- ✅ Frontend API calls work when the API base is set to the custom domain
- ✅ DNS and frontend config are correct when following the README

## Architecture Overview

- **Frontend Service**: `pco-arrivals-billboard-client.onrender.com` - Serves React app
- **Backend Service**: `pco-arrivals-billboard.onrender.com` - Handles all API routes including `/auth/callback`
- **Frontend Config**: Must point to backend service for API calls
- **DNS**: Must route requests to appropriate services

## Notes

- The backend service handles all API routes including `/auth/callback`
- The frontend service serves the React application
- Both services are needed for full functionality
- Option 2 (subdomain) is recommended for cleaner separation of concerns
- Frontend environment variables must be updated and frontend redeployed after changes 