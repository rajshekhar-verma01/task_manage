#!/usr/bin/env node

// Electron launcher that uses specific package.json configuration
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Task Management App - Electron Launcher');
console.log('=====================================');

// Check files exist
const requiredFiles = ['electron-main.js', 'electron-package.json', 'preload.js'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('✓ All required files found');
console.log('✓ Using electron-package.json configuration');

// Set environment
process.env.NODE_ENV = 'development';

// Launch Electron with specific package.json
const electronProcess = spawn('npx', ['electron', '.', '--package-json=electron-package.json'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

electronProcess.on('error', (error) => {
  console.error('Failed to start Electron:', error);
  console.log('\nFallback: Trying direct method...');
  
  // Fallback: try direct execution
  const fallbackProcess = spawn('npx', ['electron', 'electron-main.js'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });
  
  fallbackProcess.on('error', (fallbackError) => {
    console.error('Fallback also failed:', fallbackError);
    console.log('\nTroubleshooting:');
    console.log('1. Install Electron: npm install electron');
    console.log('2. Check Node.js version: node --version');
    console.log('3. Try manual command: npx electron electron-main.js');
  });
});

electronProcess.on('close', (code) => {
  console.log(`Application closed with code: ${code}`);
});