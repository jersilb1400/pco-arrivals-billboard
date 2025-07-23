# PCO Arrivals Billboard - Complete API Reference

## Base URL
- **Production**: `https://pco-arrivals-billboard.onrender.com/api`
- **Development**: `http://localhost:3001/api`

## Authentication
All API requests require authentication via session cookies. The session is established through OAuth 2.0 with Planning Center Online.

## Common Response Format
```javascript
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string
}
```

## Authentication Endpoints

### 1. Initiate OAuth Flow
**GET** `/auth/pco`

Initiates the OAuth 2.0 flow with Planning Center Online.

**Query Parameters:**
- `remember` (optional): `true` to remember user for 30 days
- `prompt` (optional): `login` to force re-authentication

**Response:**
- **302 Redirect** to PCO OAuth authorization URL

**Example:**
```bash
curl -X GET "https://pco-arrivals-billboard.onrender.com/api/auth/pco?remember=true&prompt=login"
```

### 2. OAuth Callback
**GET** `/auth/callback`

Handles the OAuth callback from Planning Center Online.

**Query Parameters:**
- `code` (required): Authorization code from PCO

**Response:**
- **302 Redirect** to `/api/auth/success`

### 3. Authentication Status
**GET** `/auth-status`

Check the current authentication status.

**Response:**
```javascript
{
  "authenticated": true,
  "user": {
    "id": "163050178",
    "name": "Jeremy Silbernagel",
    "email": "jeremy@gracefm.org",
    "isAdmin": true
  },
  "loginUrl": null,
  "message": "Logged in as Jeremy Silbernagel"
}
```

**Example:**
```bash
curl -X GET "https://pco-arrivals-billboard.onrender.com/api/auth-status" \
  -H "Cookie: connect.sid=your_session_cookie"
```

### 4. User Information
**GET** `/user-info`

Get detailed user information (requires authentication).

**Response:**
```javascript
{
  "id": "163050178",
  "name": "Jeremy Silbernagel",
  "email": "jeremy@gracefm.org",
  "avatar": "https://...",
  "isAdmin": true
}
```

### 5. Logout
**GET** `/auth/logout`

Logout the current user and clear session.

**Query Parameters:**
- `redirectTo` (optional): URL to redirect after logout

**Response:**
- **302 Redirect** to login page or specified redirect URL

## Event Management Endpoints

### 1. Get All Events
**GET** `/events`

Retrieve all non-archived events from Planning Center.

**Response:**
```javascript
[
  {
    "id": "12345",
    "type": "Event",
    "attributes": {
      "name": "Sunday Service",
      "starts_at": "2025-07-27T09:00:00Z",
      "ends_at": "2025-07-27T10:30:00Z",
      "archived": false
    }
  }
]
```

### 2. Get Events by Date
**GET** `/events-by-date`

Retrieve events for a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```javascript
[
  {
    "id": "12345",
    "type": "Event",
    "attributes": {
      "name": "Sunday Service",
      "starts_at": "2025-07-27T09:00:00Z",
      "ends_at": "2025-07-27T10:30:00Z",
      "archived": false
    }
  }
]
```

**Example:**
```bash
curl -X GET "https://pco-arrivals-billboard.onrender.com/api/events-by-date?date=2025-07-27"
```

### 3. Get Event Times
**GET** `/events/:eventId/event-times`

Retrieve all event times for a specific event.

**Path Parameters:**
- `eventId` (required): The event ID

**Response:**
```javascript
[
  {
    "id": "67890",
    "type": "EventTime",
    "attributes": {
      "starts_at": "2025-07-27T09:00:00Z",
      "ends_at": "2025-07-27T10:30:00Z",
      "name": "9:00 AM Service"
    }
  }
]
```

### 4. Get Event Locations
**GET** `/events/:eventId/locations`

Retrieve all locations for a specific event.

**Path Parameters:**
- `eventId` (required): The event ID

**Response:**
```javascript
[
  {
    "id": "11111",
    "type": "Location",
    "attributes": {
      "name": "Nursery",
      "capacity": 20
    }
  }
]
```

## Check-in Management Endpoints

### 1. Get Check-ins by Security Codes
**POST** `/security-codes`

Retrieve check-in data for specific security codes.

**Request Body:**
```javascript
{
  "eventId": "12345",
  "securityCodes": ["ABC123", "DEF456"],
  "eventName": "Sunday Service",
  "eventDate": "2025-07-27"
}
```

**Response:**
```javascript
[
  {
    "id": "checkin_123",
    "firstName": "John",
    "lastName": "Doe",
    "securityCode": "ABC123",
    "checkedOut": false,
    "checkInTime": "2025-07-27T09:15:00Z",
    "householdName": "Doe Household"
  }
]
```

### 2. Get Active People by Event
**GET** `/events/:eventId/active-people`

Retrieve all active (not checked out) people for an event.

**Path Parameters:**
- `eventId` (required): The event ID

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)

