#!/usr/bin/env node

// Complete Electron startup script that handles server and app
const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

console.log('Starting Complete Electron Task Management App...');

// Check if server is running
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

// Start simple server
const startSimpleServer = () => {
  return new Promise((resolve, reject) => {
    console.log('Starting development server...');
    
    const server = spawn('node', ['start-simple.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    server.on('error', reject);
    
    // Wait for server to be ready
    const checkInterval = setInterval(async () => {
      if (await checkServer()) {
        clearInterval(checkInterval);
        resolve(server);
      }
    }, 1000);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Server startup timeout'));
    }, 30000);
  });
};

// Start Electron
const startElectron = () => {
  console.log('Starting Electron application...');
  
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true
  });
  
  electron.on('error', (error) => {
    console.error('Failed to start Electron:', error);
    console.log('Make sure Electron is installed: npm install electron');
  });
  
  return electron;
};

// Main execution
(async () => {
  try {
    let serverProcess = null;
    
    // Check if server is already running
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      console.log('Server not running, starting it...');
      serverProcess = await startSimpleServer();
      console.log('Server started successfully!');
    } else {
      console.log('Server already running, proceeding to Electron...');
    }
    
    // Start Electron
    const electronProcess = startElectron();
    
    // Handle cleanup
    const cleanup = () => {
      console.log('\nShutting down...');
      if (electronProcess) electronProcess.kill();
      if (serverProcess) serverProcess.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    electronProcess.on('close', (code) => {
      console.log('Electron closed, shutting down server...');
      cleanup();
    });
    
  } catch (error) {
    console.error('Error starting application:', error);
    console.log('\nTrying alternative startup method...');
    console.log('Please try running these commands manually:');
    console.log('1. node start-simple.js');
    console.log('2. npx electron . (in another terminal)');
    process.exit(1);
  }
})();