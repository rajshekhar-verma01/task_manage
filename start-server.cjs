#!/usr/bin/env node

// Direct Node.js server startup script that bypasses npm scripts
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development server directly...');

// Set environment variable
process.env.NODE_ENV = 'development';

// Start tsx directly
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});