**Response:**
```javascript
[
  {
    "id": "checkin_123",
    "firstName": "John",
    "lastName": "Doe",
    "securityCode": "ABC123",
    "checkInTime": "2025-07-27T09:15:00Z",
    "householdName": "Doe Household",
    "eventName": "Sunday Service",
    "eventId": "12345"
  }
]
```

### 3. Get Active People by Event Time
**GET** `/event-times/:eventTimeId/active-people`

Retrieve all active people for a specific event time.

**Path Parameters:**
- `eventTimeId` (required): The event time ID

**Response:**
```javascript
[
  {
    "id": "checkin_123",
    "firstName": "John",
    "lastName": "Doe",
    "securityCode": "ABC123",
    "checkInTime": "2025-07-27T09:15:00Z",
    "householdName": "Doe Household",
    "eventTimeId": "67890"
  }
]
```

### 4. Get Remaining Check-ins
**GET** `/events/:eventId/remaining-checkins`

Retrieve all remaining (not checked out) check-ins for an event.

**Path Parameters:**
- `eventId` (required): The event ID

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)

**Response:**
```javascript
{
  "checkIns": [
    {
      "id": "checkin_123",
      "type": "CheckIn",
      "attributes": {
        "security_code": "ABC123",
        "created_at": "2025-07-27T09:15:00Z",
        "checked_out_at": null
      },
      "relationships": {
        "person": { "data": { "id": "person_123" } },
        "locations": { "data": [{ "id": "location_123" }] }
      }
    }
  ]
}
```

## Billboard Management Endpoints

### 1. Get Global Billboard State
**GET** `/global-billboard`

Retrieve the current global billboard state.

**Response:**
```javascript
{
  "activeBillboard": {
    "eventId": "12345",
    "eventName": "Sunday Service",
    "securityCodes": ["ABC123", "DEF456"],
    "eventDate": "2025-07-27"
  },
  "lastUpdated": "2025-07-27T09:30:00Z",
  "createdBy": {
    "id": "163050178",
    "name": "Jeremy Silbernagel"
  }
}
```

### 2. Set Global Billboard State
**POST** `/global-billboard`

Set the global billboard state.

**Request Body:**
```javascript
{
  "eventId": "12345",
  "eventName": "Sunday Service",
  "securityCodes": ["ABC123", "DEF456"],
  "eventDate": "2025-07-27"
}
```

**Response:**
```javascript
{
  "activeBillboard": {
    "eventId": "12345",
    "eventName": "Sunday Service",
    "securityCodes": ["ABC123", "DEF456"],
    "eventDate": "2025-07-27"
  },
  "lastUpdated": "2025-07-27T09:30:00Z",
  "createdBy": {
    "id": "163050178",
    "name": "Jeremy Silbernagel"
  }
}
```

### 3. Clear Global Billboard State
**DELETE** `/global-billboard`

Clear the global billboard state and active notifications.

**Response:**
```javascript
{
  "message": "Global billboard state and active notifications cleared",
  "notificationsCleared": 5
}
```

### 4. Check for Billboard Updates
**GET** `/billboard-updates`

Check if there are updates to the global billboard state.

**Query Parameters:**
- `lastUpdate` (optional): ISO timestamp of last update
- `eventId` (optional): Specific event ID to check

**Response:**
```javascript
{
  "hasUpdates": true,
  "lastUpdated": "2025-07-27T09:30:00Z",
  "activeBillboard": {
    "eventId": "12345",
    "eventName": "Sunday Service",
    "securityCodes": ["ABC123", "DEF456"],
    "eventDate": "2025-07-27"
  },
  "createdBy": {
    "id": "163050178",
    "name": "Jeremy Silbernagel"
  }
}
```

### 5. Set Global Billboard State (Direct)
**POST** `/set-global-billboard`

Set the global billboard state directly (alternative endpoint).

**Request Body:**
```javascript
{
  "eventId": "12345",
  "eventName": "Sunday Service",
  "securityCodes": ["ABC123", "DEF456"],
  "eventDate": "2025-07-27"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Global billboard state updated successfully",
  "globalBillboardState": {
    "activeBillboard": {
      "eventId": "12345",
      "eventName": "Sunday Service",
      "securityCodes": ["ABC123", "DEF456"],
      "eventDate": "2025-07-27"
    },
    "lastUpdated": "2025-07-27T09:30:00Z",
    "createdBy": {
      "id": "163050178",
      "name": "Jeremy Silbernagel"
    }
  },
  "notificationsCleared": 0
}
```

## Notification System Endpoints

### 1. Enter Security Code for Pickup
**POST** `/security-code-entry`

Enter a security code to trigger a pickup notification.

**Request Body:**
```javascript
{
  "securityCode": "ABC123",
  "eventId": "12345",
  "eventDate": "2025-07-27"
}
```

**Response:**
```javascript
{
  "success": true,
  "addedChildren": [
    {
      "childName": "John Doe",
      "locationName": "Nursery"
    }
  ],
  "childName": "John Doe",
  "message": "1 child(ren) have been added to the pickup list."
}
```

### 2. Get Active Notifications
**GET** `/active-notifications`

Retrieve all active pickup notifications.

