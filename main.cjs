const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;

// Initialize database
function initializeDatabase() {
  try {
    const DatabaseService = require('./src/services/database-electron.cjs');
    db = new DatabaseService();
    console.log('✓ Database service initialized successfully');
    
    // Test database connection
    const testCategories = db.getCategories('household');
    console.log(`✓ Database test - household categories: ${testCategories.length}`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Will continue without database - using localStorage fallback');
    return false;
  }
}

// Check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

function createWindow() {
  console.log('Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow localhost in development
      allowRunningInsecureContent: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the appropriate URL/file
  if (isDev) {
    console.log('Development mode - checking server...');
    
    // Wait for server to be ready
    const waitForServer = async (retries = 15) => {
      for (let i = 0; i < retries; i++) {
        const isReady = await checkServer();
        if (isReady) {
          console.log('✓ Development server is ready, loading URL...');
          await mainWindow.loadURL('http://localhost:5000');
          mainWindow.webContents.openDevTools();
          return true;
        }
        console.log(`Waiting for server... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.error('✗ Development server not responding after retries');
      dialog.showErrorBox('Server Connection Error', 
        'Could not connect to development server on port 5000.\n\n' +
        'Please ensure the server is running by executing:\nnpm run dev'
      );
      return false;
    };
    
    waitForServer().then(success => {
      if (success) {
        console.log('Successfully loaded development server');
      }
    });
  } else {
    console.log('Production mode - loading built files...');
    mainWindow.loadFile(path.join(__dirname, 'dist/public/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });
  
  // Initialize database after window content loads
  mainWindow.webContents.once('dom-ready', () => {
    console.log('DOM ready, initializing database...');
    const dbReady = initializeDatabase();
    
    // Send database ready event to renderer
    mainWindow.webContents.send('database-ready', { 
      success: dbReady, 
      hasDatabase: dbReady 
    });
  });

  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    dialog.showErrorBox('Load Failed', `Failed to load ${validatedURL}: ${errorDescription}`);
  });

  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Started loading content...');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading content successfully');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (db) {
      db.close();
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});

// IPC handlers for database operations
ipcMain.handle('save-task', async (event, task, sectionId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveTask(task, sectionId);
});

ipcMain.handle('get-tasks', async (event, sectionId) => {
  if (!db) return [];
  return db.getTasks(sectionId);
});

ipcMain.handle('save-recurring-task', async (event, task, sectionId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveRecurringTask(task, sectionId);
});

ipcMain.handle('get-recurring-tasks', async (event, sectionId) => {
  if (!db) return [];
  return db.getRecurringTasks(sectionId);
});

ipcMain.handle('save-blog-entry', async (event, entry) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveBlogEntry(entry);
});

ipcMain.handle('get-blog-entries', async (event) => {
  if (!db) return [];
  return db.getBlogEntries();
});

ipcMain.handle('get-categories', async (event, sectionId) => {
  if (!db) return [];
  return db.getCategories(sectionId);
});

ipcMain.handle('add-category', async (event, sectionId, categoryName) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.addCategory(sectionId, categoryName);
});

ipcMain.handle('remove-category', async (event, sectionId, categoryName) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.removeCategory(sectionId, categoryName);
});

ipcMain.handle('update-task-status', async (event, taskId, status) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.updateTaskStatus(taskId, status);
});

ipcMain.handle('update-recurring-task-status', async (event, taskId, status) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.updateRecurringTaskStatus(taskId, status);
});

ipcMain.handle('update-blog-entry-status', async (event, entryId, status) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.updateBlogEntryStatus(entryId, status);
});

ipcMain.handle('update-sub-goal-status', async (event, subGoalId, status) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.updateSubGoalStatus(subGoalId, status);
});

ipcMain.handle('delete-task', async (event, taskId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.deleteTask(taskId);
});

ipcMain.handle('delete-recurring-task', async (event, taskId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.deleteRecurringTask(taskId);
});

ipcMain.handle('delete-blog-entry', async (event, entryId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.deleteBlogEntry(entryId);
});

ipcMain.handle('get-section-data', async (event, sectionId) => {
  if (!db) return null;
  return db.getSectionData(sectionId);
});

// Notification settings (single handler only)
ipcMain.handle('save-notification-settings', async (event, settings) => {
  console.log('Saving notification settings:', settings);
  return { success: true };
});

ipcMain.handle('load-notification-settings', async (event) => {
  console.log('Loading notification settings');
  return {};
});

ipcMain.handle('show-notification', async (event, { title, body, tasks }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false,
    });
    
    notification.show();
    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

ipcMain.handle('update-notification-intervals', async (event, allTasks) => {
  console.log('Updating notification intervals for tasks');
  return { success: true };
});

// Due task checking
function checkDueTasks() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('check-due-tasks');
  }
}

// Set up periodic due task checking (every 5 minutes)
setInterval(checkDueTasks, 5 * 60 * 1000);

console.log('Electron main process initialized');