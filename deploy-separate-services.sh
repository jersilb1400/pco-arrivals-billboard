#!/bin/bash

# Deploy Separate Services Script for PCO Arrivals Billboard
# This script helps deploy the frontend and backend as separate services

echo "🚀 Deploying PCO Arrivals Billboard as separate services..."

echo "📋 Current Configuration:"
echo "  - Frontend: https://arrivals.gracefm.org"
echo "  - Backend: https://pco-arrivals-billboard.onrender.com"
echo "  - API Base: https://pco-arrivals-billboard.onrender.com/api"

echo ""
echo "✅ Configuration Summary:"
echo "  - render.yaml: Configured for separate services"
echo "  - Frontend API Base: https://pco-arrivals-billboard.onrender.com/api"
echo "  - Backend CORS: Configured to allow frontend domain"
echo "  - OAuth Redirect: https://arrivals.gracefm.org/auth/callback"

echo ""
echo "📤 Next Steps:"
echo "1. Commit and push these changes to trigger deployment"
echo "2. Monitor the Render dashboard for build status"
echo "3. Test the login flow at https://arrivals.gracefm.org/login"

echo ""
echo "🔍 To verify deployment:"
echo "  - Frontend: https://arrivals.gracefm.org"
echo "  - Backend API: https://pco-arrivals-billboard.onrender.com/api/auth-status"
echo "  - OAuth Test: https://pco-arrivals-billboard.onrender.com/api/auth/pco"

echo ""
echo "⚠️  Important Notes:"
echo "  - Ensure CORS is properly configured on the backend"
echo "  - Verify environment variables are set in Render dashboard"
echo "  - Check that OAuth redirect URI matches in PCO settings" 