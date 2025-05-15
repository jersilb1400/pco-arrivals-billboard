#!/bin/bash

# PCO Arrivals Billboard - Ubuntu Deployment Script
# Run as: bash deploy_ubuntu.sh

set -e

# 1. Update package list
sudo apt-get update

# 2. Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
  echo "Installing Node.js (LTS) and npm..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js is already installed."
fi

# 3. Install MongoDB if not present
if ! command -v mongod &> /dev/null; then
  echo "Installing MongoDB Community Edition..."
  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
else
  echo "MongoDB is already installed."
fi

# 4. Start MongoDB as a service
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 globally..."
  sudo npm install -g pm2
else
  echo "PM2 is already installed."
fi

# 6. Check for .env file
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

# 10. Show PM2 and MongoDB status
pm2 status
sudo systemctl status mongod --no-pager

echo "\nDeployment complete!"
echo "- Backend running on port 3001 (http://localhost:3001)"
echo "- Frontend served from backend in production mode (http://localhost:3001)"
echo "- MongoDB running as a service (default port 27017)"
echo "- Use PM2 to manage the backend process (pm2 logs, pm2 restart, etc.)"
echo "\nIf you want to use a reverse proxy (Nginx/Apache), see SELF_HOSTING.md for configuration." 