const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const DatabaseService = require('./client/src/services/database-electron.js');

let mainWindow;
let db;

// Initialize database
function initializeDatabase() {
  try {
    db = new DatabaseService();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
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
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add app icon if you have one
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the appropriate URL/file
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Send database ready event
    if (db) {
      mainWindow.webContents.send('database-ready', { success: true, hasDatabase: true });
    } else {
      mainWindow.webContents.send('database-ready', { success: false, hasDatabase: false });
    }
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

// Notification settings
ipcMain.handle('save-notification-settings', async (event, settings) => {
  // Save notification settings to local storage or database
  return { success: true };
});

ipcMain.handle('load-notification-settings', async (event) => {
  // Load notification settings
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
  // Handle notification scheduling
  return { success: true };
});

// Due task checking
function checkDueTasks() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('check-due-tasks');
  }
}

// Set up periodic due task checking
setInterval(checkDueTasks, 60000); // Check every minute