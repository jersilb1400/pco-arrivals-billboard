# Self-Hosting the PCO Arrivals Billboard App

> **Note:** For cloud deployment, see the README. For self-hosting, ensure your DNS points to the backend server, and the backend serves both API and frontend. The OAuth redirect URI must match your public DNS.

This guide explains how to deploy and run the PCO Arrivals Billboard application on your own internal (in-house) server.

---

## 1. Prepare Your Server Environment

- **Choose a Server:** Use a dedicated machine or VM running Linux (Ubuntu recommended), Windows Server, or macOS.
- **Install Node.js:** Ensure Node.js (LTS version) and npm are installed.
- **Install MongoDB:** Install MongoDB Community Edition or use an existing internal MongoDB server.
- **(Optional) Install Nginx/Apache:** For reverse proxying and SSL termination.

---

## 2. Configure Environment Variables

- Copy your `.env` file to the server (never commit secrets to git).
- Set variables for:
  - `PCO_CLIENT_ID`, `PCO_CLIENT_SECRET`, `PCO_ACCESS_TOKEN`, `PCO_ACCESS_SECRET`
  - `MONGO_URI` (pointing to your internal MongoDB)
  - `CLIENT_URL` (e.g., `http://your-internal-server:3000`)
  - `NODE_ENV=production`
  - Any other secrets (cookie secret, etc.)

---

## 3. Build and Deploy the Frontend

- On the server, navigate to the `client` directory.
- Run `npm install` to install dependencies.
- Run `npm run build` to create a production build in `client/build`.
- The backend is already set up to serve static files from this directory in production mode. For production, the backend must serve both API and frontend routes.

---

## 4. Deploy the Backend

- On the server, navigate to the `server` directory.
- Run `npm install` to install dependencies.
- Start the server with:
  - `NODE_ENV=production node server.js`
  - Or use a process manager like **PM2** for reliability:
    - `npm install -g pm2`
    - `pm2 start server.js --name pco-arrivals-billboard`
- Ensure the backend can connect to MongoDB and the PCO API (outbound internet access required for PCO).

---

## 5. (Optional) Set Up a Reverse Proxy

- Use **Nginx** or **Apache** to:
  - Forward HTTP/HTTPS traffic to your Node.js app (port 3001).
  - Serve the React app on port 80/443.
  - Handle SSL certificates (self-signed or internal CA for private networks).

**Example Nginx config:**
```nginx
server {
    listen 80;
    server_name your-internal-server;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Networking and Security

- Restrict access to the server via firewall (allow only internal IPs).
- Use strong passwords for MongoDB and environment secrets.
- (Optional) Set up VPN or internal DNS for easier access.

---

## 7. Testing and Maintenance

- Test the app from a client machine on the same network.
- Set up PM2 or systemd to restart the app on crashes or reboots.
- Regularly update dependencies and OS for security.

---

## 8. Planning Center Online (PCO) API Considerations

- Your server must be able to reach the PCO API (outbound HTTPS).
- For OAuth, set the redirect URI to your internal server's address.
- If using Personal Access Tokens, keep them secure and never expose them to the frontend.

---

## 9. Documentation and Backups

- Document your setup for future admins.
- Back up your MongoDB database and `.env`/config files regularly.

---

## Deployment Scripts

To simplify setup, this project includes deployment scripts for common operating systems:

- **Mac OS:**
  - `deploy_mac.sh` — Run with `bash deploy_mac.sh`
- **Ubuntu Linux:**
  - `deploy_ubuntu.sh` — Run with `bash deploy_ubuntu.sh`
- **Windows:**
  - `deploy_windows.bat` — Double-click or run as Administrator in Command Prompt

These scripts will:
- Check/install Node.js, MongoDB, and PM2
- Install backend and frontend dependencies
- Build the frontend
- Start MongoDB (as a service)
- Launch the backend with PM2

You may still need to:
- Create and fill in your `.env` file (see `.env.example`)
- Configure your firewall or reverse proxy as needed

For manual or advanced configuration, continue with the steps below.

---

## Summary Checklist

- [x] Server with Node.js, npm, MongoDB
- [x] Environment variables set
- [x] Frontend built and served by backend
- [x] Backend running (preferably with PM2)
- [x] (Optional) Nginx/Apache reverse proxy
- [x] Network/firewall configured for internal access
- [x] PCO API credentials and redirect URIs set for internal use

---

*** a deployment script has been created and included for Mac OS. It is titled "deploy_mac.sh" ***