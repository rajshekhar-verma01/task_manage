#!/usr/bin/env node

// Debug script to check server and launch Electron with detailed logging
const { spawn } = require('child_process');
const http = require('http');

console.log('=== Electron Debug Launcher ===');

// Check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    console.log('Checking development server...');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      path: '/',
      timeout: 5000
    }, (res) => {
      console.log(`✓ Server responding with status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.error('✗ Server check failed:', err.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error('✗ Server check timed out');
      resolve(false);
    });
    
    req.end();
  });
};

const startElectron = () => {
  console.log('Starting Electron with debug logging...');
  
  const electronProcess = spawn('npx', ['electron', 'electron-main.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_ENABLE_LOGGING: '1',
      ELECTRON_LOG_LEVEL: 'info'
    }
  });
  
  electronProcess.on('error', (error) => {
    console.error('Failed to start Electron:', error);
  });
  
  electronProcess.on('close', (code) => {
    console.log(`Electron closed with code: ${code}`);
  });
  
  return electronProcess;
};

// Main execution
(async () => {
  try {
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      console.log('\n⚠️  Development server is not responding on port 5000');
      console.log('Please make sure to start the server first:');
      console.log('  npm run dev');
      console.log('\nThen try running Electron again.');
      process.exit(1);
    }
    
    console.log('\n✓ Server is running, launching Electron...\n');
    startElectron();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();