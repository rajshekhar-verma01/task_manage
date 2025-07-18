#!/usr/bin/env node

// Minimal Electron test to isolate the blank screen issue
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

console.log('=== Simple Electron Test ===');

// Create a minimal test HTML file
const testHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Test Window</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            background: #e8f5e8;
            color: #2d5016;
            border: 1px solid #b8e6b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Task Management App - Connection Test</h1>
        <div class="status">✓ Electron window is working</div>
        <div class="status">✓ HTML rendering is functional</div>
        <div class="status">✓ CSS styling is applied</div>
        
        <h2>Next Steps:</h2>
        <ol>
            <li>If you see this page, Electron is working correctly</li>
            <li>The issue is with connecting to the development server</li>
            <li>Make sure your server is running on port 5000</li>
            <li>Check the Electron console for connection errors</li>
        </ol>
        
        <h2>Server Test:</h2>
        <button onclick="testConnection()">Test Development Server Connection</button>
        <div id="connection-result"></div>
    </div>
    
    <script>
        function testConnection() {
            const result = document.getElementById('connection-result');
            result.innerHTML = '<p>Testing connection to localhost:5000...</p>';
            
            fetch('http://localhost:5000')
                .then(response => {
                    if (response.ok) {
                        result.innerHTML = '<div class="status">✓ Successfully connected to development server!</div>';
                    } else {
                        result.innerHTML = '<p style="color: red;">Server responded with status: ' + response.status + '</p>';
                    }
                })
                .catch(error => {
                    result.innerHTML = '<p style="color: red;">Failed to connect: ' + error.message + '</p>';
                });
        }
        
        console.log('Test page loaded successfully');
        
        // Auto-test connection on load
        setTimeout(testConnection, 1000);
    </script>
</body>
</html>`;

// Write test file
fs.writeFileSync('test-electron.html', testHTML);

// Create minimal Electron test script
const testElectronScript = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load test file first
  mainWindow.loadFile('test-electron.html');
  
  // Open DevTools
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  console.log('Test window created and loaded');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`;

fs.writeFileSync('test-electron.js', testElectronScript);

console.log('✓ Created test files');
console.log('✓ Starting Electron test...');

const electronProcess = spawn('npx', ['electron', 'test-electron.js'], {
  stdio: 'inherit',
  shell: true
});

electronProcess.on('error', (error) => {
  console.error('Failed to start test:', error);
});

electronProcess.on('close', (code) => {
  console.log('Test completed');
  // Cleanup
  fs.unlinkSync('test-electron.html');
  fs.unlinkSync('test-electron.js');
});