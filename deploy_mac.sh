#!/bin/bash

# PCO Arrivals Billboard - Mac OS Deployment Script
# This script automates the setup and deployment of the app on a Mac (Intel or Apple Silicon)
# Run as: bash deploy_mac.sh

set -e

# 1. Install Homebrew if not present
if ! command -v brew &> /dev/null; then
  echo "Homebrew not found. Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "Homebrew already installed."
fi

# 2. Install Node.js (LTS) and npm
if ! command -v node &> /dev/null; then
  echo "Installing Node.js (LTS)..."
  brew install node
else
  echo "Node.js already installed."
fi

# 3. Install MongoDB Community Edition
if ! brew list | grep -q mongodb-community; then
  echo "Installing MongoDB Community Edition..."
  brew tap mongodb/brew
  brew install mongodb-community@7.0
else
  echo "MongoDB already installed."
fi

# 4. Start MongoDB as a service
brew services start mongodb-community@7.0

# 5. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 globally..."
  npm install -g pm2
else
  echo "PM2 already installed."
fi

# 6. Set up environment variables
if [ ! -f .env ]; then
  echo "Please create a .env file in the project root with your secrets and config."
  exit 1
else
  echo ".env file found."
fi

# 7. Install backend dependencies
cd server
npm install
cd ..

# 8. Install frontend dependencies and build
cd client
npm install
npm run build
cd ..

# 9. Start backend with PM2
cd server
pm2 start server.js --name pco-arrivals-billboard --env production
cd ..

# 10. (Optional) Open firewall for local network (port 3001)
# Uncomment the next line if you want to allow incoming connections on port 3001
# sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
# sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node

# 11. Show PM2 and MongoDB status
pm2 status
brew services list | grep mongodb

echo "\nDeployment complete!"
echo "- Backend running on port 3001 (http://localhost:3001)"
echo "- Frontend served from backend in production mode (http://localhost:3001)"
echo "- MongoDB running as a service (default port 27017)"
echo "- Use PM2 to manage the backend process (pm2 logs, pm2 restart, etc.)"
echo "\nIf you want to use a reverse proxy (Nginx/Apache), see SELF_HOSTING.md for configuration." 