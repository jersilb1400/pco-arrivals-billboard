#!/bin/bash

# Build and Deploy Script for PCO Arrivals Billboard
# This script builds the React client and copies it to the server directory

echo "🚀 Starting build process..."

# Build the React client
echo "📦 Building React client..."
cd client
npm install
npm run build
cd ..

# Copy the built client to the server directory
echo "📋 Copying built client to server directory..."
rm -rf server/client
cp -r client/build server/client

echo "✅ Build complete! The server/client directory now contains the built React app."
echo "🎯 You can now deploy the server directory to Render." 