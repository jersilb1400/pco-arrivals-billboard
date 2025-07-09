# PCO Arrivals Billboard - Technical Overview

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
  User((User))
  Browser((Browser))
  User -->|Login, Interact| Browser
  Browser -->|HTTP(S) Requests| Backend[Backend Service (Express)]
  Backend -->|Serves| ReactApp[React App (Static Files)]
  Backend -->|API Calls| PCO[Planning Center Online API]
  Backend -->|Session/Auth| MongoDB[(MongoDB Atlas)]
  Browser -->|API Calls| Backend
```

---

## 2. Component Overview

### Frontend (React)
- **Routes:** `/login`, `/admin`, `/billboard`, `/location-status`, `/security-code-entry`, etc.
- **Auth Flow:** Uses OAuth via backend; stores session via cookies.
- **Key Components:**
  - `Login.js`: Handles login and redirects to OAuth
  - `AdminPanel.js`: Admin dashboard
  - `Billboard.js`, `LocationBillboard.js`: Real-time displays
  - `ProtectedRoute.js`: Guards admin routes
- **API Base:** All API calls go to `/api/*` on the same domain

### Backend (Express)
- **Serves:** React app static files and all API endpoints
- **Key Endpoints:**
  - `/api/auth/pco`: Initiates OAuth
  - `/auth/callback`: Handles OAuth callback
  - `/api/auth-status`: Returns session/auth info
  - `/api/events`, `/api/security-codes`, etc.: PCO data endpoints
- **Session Management:** Uses express-session with MongoDB store
- **Global State:** Manages real-time billboard state

### Database (MongoDB Atlas)
- **Stores:** Sessions, authorized users
- **No check-in data is stored locally** (fetched live from PCO)

### External Integrations
- **Planning Center Online (PCO):**
  - OAuth2 for login
  - API for check-in/event data

---

## 3. Deployment/Hosting Model
- **Recommended:** Single Render backend service with custom domain (e.g., `arrivals.gracefm.org`)
- **Backend serves both API and React app**
- **Frontend build is copied to backend static directory**
- **MongoDB Atlas for session/user storage**
- **DNS:** Custom domain points to backend service
- **OAuth Redirect URI:** Must match custom domain (e.g., `https://arrivals.gracefm.org/auth/callback`)

---

## 4. Authentication & Security
- **OAuth2 with PCO:**
  - User clicks login, redirected to PCO
  - PCO redirects back to `/auth/callback` with code
  - Backend exchanges code for tokens, fetches user info
  - Session cookie is set (secure, SameSite=None)
- **Session Storage:** MongoDB
- **Admin Access:** Only authorized users can access admin routes
- **Rate Limiting:** Applied to API endpoints

---

## 5. Real-Time/Sync Logic
- **Polling:** Frontend polls backend every 10-60 seconds for updates
- **Global State:** Backend manages and broadcasts active billboard state
- **Automatic Refresh:** Billboards auto-refresh on state change
- **Session Monitoring:** Frontend checks `/api/auth-status` regularly

---

## 6. Key Workflows

### Login
1. User visits `/login`
2. Clicks "Sign in with Planning Center"
3. Redirected to PCO OAuth
4. Completes login/2FA
5. Redirected to `/auth/callback` on backend
6. Backend processes code, sets session, redirects to `/admin`

### Child Pickup Notification
1. Volunteer enters security code at `/security-code-entry`
2. Backend fetches check-in data from PCO
3. Child appears on `/billboard` for pickup
4. When child is checked out in PCO, notification disappears

### Admin Actions
- Manage users, view events, monitor real-time check-ins

---

## 7. Troubleshooting & Common Issues
- **Login fails:**
  - Check that custom domain is attached to backend
  - Ensure OAuth redirect URI matches domain
  - Check server logs for `/auth/callback` hits
- **Data not updating:**
  - Check network/API connectivity
  - Ensure polling is not blocked
- **Session issues:**
  - Clear cookies, re-authenticate
  - Check MongoDB connection

---

## 8. Links to Detailed Docs
- [README.md](./README.md)
- [SIMPLIFIED_USAGE.md](./SIMPLIFIED_USAGE.md)
- [SELF_HOSTING.md](./SELF_HOSTING.md)
- [DNS_FIX.md](./DNS_FIX.md)

---

**For further details, see the above docs or contact the project maintainer.** 