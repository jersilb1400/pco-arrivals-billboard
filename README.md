# PCO Arrivals Billboard

---

## 🚀 Cloud Deployment (Render.com + MongoDB Atlas) - **Quick Checklist**

- [x] **Custom Domain**: Attach your custom domain (e.g., `arrivals.gracefm.org`) to your **backend** service on Render (not the frontend).
- [x] **Backend Serves Everything**: Backend serves both API and React app static files (from `/client/build` or `/server/client`).
- [x] **OAuth Redirect URI**: Set to `https://arrivals.gracefm.org/auth/callback` in both your PCO app and backend environment variables.
- [x] **Frontend API Base**: In `client/.env.production`, set `REACT_APP_API_BASE=https://arrivals.gracefm.org/api`
- [x] **No Separate Frontend Service Needed**: All traffic (API and React app) goes through the backend. You do not need a separate Render service for the frontend.
- [x] **All routes (API and React) are handled by the backend.**

---

# PCO Arrivals Billboard

A real-time billboard application for displaying check-ins from Planning Center Online (PCO). The application allows multiple users to log in independently and view real-time updates of check-ins for selected events and security codes.

## Features

### Real-Time Updates
- **Automatic Data Refresh**: Billboards automatically refresh data every 10-60 seconds
- **Independent User Logins**: Multiple users can log in independently and see real-time updates
- **Global State Synchronization**: Changes made by one user are automatically reflected for all other users
- **Authentication Status Monitoring**: Continuous monitoring of authentication status to ensure data access

### Billboard Components
- **Main Billboard**: Displays check-ins grouped by security codes and households
- **Location Billboard**: Shows active check-ins for specific locations
- **Real-time Updates**: Both billboards automatically detect and display new check-ins
- **User Status Display**: Shows which user is currently logged in

### Authentication & Session Management
- **OAuth2 Integration**: Secure authentication with Planning Center Online
- **Session Persistence**: Users remain logged in across browser sessions
- **Independent Sessions**: Each user maintains their own session
- **Automatic Re-authentication**: Handles token refresh and session validation

## Technical Implementation

### Real-Time Update Mechanism
1. **Periodic Polling**: Components check for updates every 10-60 seconds
2. **Authentication Checks**: Each refresh cycle validates user authentication
3. **Global State Monitoring**: Checks for changes in global billboard state
4. **Data Synchronization**: Automatically fetches latest check-in data

### Server-Side Features
- **Global Billboard State**: Centralized state management for active billboards
- **Update Detection**: Endpoint to check for billboard updates
- **Session Management**: Robust session handling with cookie-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse

### Client-Side Features
- **Session Context**: React context for managing authentication state
- **Automatic Refresh**: Components automatically refresh data and authentication status
- **Error Handling**: Graceful handling of authentication failures
- **User Feedback**: Visual indicators for authentication status and data updates

## Usage

### Starting a Billboard
1. Log in to the admin panel
2. Select an event and date
3. Add security codes to monitor
4. Launch the billboard

### Independent User Access
- Multiple users can log in independently
- Each user will see the same real-time data
- Changes made by any user are automatically reflected for all users
- Authentication status is continuously monitored

### Real-Time Features
- **Automatic Refresh**: Data refreshes every 10 seconds (main billboard) or 60 seconds (location billboard)
- **Live Updates**: New check-ins appear automatically without manual refresh
- **State Synchronization**: Global billboard state is synchronized across all users
- **Authentication Monitoring**: Continuous validation of user sessions

## Configuration

### Environment Variables
- `PCO_CLIENT_ID`: Planning Center OAuth client ID
- `PCO_CLIENT_SECRET`: Planning Center OAuth client secret
- `PCO_ACCESS_TOKEN`: Planning Center API access token
- `PCO_ACCESS_SECRET`: Planning Center API access secret
- `COOKIE_SECRET`: Secret for session cookies
- `CLIENT_URL`: URL of the client application

### Session Configuration
- **Remember Me**: 30-day session persistence
- **Secure Cookies**: HTTPS-only cookie transmission
- **Session Validation**: Continuous authentication status checking

## Troubleshooting

### Data Not Updating
1. Check browser console for authentication errors
2. Verify user is still authenticated
3. Check network connectivity to PCO API
4. Ensure security codes are correctly configured

### Authentication Issues
1. Clear browser cookies and re-authenticate
2. Check OAuth configuration
3. Verify user is in authorized users list
4. Check server logs for authentication errors

### Real-Time Sync Issues
1. Check browser console for update detection logs
2. Verify global billboard state is being updated
3. Check network connectivity to server
4. Ensure polling intervals are not blocked by browser

## Development

### Adding New Real-Time Features
1. Update server endpoints to include timestamp information
2. Add client-side polling mechanisms
3. Implement update detection logic
4. Add appropriate error handling and logging

### Testing Real-Time Updates
1. Open multiple browser windows/tabs
2. Log in with different users
3. Make changes in one window
4. Verify changes appear in other windows automatically

