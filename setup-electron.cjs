#!/usr/bin/env node

// Setup script to prepare Electron environment
const fs = require('fs');
const { spawn } = require('child_process');

console.log('Setting up Electron environment...');

// Create directory structure if needed
const dirs = ['data'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Check package.json setup
const packagePath = 'electron-package.json';
if (fs.existsSync(packagePath)) {
  console.log('✓ Electron package configuration found');
} else {
  console.log('✗ Electron package configuration missing');
}

// Check main files
const mainFiles = ['electron-main.js', 'preload.js'];
mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} found`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Test Electron installation
console.log('\nTesting Electron installation...');
const testProcess = spawn('npx', ['electron', '--version'], {
  stdio: 'pipe',
  shell: true
});

testProcess.stdout.on('data', (data) => {
  console.log(`✓ Electron version: ${data.toString().trim()}`);
});

testProcess.stderr.on('data', (data) => {
  console.error(`Electron test error: ${data.toString()}`);
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✓ Electron is properly installed');
    console.log('\nReady to launch! Use:');
    console.log('  node launch-with-config.cjs');
  } else {
    console.log('✗ Electron installation issue');
    console.log('Try: npm install electron');
  }
});