**Query Parameters:**
- `eventId` (optional): Filter by event ID
- `eventDate` (optional): Filter by event date (YYYY-MM-DD)

**Response:**
```javascript
[
  {
    "id": "notification_123",
    "checkInId": "checkin_123",
    "securityCode": "ABC123",
    "childName": "John Doe",
    "locationName": "Nursery",
    "notifiedAt": "2025-07-27T09:30:00Z",
    "checkInTime": "2025-07-27T09:15:00Z",
    "personId": "person_123",
    "locationId": "location_123",
    "eventId": "12345",
    "eventDate": "2025-07-27"
  }
]
```

### 3. Remove Notification on Checkout
**POST** `/checkout-notification`

Remove a notification when a child is checked out.

**Request Body:**
```javascript
{
  "checkInId": "checkin_123"
}
```

**Response:**
```javascript
{
  "success": true,
  "removed": true,
  "message": "Notification removed"
}
```

### 4. Get Location Status
**GET** `/location-status`

Get all locations with remaining children for a specific event/date.

**Query Parameters:**
- `eventId` (required): The event ID
- `date` (optional): Filter by date (YYYY-MM-DD)

**Response:**
```javascript
[
  {
    "id": "location_123",
    "name": "Nursery",
    "childCount": 5,
    "children": [
      {
        "id": "checkin_123",
        "name": "John Doe",
        "securityCode": "ABC123",
        "checkInTime": "2025-07-27T09:15:00Z"
      }
    ]
  }
]
```

## Location Management Endpoints

### 1. Get Active Check-ins by Location
**GET** `/events/:eventId/locations/:locationId/active-checkins`

Retrieve active check-ins for a specific location.

**Path Parameters:**
- `eventId` (required): The event ID
- `locationId` (required): The location ID

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```javascript
[
  {
    "id": "checkin_123",
    "security_code": "ABC123",
    "name": "John Doe",
    "created_at": "2025-07-27T09:15:00Z",
    "location_id": "location_123",
    "location_name": "Nursery"
  }
]
```

## Admin Management Endpoints

### 1. Get All Users
**GET** `/admin/users`

Retrieve all authorized users (admin only).

**Response:**
```javascript
[
  {
    "id": "163050178",
    "name": "Jeremy Silbernagel",
    "email": "jeremy@gracefm.org",
    "role": "admin"
  }
]
```

### 2. Add User
**POST** `/admin/users`

Add a new authorized user (admin only).

**Request Body:**
```javascript
{
  "userId": "123456789",
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

**Response:**
```javascript
{
  "id": "123456789",
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

### 3. Remove User
**DELETE** `/admin/users/:id`

Remove an authorized user (admin only).

**Path Parameters:**
- `id` (required): The user ID to remove

**Response:**
```javascript
{
  "message": "User removed successfully"
}
```

## Debug Endpoints

### 1. Environment Variables Debug
**GET** `/debug/env`

Get environment variable information for debugging.

**Response:**
```javascript
{
  "NODE_ENV": "production",
  "CLIENT_URL": "https://arrivals.gracefm.org",
  "REDIRECT_URI": "https://pco-arrivals-billboard.onrender.com/auth/callback",
  "host": "pco-arrivals-billboard.onrender.com",
  "x-forwarded-proto": "https",
  "secure": true
}
```

### 2. Session Test
**GET** `/test-session`

Test session functionality.

**Response:**
```
Session set
```

## Error Responses

### Common Error Codes

**401 Unauthorized**
```javascript
{
  "error": "Not authenticated"
}
```

**403 Forbidden**
```javascript
{
  "error": "Not authorized"
}
```

**404 Not Found**
```javascript
{
  "error": "API route not found",
  "requestedPath": "/api/invalid-endpoint",
  "availableRoutes": [
    "/api/auth/pco",
    "/api/events",
    "/api/security-codes"
  ]
}
```

**429 Too Many Requests**
```javascript
{
  "error": "Rate limited. Please try again later."
}
```

**500 Internal Server Error**
```javascript
{
  "error": "Failed to fetch events",
  "details": "Database connection error"
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **All endpoints**: Automatic rate limiting with exponential backoff

## CORS Configuration

Allowed origins:
- `https://arrivals.gracefm.org`
- `https://pco-arrivals-billboard-client.onrender.com`
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)

## Authentication Flow

1. **Initiate OAuth**: `GET /api/auth/pco`
2. **PCO Authorization**: User authorizes on PCO
3. **Callback**: `GET /auth/callback?code=...`
4. **Token Exchange**: Server exchanges code for tokens
5. **Session Creation**: Server creates session with user info
6. **Redirect**: User redirected to admin panel

## Session Management

- **Session Store**: MongoDB with connect-mongo
- **Cookie Settings**: Secure, HttpOnly, SameSite
- **Session Duration**: 24 hours (30 days with "Remember Me")
- **Token Refresh**: Automatic refresh of expired tokens

This API reference provides complete documentation for all endpoints, request/response formats, and usage examples for the PCO Arrivals Billboard application. 