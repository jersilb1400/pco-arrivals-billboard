# PCO Arrivals Billboard

A full-stack web application for displaying and managing Planning Center Online (PCO) check-ins in a secure, user-friendly, and real-time "billboard" format. Designed for churches and organizations using PCO Check-Ins, this app helps staff and volunteers monitor arrivals, manage security codes, and view check-in activity by event and location.

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

## Troubleshooting
- **Authentication Issues:** Ensure your PCO API credentials and redirect URIs are correct.
- **MongoDB Errors:** Check that MongoDB is running and accessible at the URI specified, or that your Atlas URI is correct and includes the database name.
- **Port Conflicts:** Change `PORT` in your `.env` if 3001 is in use.
- **Frontend/Backend Not Syncing:** Make sure both are running and environment variables are set correctly.
- **Cloud Cookie Issues:** If deploying on Render or another cloud provider, ensure you have `app.set('trust proxy', 1);` before your session middleware in Express.

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
