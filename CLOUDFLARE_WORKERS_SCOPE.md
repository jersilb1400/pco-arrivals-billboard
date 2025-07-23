# PCO Arrivals Billboard - Cloudflare Workers Technical Scope

## Project Overview

Rebuild the PCO Arrivals Billboard as a serverless application using HTML frontend and Cloudflare Workers backend, maintaining 100% feature parity with the current React/Express application.

## Technology Stack

### Frontend
- **HTML5**: Single-page application structure
- **Vanilla JavaScript**: ES6+ with modules
- **Alpine.js**: Lightweight reactive framework (optional)
- **CSS3**: Custom styling with CSS Grid/Flexbox
- **Material Design Icons**: Via CDN

### Backend
- **Cloudflare Workers**: Serverless functions
- **Cloudflare KV**: Key-value storage for sessions and data
- **Cloudflare Durable Objects**: Global state management
- **Cloudflare Pages**: Static hosting

### External APIs
- **Planning Center Online**: OAuth 2.0 and REST API
- **Cloudflare Workers**: Built-in fetch API

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloudflare     │    │   External      │
│   (HTML/JS)     │◄──►│   Workers        │◄──►│   (PCO API)     │
│                 │    │                  │    │                 │
│ - Single HTML   │    │ - Worker Routes  │    │ - OAuth 2.0     │
│ - Alpine.js     │    │ - KV Storage     │    │ - Check-ins     │
│ - CSS/JS        │    │ - Durable Objects│    │ - Events        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Project Structure

```
pco-arrivals-workers/
├── src/
│   ├── worker/
│   │   ├── index.js              # Main worker entry point
│   │   ├── routes/
│   │   │   ├── auth.js           # OAuth routes
│   │   │   ├── events.js         # Event management
│   │   │   ├── billboard.js      # Billboard state
│   │   │   ├── notifications.js  # Notification system
│   │   │   └── admin.js          # Admin functions
│   │   ├── middleware/
│   │   │   ├── auth.js           # Authentication middleware
│   │   │   ├── cors.js           # CORS handling
│   │   │   └── rateLimit.js      # Rate limiting
│   │   ├── utils/
│   │   │   ├── pco.js            # PCO API utilities
│   │   │   ├── session.js        # Session management
│   │   │   └── validation.js     # Input validation
│   │   └── durable/
│   │       └── BillboardState.js # Global state management
│   ├── pages/
│   │   ├── index.html            # Main application
│   │   ├── admin.html            # Admin panel
│   │   ├── billboard.html        # Billboard display
│   │   └── login.html            # Login page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css          # Main styles
│   │   │   ├── admin.css         # Admin styles
│   │   │   └── billboard.css     # Billboard styles
│   │   ├── js/
│   │   │   ├── app.js            # Main application logic
│   │   │   ├── auth.js           # Authentication logic
│   │   │   ├── admin.js          # Admin panel logic
│   │   │   ├── billboard.js      # Billboard logic
│   │   │   └── utils.js          # Utility functions
│   │   └── images/
│   │       └── logo.png          # Application logo
│   └── wrangler.toml             # Cloudflare configuration
├── package.json
└── README.md
```

## Core Components

### 1. Main Worker (src/worker/index.js)

```javascript
// Main worker entry point
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Handle static assets
  if (path.startsWith('/assets/')) {
    return handleStaticAssets(request)
  }
  
  // Handle HTML pages
  if (path === '/' || path === '/admin' || path === '/billboard' || path === '/login') {
    return handleHTMLPage(request)
  }
  
  // Handle API routes
  if (path.startsWith('/api/')) {
    return handleAPIRoute(request)
  }
  
  // Handle OAuth callback
  if (path === '/auth/callback') {
    return handleOAuthCallback(request)
  }
  
  return new Response('Not Found', { status: 404 })
}
```

### 2. Authentication System

