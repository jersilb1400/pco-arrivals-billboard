#!/bin/bash

# Build and Deploy Script for PCO Arrivals Billboard

echo "🚀 Starting build and deploy process..."

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build
cd ..

# Copy frontend build to backend directory
echo "📋 Copying frontend build to backend..."
rm -rf server/client
cp -r client/build server/client

echo "✅ Build complete! Frontend files copied to server/client/"
echo "📤 Ready to commit and deploy to Render" 