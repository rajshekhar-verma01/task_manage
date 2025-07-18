#!/usr/bin/env node

// Simple alternative script that uses direct Node.js execution
const { exec } = require('child_process');
const http = require('http');

console.log('Starting Electron Task Management App (Simple Version)...');

// Check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

// Main execution
(async () => {
  try {
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      console.log('Development server is not running.');
      console.log('Please start the server first with: npm run dev');
      console.log('Then run this script again, or use: npx electron .');
      process.exit(1);
    }
    
    console.log('Development server is running, starting Electron...');
    
    // Start Electron using exec instead of spawn
    const electronProcess = exec('npx electron .', (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting Electron:', error);
        return;
      }
      if (stderr) {
        console.error('Electron stderr:', stderr);
      }
      if (stdout) {
        console.log('Electron stdout:', stdout);
      }
    });
    
    electronProcess.on('exit', (code) => {
      console.log(`Electron process exited with code ${code}`);
      process.exit(code);
    });
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\nShutting down Electron...');
      electronProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();