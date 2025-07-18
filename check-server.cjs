#!/usr/bin/env node

// Server status checker
const http = require('http');

console.log('Checking development server status...');

const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      path: '/',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✓ Server responding with status: ${res.statusCode}`);
        console.log(`✓ Content-Type: ${res.headers['content-type']}`);
        console.log(`✓ Content length: ${data.length} bytes`);
        
        if (data.includes('<title>') || data.includes('<!DOCTYPE html>')) {
          console.log('✓ HTML content detected');
        }
        
        if (data.includes('vite') || data.includes('@vite/client')) {
          console.log('✓ Vite development server detected');
        }
        
        resolve({ success: true, statusCode: res.statusCode, contentType: res.headers['content-type'] });
      });
    });
    
    req.on('error', (err) => {
      console.error('✗ Server connection failed:', err.message);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.error('✗ Server request timed out');
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

checkServer()
  .then(result => {
    console.log('\n✅ Server is ready for Electron connection');
    process.exit(0);
  })
  .catch(error => {
    console.log('\n❌ Server is not ready');
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  });