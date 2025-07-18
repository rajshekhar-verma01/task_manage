#!/usr/bin/env node

// Direct Electron launcher that specifies the main file explicitly
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Launching Electron Task Management App...');

// Check if main.js exists
if (!fs.existsSync('main.js')) {
  console.error('Error: main.js not found in current directory');
  console.log('Please ensure you are running this from the project root directory');
  process.exit(1);
}

// Check if server is running
const http = require('http');
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

const launchElectron = async () => {
  try {
    // Verify server is running
    const serverRunning = await checkServer();
    if (!serverRunning) {
      console.log('Warning: Development server may not be running on port 5000');
      console.log('Make sure to start the server first if you haven\'t already');
    }
    
    console.log('Starting Electron with main.js...');
    
    // Launch Electron with explicit main file
    const electronProcess = spawn('npx', ['electron', 'main.js'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
    
    electronProcess.on('error', (error) => {
      console.error('Failed to start Electron:', error);
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure Electron is installed: npm install electron');
      console.log('2. Make sure you are in the project root directory');
      console.log('3. Try running: npx electron main.js');
    });
    
    electronProcess.on('close', (code) => {
      console.log(`Electron process exited with code ${code}`);
    });
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\nShutting down Electron...');
      electronProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error launching Electron:', error);
    process.exit(1);
  }
};

launchElectron();