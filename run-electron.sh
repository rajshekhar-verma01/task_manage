#!/bin/bash

# Electron launcher script for Windows/Linux compatibility
echo "Starting Task Management Desktop Application..."

# Check if we're in the right directory
if [ ! -f "electron-main.js" ]; then
  echo "Error: electron-main.js not found"
  echo "Make sure you are in the project root directory"
  exit 1
fi

# Set environment
export NODE_ENV=development

# Start Electron with the correct entry point
echo "Launching Electron..."
npx electron electron-main.js

echo "Application closed."