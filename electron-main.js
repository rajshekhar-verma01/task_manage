// Electron main entry point with proper ES module handling
import { app, BrowserWindow, ipcMain, Notification, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import JSONDatabaseService from './client/src/services/database-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;

// Initialize database
function initializeDatabase() {
  try {
    db = new JSONDatabaseService();
    console.log('JSON Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize JSON database:', error);
    dialog.showErrorBox('Database Error', 'Failed to initialize database: ' + error.message);
    return false;
  }
}

function createWindow() {
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
      webSecurity: false, // Allow localhost connections in development
      allowRunningInsecureContent: true, // Allow HTTP in development
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add app icon if you have one
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Wait a moment for server to be ready, then load URL
  if (isDev) {
    console.log('Waiting for development server to be ready...');
    
    // Function to check if server is ready
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
    
    // Wait for server to be ready with retries
    const waitForServer = async (retries = 10) => {
      for (let i = 0; i < retries; i++) {
        const isReady = await checkServer();
        if (isReady) {
          console.log('✓ Development server is ready, loading URL...');
          await mainWindow.loadURL('http://localhost:5000');
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
    
    // Wait for server and load URL
    waitForServer().then(success => {
      if (success) {
        console.log('Successfully loaded development server');
        // Open DevTools after successful load
        mainWindow.webContents.openDevTools();
      }
    });
    
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, 'dist/public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Electron window is ready and shown');
    
    // Send database ready event
    if (db) {
      mainWindow.webContents.send('database-ready', { success: true, hasDatabase: true });
    } else {
      mainWindow.webContents.send('database-ready', { success: false, hasDatabase: false });
    }
  });

  // Add debugging for load events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Started loading content...');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading content successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    dialog.showErrorBox('Load Failed', `Failed to load ${validatedURL}: ${errorDescription}`);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    dialog.showErrorBox('Crash', 'The application crashed unexpectedly');
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
  const dbInitialized = initializeDatabase();
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

ipcMain.handle('delete-task', async (event, taskId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.deleteTask(taskId);
});

ipcMain.handle('save-sub-goals', async (event, taskId, subGoals) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveSubGoals(taskId, subGoals);
});

ipcMain.handle('get-sub-goals', async (event, taskId) => {
  if (!db) return [];
  return db.getSubGoals(taskId);
});

// Notification handlers
ipcMain.handle('show-notification', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

console.log('Electron main process initialized');