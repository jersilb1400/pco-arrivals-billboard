#!/bin/bash

echo "🧪 Testing build process..."

echo "📁 Current directory: $(pwd)"
echo "📋 Contents of current directory:"
ls -la

echo ""
echo "🔧 Running npm install..."
npm install

echo ""
echo "🔧 Running build process..."
npm run build

echo ""
echo "🔍 Checking if build was created..."
if [ -d "client/build" ]; then
    echo "✅ client/build directory exists"
    echo "📋 Contents of client/build:"
    ls -la client/build/
    
    if [ -f "client/build/index.html" ]; then
        echo "✅ index.html exists"
        echo "📄 First few lines of index.html:"
        head -5 client/build/index.html
    else
        echo "❌ index.html not found"
    fi
else
    echo "❌ client/build directory not found"
fi

echo ""
echo "🧪 Build test complete" 