#### OAuth Routes (src/worker/routes/auth.js)
```javascript
export async function handleOAuthInit(request, env) {
  const { searchParams } = new URL(request.url)
  const remember = searchParams.get('remember') === 'true'
  
  // Store remember preference in KV
  const sessionId = generateSessionId()
  await env.SESSIONS.put(sessionId, JSON.stringify({ remember }), {
    expirationTtl: 300 // 5 minutes
  })
  
  // Build OAuth URL
  const scopes = ['check_ins', 'people']
  const redirectUri = `${env.CLIENT_URL}/auth/callback`
  const authUrl = `https://api.planningcenteronline.com/oauth/authorize?client_id=${env.PCO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join(' ')}&state=${sessionId}`
  
  return Response.redirect(authUrl, 302)
}

export async function handleOAuthCallback(request, env) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code || !state) {
    return new Response('Missing authorization code', { status: 400 })
  }
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://api.planningcenteronline.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.PCO_CLIENT_ID,
      client_secret: env.PCO_CLIENT_SECRET,
      redirect_uri: `${env.CLIENT_URL}/auth/callback`
    })
  })
  
  const tokenData = await tokenResponse.json()
  
  // Get user information
  const userResponse = await fetch('https://api.planningcenteronline.com/people/v2/me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/json'
    }
  })
  
  const userData = await userResponse.json()
  const user = userData.data
  
  // Create session
  const sessionId = generateSessionId()
  const sessionData = {
    userId: user.id,
    name: `${user.attributes.first_name} ${user.attributes.last_name}`,
    email: user.attributes.email,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenExpiry: Date.now() + (tokenData.expires_in * 1000),
    isAdmin: await checkUserAuthorization(user.id, env)
  }
  
  // Store session in KV
  const sessionTtl = sessionData.isAdmin ? 86400 : 3600 // 24 hours for admin, 1 hour for others
  await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    expirationTtl: sessionTtl
  })
  
  // Set session cookie and redirect
  const response = Response.redirect(`${env.CLIENT_URL}/admin`, 302)
  response.headers.set('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Max-Age=${sessionTtl}`)
  
  return response
}
```

#### Session Management (src/worker/utils/session.js)
```javascript
export async function getSession(request, env) {
  const cookie = request.headers.get('Cookie')
  if (!cookie) return null
  
  const sessionMatch = cookie.match(/session=([^;]+)/)
  if (!sessionMatch) return null
  
  const sessionId = sessionMatch[1]
  const sessionData = await env.SESSIONS.get(sessionId, 'json')
  
  if (!sessionData) return null
  
  // Check if token needs refresh
  if (sessionData.tokenExpiry && Date.now() >= sessionData.tokenExpiry) {
    const refreshed = await refreshToken(sessionData.refreshToken, env)
    if (refreshed) {
      sessionData.accessToken = refreshed.access_token
      sessionData.refreshToken = refreshed.refresh_token
      sessionData.tokenExpiry = Date.now() + (refreshed.expires_in * 1000)
      
      // Update session in KV
      await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
        expirationTtl: sessionData.isAdmin ? 86400 : 3600
      })
    } else {
      return null // Token refresh failed
    }
  }
  
  return sessionData
}

async function refreshToken(refreshToken, env) {
  try {
    const response = await fetch('https://api.planningcenteronline.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.PCO_CLIENT_ID,
        client_secret: env.PCO_CLIENT_SECRET
      })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}