---

## Features
- **Admin Dashboard:** Manage events, dates, security codes, and view check-ins by location.
- **Billboard Display:** Real-time, large-format display of arrivals for selected events and codes.
- **Location-Based View:** See active check-ins filtered by PCO location.
- **User Authentication:** Secure login via PCO OAuth (admin-only access).
- **MongoDB Storage:** Session and user data stored securely.
- **Self-Hosting Ready:** Easily deploy on your own internal server (see [SELF_HOSTING.md](SELF_HOSTING.md)). Several scripts are referrenced at the bottom of this readme.
- **Cloud-Ready:** Prefer not to self-host, no problem! Easily deploy on Render.com with MongoDB Atlas (see below).

---

## Cloud Deployment (Render.com + MongoDB Atlas)

The recommended way to deploy this app is using [Render.com](https://render.com/) for hosting and [MongoDB Atlas](https://www.mongodb.com/atlas) for your database.

### Steps:

1. **Fork/Clone this repository to your GitHub account.**
2. **Create a new Web Service on Render.com:**
   - Connect your GitHub repo.
   - Set the build and start commands as needed (e.g., `npm install` and `node server.js` in `/server`).
   - Set environment variables in the Render dashboard:
     - `PCO_CLIENT_ID`, `PCO_CLIENT_SECRET`, etc.
     - `MONGODB_URI` (use your Atlas connection string, including the database name)
     - `COOKIE_SECRET`, `CLIENT_URL`, `REDIRECT_URI`, etc.
   - **Important:** Your MongoDB URI should look like:  
     `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`
3. **Create a Static Site on Render.com for the frontend:**
   - Point to the `/client` directory.
   - Set the build command to `npm install && npm run build`.
   - Set the publish directory to `build`.
4. **In your Express app, make sure you have:**  
   ```js
   app.set('trust proxy', 1);
   ```
   before your session middleware.
5. **No need to run MongoDB locally or use the provided shell/batch scripts for cloud deployment.**

For more details, see [Render's Node.js deployment guide](https://render.com/docs/deploy-node-express-app) and [MongoDB Atlas setup](https://www.mongodb.com/docs/atlas/).

---

## Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB (local or remote, or Atlas for cloud)
- Planning Center Online account with API access
- (Optional) Homebrew (for Mac OS deployment)

---

## Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pco-arrivals-billboard.git
   cd pco-arrivals-billboard
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your credentials and secrets.

3. **Install dependencies:**
   - Backend:
     ```bash
     cd server
     npm install
     cd ..
     ```
   - Frontend:
     ```bash
     cd client
     npm install
     cd ..
     ```

4. **Start MongoDB:**
   - Make sure MongoDB is running locally or update `MONGO_URI` in your `.env` file.

5. **Run the app:**
   - Backend:
     ```bash
     cd server
     npm start
     ```
   - Frontend (in a separate terminal):
     ```bash
     cd client
     npm start
     ```
   - The app will be available at [http://localhost:3000](http://localhost:3000)

---

## Self-Hosting & Production Deployment

- See [SELF_HOSTING.md](SELF_HOSTING.md) for a full guide to deploying on an internal server, including environment setup, reverse proxy, and security best practices.
- For Mac OS, use the included deployment script:
  ```bash
  bash deploy_mac.sh
  ```

---

## Environment Variables

See `.env.example` for all required and optional environment variables. Key variables include:
- `PCO_CLIENT_ID`, `PCO_CLIENT_SECRET`, `PCO_ACCESS_TOKEN`, `PCO_ACCESS_SECRET`
- `MONGO_URI` or `MONGODB_URI` (for Atlas, include the database name)
- `COOKIE_SECRET`
- `CLIENT_URL`, `REDIRECT_URI`
- `AUTHORIZED_USERS` (optional)
- `NODE_ENV`, `PORT`, `REMEMBER_ME_DAYS`

---

## Updating & Contributing
- Pull the latest changes from GitHub before making updates.
- Use feature branches and submit pull requests for contributions.
- Keep sensitive data out of commits.

---

## License
This project is for internal use by your organization. For external use or contributions, please contact the maintainer.

---

## Deployment Scripts (Local/Self-Hosting Only)

> **Note:** The following scripts are for local or self-hosted deployment only. For cloud deployment, use Render.com and MongoDB Atlas as described above.

- **Mac OS:**
  - `deploy_mac.sh`
  - Usage: `bash deploy_mac.sh`
- **Ubuntu Linux:**
  - `deploy_ubuntu.sh`
  - Usage: `bash deploy_ubuntu.sh`
- **Windows:**
  - `deploy_windows.bat`
  - Usage: Double-click the file or run as Administrator in Command Prompt

Each script will:
- Check/install Node.js, MongoDB, and PM2
- Install backend and frontend dependencies
- Build the frontend
- Start MongoDB (as a service)
- Launch the backend with PM2

**For advanced/server deployment, see [SELF_HOSTING.md](SELF_HOSTING.md).**
