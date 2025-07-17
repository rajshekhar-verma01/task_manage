const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  console.log('Creating Electron window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
  });

  // Load the app
  if (isDev) {
    console.log('Loading development server...');
    mainWindow.loadURL('http://localhost:5173');
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    
    // Handle dev server not ready
    mainWindow.webContents.on('did-fail-load', () => {
      console.log('Failed to load dev server, retrying in 2 seconds...');
      setTimeout(() => {
        mainWindow.reload();
      }, 2000);
    });
  } else {
    console.log('Loading production build...');
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready, showing...');
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Debug logs
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });
}

// App event listeners
app.whenReady().then(() => {
  console.log('Electron app is ready');
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

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});