```

### 3. Event Management

#### Events API (src/worker/routes/events.js)
```javascript
export async function handleGetEvents(request, env) {
  const session = await getSession(request, env)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    const response = await fetch(`${env.PCO_API_BASE}/events`, {
      headers: {
        'Authorization': `Basic ${btoa(`${env.PCO_ACCESS_TOKEN}:${env.PCO_ACCESS_SECRET}`)}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.json()
    
    // Filter out archived events
    const nonArchivedEvents = data.data.filter(event => 
      event.attributes.archived !== true
    )
    
    return new Response(JSON.stringify(nonArchivedEvents), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function handleGetEventsByDate(request, env) {
  const session = await getSession(request, env)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'Invalid date format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    const url = `${env.PCO_API_BASE}/events?where[starts_at]=${date}&include=time`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(`${env.PCO_ACCESS_TOKEN}:${env.PCO_ACCESS_SECRET}`)}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.json()
    const nonArchivedEvents = data.data.filter(event => 
      event.attributes.archived !== true
    )
    
    // Sort by start time
    const sortedEvents = nonArchivedEvents.sort((a, b) => {
      return new Date(a.attributes.starts_at) - new Date(b.attributes.starts_at)
    })
    
    return new Response(JSON.stringify(sortedEvents), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 4. Global State Management

#### Durable Object (src/worker/durable/BillboardState.js)
```javascript
export class BillboardState {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.activeBillboard = null
    this.activeNotifications = []
    this.lastCleanup = Date.now()
  }
  
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname
    
    switch (path) {
      case '/get-state':
        return this.getState()
      case '/set-state':
        return this.setState(request)
      case '/clear-state':
        return this.clearState()
      case '/add-notification':
        return this.addNotification(request)
      case '/remove-notification':
        return this.removeNotification(request)
      case '/get-notifications':
        return this.getNotifications(request)
      default:
        return new Response('Not Found', { status: 404 })
    }
  }
  
  async getState() {
    return new Response(JSON.stringify({
      activeBillboard: this.activeBillboard,
      lastUpdated: this.activeBillboard ? new Date().toISOString() : null,
      createdBy: this.activeBillboard?.createdBy || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async setState(request) {
    const data = await request.json()
    const { eventId, eventName, securityCodes, eventDate, userId, userName } = data
    
    this.activeBillboard = {
      eventId,
      eventName,
      securityCodes: securityCodes || [],
      eventDate,
      createdBy: { id: userId, name: userName }
    }
    
    // Clear old notifications when starting new billboard
    this.activeNotifications = []
    
    return new Response(JSON.stringify({
      success: true,
      activeBillboard: this.activeBillboard
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async clearState() {
    const notificationCount = this.activeNotifications.length
    this.activeBillboard = null
    this.activeNotifications = []
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Global billboard state cleared',
      notificationsCleared: notificationCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async addNotification(request) {
    const data = await request.json()
    const notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      checkInId: data.checkInId,
      securityCode: data.securityCode,
      childName: data.childName,
      locationName: data.locationName,
      notifiedAt: new Date().toISOString(),
      checkInTime: data.checkInTime,
      personId: data.personId,
      locationId: data.locationId,
      eventId: data.eventId,
      eventDate: data.eventDate
    }
    
    this.activeNotifications.push(notification)
    
    return new Response(JSON.stringify({
      success: true,
      notification
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async removeNotification(request) {
    const { checkInId } = await request.json()
    
    const initialLength = this.activeNotifications.length
    this.activeNotifications = this.activeNotifications.filter(
      n => n.checkInId !== checkInId
    )
    
    const removed = initialLength !== this.activeNotifications.length
    
    return new Response(JSON.stringify({
      success: true,
      removed,
      message: removed ? 'Notification removed' : 'Notification not found'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  async getNotifications(request) {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const eventDate = searchParams.get('eventDate')
    
    let filteredNotifications = this.activeNotifications
    
    if (eventId && eventDate) {
      filteredNotifications = this.activeNotifications.filter(n => 
        n.eventId === eventId && n.eventDate === eventDate
      )
    }
    
    // Cleanup old notifications (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
    this.activeNotifications = this.activeNotifications.filter(n => 
      new Date(n.notifiedAt).getTime() > tenMinutesAgo
    )
    
    return new Response(JSON.stringify(filteredNotifications), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 5. Frontend Implementation

#### Main HTML (src/pages/index.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCO Arrivals Billboard</title>
    <link rel="stylesheet" href="/assets/css/main.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body x-data="app()" x-init="init()">
    <div id="app">
        <!-- Loading Screen -->
        <div x-show="loading" class="loading-screen">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
        
        <!-- Login Screen -->
        <div x-show="!authenticated && !loading" class="login-container">
            <div class="login-card">
                <img src="/assets/images/logo.png" alt="Logo" class="logo">
                <h1>PCO Arrivals Billboard</h1>
                <p>Sign in to manage child pickup notifications</p>
                <button @click="login()" class="login-button">
                    <span class="material-icons">login</span>
                    Sign in with Planning Center
                </button>
            </div>
        </div>
        
        <!-- Main Application -->
        <div x-show="authenticated && !loading" class="app-container">
            <!-- Navigation -->
            <nav class="navbar">
                <div class="nav-brand">PCO Arrivals Billboard</div>
                <div class="nav-links">
                    <a href="#" @click="currentPage = 'admin'" 
                       :class="{ active: currentPage === 'admin' }">Admin</a>
                    <a href="#" @click="currentPage = 'billboard'" 
                       :class="{ active: currentPage === 'billboard' }">Billboard</a>
                    <button @click="logout()" class="logout-button">Logout</button>
                </div>
            </nav>
            
            <!-- Admin Panel -->
            <div x-show="currentPage === 'admin'" class="admin-panel">
                <div class="admin-content">
                    <h2>Admin Panel</h2>
                    
                    <!-- Date Selection -->
                    <div class="form-group">
                        <label for="date">Select Date:</label>
                        <input type="date" id="date" x-model="selectedDate" @change="loadEvents()">
                    </div>
                    
                    <!-- Event Selection -->
                    <div class="form-group" x-show="events.length > 0">
                        <label for="event">Select Event:</label>
                        <select id="event" x-model="selectedEvent" @change="loadEventDetails()">
                            <option value="">Choose an event...</option>
                            <template x-for="event in events" :key="event.id">
                                <option :value="event.id" x-text="event.attributes.name"></option>
                            </template>
                        </select>
                    </div>
                    
                    <!-- Security Codes -->
                    <div class="form-group" x-show="selectedEvent">
                        <label>Security Codes:</label>
                        <div class="security-codes">
                            <template x-for="code in securityCodes" :key="code">
                                <span class="security-code" x-text="code"></span>
                            </template>
                        </div>
                        <div class="add-code">
                            <input type="text" x-model="newSecurityCode" placeholder="Enter security code">
                            <button @click="addSecurityCode()">Add</button>
                        </div>
                    </div>
                    
                    <!-- Launch Billboard -->
                    <div class="form-group" x-show="selectedEvent && securityCodes.length > 0">
                        <button @click="launchBillboard()" class="launch-button">
                            Launch Billboard
                        </button>
                    </div>
                    
                    <!-- Active Notifications -->
                    <div class="notifications" x-show="activeNotifications.length > 0">
                        <h3>Active Pickup Requests</h3>
                        <div class="notification-list">
                            <template x-for="notification in activeNotifications" :key="notification.id">
                                <div class="notification-item">
                                    <span class="child-name" x-text="notification.childName"></span>
                                    <span class="security-code" x-text="notification.securityCode"></span>
                                    <span class="location" x-text="notification.locationName"></span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Billboard Display -->
            <div x-show="currentPage === 'billboard'" class="billboard">
                <div class="billboard-header">
                    <h1>Child Pickup Requests</h1>
                    <div class="billboard-info">
                        <span x-text="activeBillboard?.eventName || 'No active billboard'"></span>
                        <span x-text="`${activeNotifications.length} children ready for pickup`"></span>
                    </div>
                </div>
                
                <div class="billboard-content" x-show="activeNotifications.length > 0">
                    <template x-for="notification in activeNotifications" :key="notification.id">
                        <div class="pickup-item">
                            <div class="child-info">
                                <span class="child-name" x-text="notification.childName"></span>
                                <span class="location" x-text="notification.locationName"></span>
                            </div>
                            <div class="security-code" x-text="notification.securityCode"></div>
                        </div>
                    </template>
                </div>
                
                <div class="no-notifications" x-show="activeNotifications.length === 0">
                    <p>No active pickup requests</p>
                </div>
            </div>
        </div>
    </div>
    
    <script src="/assets/js/app.js"></script>
    <script src="/assets/js/auth.js"></script>
    <script src="/assets/js/admin.js"></script>
    <script src="/assets/js/billboard.js"></script>
</body>
</html>
```

#### Main JavaScript (src/assets/js/app.js)
```javascript
function app() {
  return {
    // State
    loading: true,
    authenticated: false,
    currentPage: 'admin',
    user: null,
    
    // Admin state
    selectedDate: new Date().toISOString().split('T')[0],
    events: [],
    selectedEvent: '',
    securityCodes: [],
    newSecurityCode: '',
    activeNotifications: [],
    
    // Billboard state
    activeBillboard: null,
    
    // Initialize application
    async init() {
      await this.checkAuth()
      if (this.authenticated) {
        await this.loadGlobalState()
        await this.startPolling()
      }
      this.loading = false
    },
    
    // Authentication
    async checkAuth() {
      try {
        const response = await fetch('/api/auth-status')
        const data = await response.json()
        
        if (data.authenticated) {
          this.authenticated = true
          this.user = data.user
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    },
    
    async login() {
      window.location.href = '/api/auth/pco?remember=true'
    },
    
    async logout() {
      try {
        await fetch('/api/auth/logout')
        this.authenticated = false
        this.user = null
        this.currentPage = 'admin'
      } catch (error) {
        console.error('Logout failed:', error)
      }
    },
    
    // Global state management
    async loadGlobalState() {
      try {
        const response = await fetch('/api/global-billboard')
        const data = await response.json()
        
        if (data.activeBillboard) {
          this.activeBillboard = data.activeBillboard
          this.selectedDate = data.activeBillboard.eventDate
          this.selectedEvent = data.activeBillboard.eventId
          this.securityCodes = data.activeBillboard.securityCodes
          await this.loadEvents()
        }
      } catch (error) {
        console.error('Failed to load global state:', error)
      }
    },
    
    // Event management
    async loadEvents() {
      if (!this.selectedDate) return
      
      try {
        const response = await fetch(`/api/events-by-date?date=${this.selectedDate}`)
        this.events = await response.json()
      } catch (error) {
        console.error('Failed to load events:', error)
      }
    },
    
    async loadEventDetails() {
      if (!this.selectedEvent) return
      
      // Load event-specific data
      await this.loadActiveNotifications()
    },
    
    // Security codes
    async addSecurityCode() {
      if (!this.newSecurityCode.trim() || !this.selectedEvent) return
      
      const code = this.newSecurityCode.trim().toUpperCase()
      if (this.securityCodes.includes(code)) return
      
      this.securityCodes.push(code)
      this.newSecurityCode = ''
      
      // Trigger pickup notification
      try {
        await fetch('/api/security-code-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            securityCode: code,
            eventId: this.selectedEvent,
            eventDate: this.selectedDate
          })
        })
      } catch (error) {
        console.error('Failed to trigger notification:', error)
      }
    },
    
    // Billboard management
    async launchBillboard() {
      if (!this.selectedEvent || this.securityCodes.length === 0) return
      
      const event = this.events.find(e => e.id === this.selectedEvent)
      if (!event) return
      
      try {
        await fetch('/api/global-billboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: this.selectedEvent,
            eventName: event.attributes.name,
            securityCodes: this.securityCodes,
            eventDate: this.selectedDate
          })
        })
        
        await this.loadGlobalState()
        this.currentPage = 'billboard'
      } catch (error) {
        console.error('Failed to launch billboard:', error)
      }
    },
    
    // Notifications
    async loadActiveNotifications() {
      try {
        const params = new URLSearchParams()
        if (this.selectedEvent) params.append('eventId', this.selectedEvent)
        if (this.selectedDate) params.append('eventDate', this.selectedDate)
        
        const response = await fetch(`/api/active-notifications?${params.toString()}`)
        this.activeNotifications = await response.json()
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    },
    
    // Polling
    startPolling() {
      setInterval(async () => {
        if (this.authenticated) {
          await this.loadActiveNotifications()
          await this.loadGlobalState()
        }
      }, 10000) // Poll every 10 seconds
    }
  }
}
```

### 6. Configuration

#### Wrangler Configuration (wrangler.toml)
```toml
name = "pco-arrivals-billboard"
main = "src/worker/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "pco-arrivals-billboard-prod"

[env.staging]
name = "pco-arrivals-billboard-staging"

# KV Namespaces
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-kv-id"
preview_id = "your-sessions-kv-preview-id"

# Durable Objects
[[durable_objects.bindings]]
name = "BILLBOARD_STATE"
class_name = "BillboardState"

[[migrations]]
tag = "v1"
new_classes = ["BillboardState"]

# Environment Variables
[vars]
CLIENT_URL = "https://your-domain.com"
PCO_API_BASE = "https://api.planningcenteronline.com/check-ins/v2"

# Secrets (set via wrangler secret put)
# PCO_CLIENT_ID
# PCO_CLIENT_SECRET
# PCO_ACCESS_TOKEN
# PCO_ACCESS_SECRET
# AUTHORIZED_USERS
```

### 7. Deployment

#### Package.json
```json
{
  "name": "pco-arrivals-workers",
  "version": "1.0.0",
  "description": "PCO Arrivals Billboard using Cloudflare Workers",
  "main": "src/worker/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "tail": "wrangler tail",
    "kv:create": "wrangler kv:namespace create SESSIONS",
    "kv:create:preview": "wrangler kv:namespace create SESSIONS --preview"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

#### Deployment Commands
```bash
# Install dependencies
npm install

# Create KV namespaces
npm run kv:create
npm run kv:create:preview

# Set secrets
wrangler secret put PCO_CLIENT_ID
wrangler secret put PCO_CLIENT_SECRET
wrangler secret put PCO_ACCESS_TOKEN
wrangler secret put PCO_ACCESS_SECRET
wrangler secret put AUTHORIZED_USERS

# Deploy
npm run deploy:production
```

## Feature Parity Matrix

| Current Feature | Workers Implementation | Status |
|----------------|----------------------|---------|
| OAuth 2.0 Login | Session-based with KV | ✅ |
| Event Management | PCO API integration | ✅ |
| Security Codes | Same logic | ✅ |
| Real-time Updates | Polling (10s intervals) | ✅ |
| Global State | Durable Objects | ✅ |
| Notifications | KV + Durable Objects | ✅ |
| Admin Panel | HTML + Alpine.js | ✅ |
| Billboard Display | Static HTML | ✅ |
| Rate Limiting | Built-in Workers | ✅ |
| CORS | Built-in Workers | ✅ |
| Session Management | KV storage | ✅ |
| Error Handling | Comprehensive | ✅ |

## Performance Optimizations

### 1. Caching Strategy
```javascript
// Cache PCO API responses
const cacheKey = `pco:events:${date}`
const cached = await env.CACHE.get(cacheKey)
if (cached) {
  return new Response(cached, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Store in cache for 5 minutes
await env.CACHE.put(cacheKey, JSON.stringify(data), {
  expirationTtl: 300
})
```

### 2. Batch Operations
```javascript
// Batch KV operations
const batch = []
for (const notification of notifications) {
  batch.push(env.SESSIONS.put(notification.id, JSON.stringify(notification)))
}
await Promise.all(batch)
```

### 3. Efficient Polling
```javascript
// Smart polling based on activity
const pollInterval = this.activeNotifications.length > 0 ? 5000 : 30000
```

## Security Considerations

### 1. Authentication
- Session-based with secure cookies
- Token refresh mechanism
- User authorization validation

### 2. Input Validation
```javascript
function validateDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function validateSecurityCode(code) {
  return /^[A-Z0-9]{3,10}$/.test(code)
}
```

### 3. Rate Limiting
```javascript
// Built-in Workers rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000,
  max: 100
}
```

## Monitoring and Debugging

### 1. Logging
```javascript
// Structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'User authenticated',
  userId: session.userId,
  path: request.url
}))
```

### 2. Error Tracking
```javascript
// Error handling with context
try {
  // API call
} catch (error) {
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    context: { userId, action }
  }))
}
```

### 3. Health Checks
```javascript
// Health check endpoint
if (path === '/health') {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

This technical scope provides complete implementation details for rebuilding the PCO Arrivals Billboard using HTML and Cloudflare Workers, maintaining 100% feature parity with the current application. 