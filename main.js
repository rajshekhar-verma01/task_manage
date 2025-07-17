const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  console.log('Creating Electron window...');
  console.log('Development mode:', isDev);
  
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
    console.log('Loading development server at http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173')
      .then(() => {
        console.log('Successfully loaded development server');
      })
      .catch((error) => {
        console.error('Failed to load development server:', error);
        // Retry after a short delay
        setTimeout(() => {
          console.log('Retrying to load development server...');
          mainWindow.loadURL('http://localhost:5173');
        }, 2000);
      });
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading production build...');
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Index path:', indexPath);
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

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load:', errorCode, errorDescription, 'URL:', validatedURL);
    
    // If development server failed, try again
    if (isDev && validatedURL.includes('localhost:5173')) {
      console.log('Development server not ready, retrying in 3 seconds...');
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173');
      }, 3000);
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });
}

// App event listeners
app.whenReady().then(() => {
  console.log('Electron app is ready');
  console.log('Process arguments:', process.argv);
  console.log('Environment NODE_ENV:', process.env.NODE_ENV);
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