# Date Setting Issue Troubleshooting Guide

## Issue Description
Users are experiencing problems when trying to set the date for events in the admin dashboard while running the app from Render.

## Root Cause Analysis

Based on the investigation, the main issues are:

1. **Authentication Issues**: The `events-by-date` endpoint requires authentication but users may not be properly authenticated
2. **MongoDB Connection Issues**: The logs show MongoDB connection failures which could affect session persistence
3. **API Configuration**: Potential issues with API base URL configuration in production

## Diagnostic Steps

### 1. Check Browser Console
Open the browser developer tools (F12) and check the Console tab for any error messages when:
- Loading the admin dashboard
- Changing the date
- Selecting an event

Look for:
- Network errors (404, 401, 500)
- JavaScript errors
- API request/response logs

### 2. Check Network Tab
In the browser developer tools, go to the Network tab and:
- Change the date in the admin dashboard
- Look for the `/api/events-by-date` request
- Check the response status and body

### 3. Check Server Logs
On Render, check the application logs for:
- MongoDB connection errors
- API request errors
- Authentication issues

## Common Issues and Solutions

### Issue 1: 401 Unauthorized Error
**Symptoms**: `events-by-date` endpoint returns 401
**Cause**: User not properly authenticated
**Solutions**:
1. Log out and log back in
2. Clear browser cookies and cache
3. Check if the session is being maintained properly

### Issue 2: MongoDB Connection Errors
**Symptoms**: Logs show `getaddrinfo ENOTFOUND` errors
**Cause**: MongoDB connection string issues or network problems
**Solutions**:
1. Verify MongoDB connection string in Render environment variables
2. Check if MongoDB Atlas is accessible
3. Consider using a different MongoDB connection method

### Issue 3: API Base URL Issues
**Symptoms**: Network errors or wrong API calls
**Cause**: Incorrect API base URL configuration
**Solutions**:
1. Verify `REACT_APP_API_BASE` environment variable in Render
2. Check if the custom domain is properly configured
3. Ensure the backend service is serving both API and React app

### Issue 4: Date Format Issues
**Symptoms**: Invalid date errors or no events found
**Cause**: Date format mismatch between frontend and backend
**Solutions**:
1. Ensure dates are in YYYY-MM-DD format
2. Check timezone handling
3. Verify PCO API date filtering

## Testing Steps

### 1. Test Authentication
```bash
# Test if you can access the admin dashboard
curl -I https://arrivals.gracefm.org/admin
```

### 2. Test API Endpoints
```bash
# Test events endpoint (should return 401 without auth)
curl -I https://arrivals.gracefm.org/api/events-by-date?date=2025-07-02

# Test global billboard (should work without auth)
curl https://arrivals.gracefm.org/api/global-billboard
```

### 3. Test with Authentication
1. Log in to the application
2. Open browser developer tools
3. Go to Application tab > Cookies
4. Copy the `connect.sid` cookie value
5. Test API with authentication:
```bash
curl -H "Cookie: connect.sid=YOUR_SESSION_ID" \
     https://arrivals.gracefm.org/api/events-by-date?date=2025-07-02
```

## Environment Variables to Check

Make sure these environment variables are set correctly in Render:

### Backend (Server) Environment Variables:
- `PCO_CLIENT_ID`
- `PCO_CLIENT_SECRET`
- `PCO_ACCESS_TOKEN`
- `PCO_ACCESS_SECRET`
- `REDIRECT_URI` (should be `https://arrivals.gracefm.org/auth/callback`)
- `CLIENT_URL` (should be `https://arrivals.gracefm.org`)
- `SESSION_SECRET`
- `MONGODB_URI`
- `NODE_ENV` (should be `production`)

### Frontend Environment Variables:
- `REACT_APP_API_BASE` (should be `/api` for production)

## Debugging Improvements Added

The following improvements have been added to help diagnose issues:

### Frontend (AdminPanel.js):
- Enhanced error logging with detailed error information
- Date format validation
- User-friendly error messages via snackbar
- Request/response logging

### Backend (server.js):
- Enhanced logging for events-by-date endpoint
- Date format validation
- Detailed error responses
- Request/response logging

### API Configuration (api.js):
- Request/response interceptors for debugging
- Better error handling
- Timeout configuration

## Quick Fixes to Try

1. **Clear Browser Data**: Clear all cookies and cache for the domain
2. **Re-login**: Log out and log back in to refresh the session
3. **Check Render Logs**: Look for any deployment or runtime errors
4. **Verify Domain**: Ensure the custom domain is properly attached to the backend service
5. **Test Different Date**: Try selecting a different date to see if the issue is date-specific

## Contact Information

If the issue persists after trying these steps, please provide:
1. Browser console logs
2. Network tab screenshots
3. Render application logs
4. Steps to reproduce the issue

## Related Documentation

- [DNS_FIX.md](./DNS_FIX.md) - DNS configuration issues
- [SELF_HOSTING.md](./SELF_HOSTING.md) - Deployment instructions
- [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - System architecture 