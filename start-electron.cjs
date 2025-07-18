#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Electron Task Management App...');

// Check if the server is already running
const checkServer = () => {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      resolve(false);
    });
    
    req.end();
  });
};

// Start the development server
const startServer = () => {
  return new Promise((resolve) => {
    console.log('Starting development server...');
    
    // Use cross-platform npm command
    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    
    const server = spawn(npmCmd, ['run', 'dev'], { 
      stdio: 'inherit',
      shell: true
    });
    
    server.on('error', (error) => {
      console.error('Failed to start server:', error);
      console.log('Please ensure npm is installed and in your PATH');
      process.exit(1);
    });
    
    // Wait for server to be ready
    const checkInterval = setInterval(async () => {
      if (await checkServer()) {
        clearInterval(checkInterval);
        resolve(server);
      }
    }, 1000);
  });
};

// Start Electron
const startElectron = () => {
  console.log('Starting Electron application...');
  
  // Use cross-platform npx command
  const isWindows = process.platform === 'win32';
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';
  
  const electron = spawn(npxCmd, ['electron', '.'], { 
    stdio: 'inherit',
    shell: true
  });
  
  electron.on('error', (error) => {
    console.error('Failed to start Electron:', error);
    console.log('Please ensure Electron is installed. Try running: npm install electron');
    process.exit(1);
  });
  
  electron.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    process.exit(code);
  });
  
  return electron;
};

// Main execution
(async () => {
  try {
    // Check if server is already running
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      // Start the development server
      const serverProcess = await startServer();
      console.log('Development server started successfully!');
      
      // Start Electron
      const electronProcess = startElectron();
      
      // Handle cleanup
      process.on('SIGINT', () => {
        console.log('\nShutting down...');
        if (serverProcess) serverProcess.kill();
        if (electronProcess) electronProcess.kill();
        process.exit(0);
      });
    } else {
      console.log('Development server already running, starting Electron...');
      startElectron();
    }
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
})();