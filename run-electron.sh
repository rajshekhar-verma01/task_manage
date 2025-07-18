#!/bin/bash

echo "Starting Electron Task Management App..."

# Check if server is running
echo "Checking if development server is running..."
if ! curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "Development server is not running."
    echo "Please start the server first with: npm run dev"
    echo "Then run this script again."
    exit 1
fi

echo "Development server is running, starting Electron..."
npx electron .