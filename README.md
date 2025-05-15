# PCO Arrivals Billboard

A full-stack web application for displaying and managing Planning Center Online (PCO) check-ins in a secure, user-friendly, and real-time "billboard" format. Designed for churches and organizations using PCO Check-Ins, this app helps staff and volunteers monitor arrivals, manage security codes, and view check-in activity by event and location.

---

## Features
- **Admin Dashboard:** Manage events, dates, security codes, and view check-ins by location.
- **Billboard Display:** Real-time, large-format display of arrivals for selected events and codes.
- **Location-Based View:** See active check-ins filtered by PCO location.
- **User Authentication:** Secure login via PCO OAuth (admin-only access).
- **MongoDB Storage:** Session and user data stored securely.
- **Self-Hosting Ready:** Easily deploy on your own internal server (see [SELF_HOSTING.md](SELF_HOSTING.md)).

---

## Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB (local or remote)
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
- `MONGO_URI`
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

## Troubleshooting
- **Authentication Issues:** Ensure your PCO API credentials and redirect URIs are correct.
- **MongoDB Errors:** Check that MongoDB is running and accessible at the URI specified.
- **Port Conflicts:** Change `PORT` in your `.env` if 3001 is in use.
- **Frontend/Backend Not Syncing:** Make sure both are running and environment variables are set correctly.

---

## License
This project is for internal use by your organization. For external use or contributions, please contact the maintainer.

---

## Deployment Scripts

This project includes deployment scripts for common operating systems:

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
