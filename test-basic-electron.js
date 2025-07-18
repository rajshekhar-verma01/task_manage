// Very basic Electron test using CommonJS syntax to avoid module issues
const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  console.log('Creating basic test window...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load a simple test page instead of trying to connect to server
  mainWindow.loadURL('data:text/html,<html><body><h1>Electron Test</h1><p>If you see this, Electron is working!</p></body></html>');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  console.log('Test window created successfully');
}

app.whenReady().then(() => {
  console.log('Electron app ready, creating window...');
  createWindow();
});

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

console.log('Basic Electron test script loaded');