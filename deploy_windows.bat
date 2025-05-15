@echo off
REM PCO Arrivals Billboard - Windows Deployment Script
REM Run as administrator for best results

REM 1. Check for Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js not found. Please install Node.js LTS from https://nodejs.org/ and re-run this script.
    pause
    exit /b 1
) ELSE (
    echo Node.js is installed.
)

REM 2. Check for MongoDB
where mongod >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo MongoDB not found. Please install MongoDB Community Edition from https://www.mongodb.com/try/download/community and start the MongoDB service.
    pause
    exit /b 1
) ELSE (
    echo MongoDB is installed.
)

REM 3. Install PM2 globally
where pm2 >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Installing PM2 globally...
    npm install -g pm2
) ELSE (
    echo PM2 is already installed.
)

REM 4. Check for .env file
IF NOT EXIST .env (
    echo Please create a .env file in the project root with your secrets and config.
    pause
    exit /b 1
) ELSE (
    echo .env file found.
)

REM 5. Install backend dependencies
cd server
call npm install
cd ..

REM 6. Install frontend dependencies and build
cd client
call npm install
call npm run build
cd ..

REM 7. Start MongoDB (if not already running)
REM (Assumes MongoDB is installed as a Windows service)
net start MongoDB

REM 8. Start backend with PM2
cd server
pm2 start server.js --name pco-arrivals-billboard --env production
cd ..

REM 9. Show PM2 status
pm2 status

echo.
echo Deployment complete!
echo Backend running on port 3001 (http://localhost:3001)
echo Frontend served from backend in production mode (http://localhost:3001)
echo MongoDB should be running as a Windows service (default port 27017)
echo Use PM2 to manage the backend process (pm2 logs, pm2 restart, etc.)
echo.
pause 