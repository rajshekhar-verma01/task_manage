const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;

// Initialize database
function initializeDatabase() {
  try {
    // Use absolute path to avoid module resolution issues
    const dbPath = path.join(__dirname, 'src', 'services', 'database-electron.cjs');
    console.log('Loading database from:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database service file not found at:', dbPath);
      return false;
    }
    
    const DatabaseService = require(dbPath);
    db = new DatabaseService();
    console.log('✓ Database service initialized successfully');
    
    // Test database connection
    const testCategories = db.getCategories('household');
    console.log(`✓ Database test - household categories: ${testCategories.length}`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Error details:', error.message);
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

  // Always try to load from development server first
  console.log('Attempting to load from development server...');
  
  // Check if server is running immediately
  checkServer().then(isServerRunning => {
    if (isServerRunning) {
      console.log('✓ Development server found, loading from http://localhost:5000');
      mainWindow.loadURL('http://localhost:5000')
        .then(() => {
          console.log('✓ Successfully loaded from development server');
          if (isDev) {
            mainWindow.webContents.openDevTools();
          }
        })
        .catch(error => {
          console.error('✗ Failed to load from development server:', error);
          loadFallback();
        });
    } else {
      console.log('✗ Development server not running, trying fallback...');
      loadFallback();
    }
  }).catch(error => {
    console.error('✗ Error checking server:', error);
    loadFallback();
  });
  
  function loadFallback() {
    console.log('Loading fallback content...');
    // Create a simple HTML page if no server is running
    const fallbackHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Task Management App</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center;
            background: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .error { color: #e74c3c; }
          .instruction { 
            background: #ecf0f1; 
            padding: 20px; 
            border-radius: 4px; 
            margin: 20px 0;
            text-align: left;
          }
          code { 
            background: #2c3e50; 
            color: white; 
            padding: 2px 6px; 
            border-radius: 3px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Task Management Desktop App</h1>
          <p class="error">⚠️ Development server not running</p>
          <div class="instruction">
            <h3>To start the app:</h3>
            <ol>
              <li>Open a terminal in your project directory</li>
              <li>Run: <code>npm run dev</code></li>
              <li>Wait for "serving on port 5000" message</li>
              <li>Restart this Electron app</li>
            </ol>
          </div>
          <p>The development server should be running on <strong>http://localhost:5000</strong></p>
          <button onclick="location.reload()" style="
            background: #3498db; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 16px;
          ">Retry Connection</button>
        </div>
      </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHTML)}`);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    
    // Initialize database after window is shown
    setTimeout(() => {
      console.log('Initializing database...');
      const dbReady = initializeDatabase();
      
      // Send database ready event to renderer
      mainWindow.webContents.send('database-ready', { 
        success: dbReady, 
        hasDatabase: dbReady 
      });
    }, 1000);
  });
  
  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
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