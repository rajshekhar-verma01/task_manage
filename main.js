const { app, BrowserWindow, Menu } = require('electron');
const { Notification, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Notification intervals storage
let notificationIntervals = new Map();
let mainWindow;

// Database path for notifications
const getNotificationDataPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'notifications.json');
};

// Load notification settings
const loadNotificationSettings = () => {
  try {
    const dataPath = getNotificationDataPath();
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  return {};
};

// Save notification settings
const saveNotificationSettings = (settings) => {
  try {
    const dataPath = getNotificationDataPath();
    fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// Show desktop notification
const showDesktopNotification = (title, body, tasks = []) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, 'public', 'icon.png'),
      urgency: 'normal',
      timeoutType: 'default'
    });

    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.show();
      }
    });

    notification.show();
  }
};

// Check for due tasks and show notifications
const checkDueTasks = () => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('check-due-tasks');
  }
};

// Setup notification intervals
const setupNotificationIntervals = (settings) => {
  // Clear existing intervals
  notificationIntervals.forEach(interval => clearInterval(interval));
  notificationIntervals.clear();

  Object.entries(settings).forEach(([sectionId, config]) => {
    if (config.enabled && config.interval > 0) {
      const intervalMs = config.interval * 60 * 1000; // Convert minutes to milliseconds
      const intervalId = setInterval(() => {
        checkDueTasks();
      }, intervalMs);
      notificationIntervals.set(sectionId, intervalId);
    }
  });
};

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');


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
      preload: path.join(__dirname, 'public', 'preload.js'),
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
    // Clear notification intervals
    notificationIntervals.forEach(interval => clearInterval(interval));
    notificationIntervals.clear();
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
    
    // Load and setup notification settings
    const settings = loadNotificationSettings();
    setupNotificationIntervals(settings);
    
    // Show startup popup after a short delay
    setTimeout(() => {
      checkDueTasks();
    }, 2000);
  });
}

// App event listeners
app.whenReady().then(() => {
  console.log('Electron app is ready');
  console.log('Process arguments:', process.argv);
  console.log('Environment NODE_ENV:', process.env.NODE_ENV);
  
  // Request notification permission
  if (process.platform === 'darwin') {
    app.dock.setBadge('');
  }
  
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

// IPC handlers for notifications
ipcMain.handle('save-notification-settings', (event, settings) => {
  saveNotificationSettings(settings);
  setupNotificationIntervals(settings);
  return { success: true };
});

ipcMain.handle('load-notification-settings', () => {
  return loadNotificationSettings();
});

ipcMain.handle('show-notification', (event, { title, body, tasks }) => {
  showDesktopNotification(title, body, tasks);
  return { success: true };
});

ipcMain.handle('show-due-tasks-popup', (event, dueTasks) => {
  if (dueTasks && dueTasks.length > 0) {
    // Show notification for due tasks
    const taskCount = dueTasks.length;
    const title = `${taskCount} Task${taskCount > 1 ? 's' : ''} Due Today`;
    const body = dueTasks.slice(0, 3).map(task => `• ${task.title}`).join('\n') + 
                 (taskCount > 3 ? `\n...and ${taskCount - 3} more` : '');
    
    showDesktopNotification(title, body, dueTasks);
    
    // Focus window if minimized
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  }
});