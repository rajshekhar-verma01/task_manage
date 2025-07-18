#!/usr/bin/env node

// Simple Electron launcher for Windows that handles ES module requirements
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Electron Task Management App...');

// Check if we're in the right directory
if (!fs.existsSync('main.js')) {
  console.error('Error: main.js not found in current directory');
  console.log('Make sure you are in the project root directory');
  process.exit(1);
}

// Set environment for development
process.env.NODE_ENV = 'development';

const startElectron = () => {
  console.log('Launching Electron application...');
  
  // Try multiple methods to start Electron
  const electronProcess = spawn('npx', ['electron', '--package-json=electron.json', 'electron-main.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  electronProcess.on('error', (error) => {
    console.error('Failed to start Electron:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Electron is installed: npm install electron');
    console.log('2. Try: npx electron main.js');
    console.log('3. Check that your development server is running on port 5000');
  });
  
  electronProcess.on('close', (code) => {
    console.log(`Electron application closed (exit code: ${code})`);
  });
  
  // Handle cleanup
  const cleanup = () => {
    console.log('\nShutting down...');
    electronProcess.kill();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
};

startElectron();