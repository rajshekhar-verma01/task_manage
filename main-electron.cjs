// CommonJS version of Electron main process to avoid ES module issues
const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine if we're in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let db;

// JSON Database Service - CommonJS version
class JSONDatabaseService {
  constructor() {
    try {
      // Get user data directory for database storage
      const userDataPath = app.getPath('userData');
      
      // Ensure the directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      
      this.dbPath = path.join(userDataPath, 'taskflow-data.json');
      console.log('Database path:', this.dbPath);
      
      this.initializeDatabase();
      console.log('JSON Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize JSON database:', error);
      throw error;
    }
  }

  initializeDatabase() {
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        tasks: {},
        recurringTasks: {},
        blogEntries: [],
        categories: {},
        subGoals: {},
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      this.saveData(initialData);
    }
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      return this.getEmptyStructure();
    }
  }

  saveData(data) {
    try {
      data.metadata.lastModified = new Date().toISOString();
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error saving database:', error);
      return { success: false, error: error.message };
    }
  }

  getEmptyStructure() {
    return {
      tasks: {},
      recurringTasks: {},
      blogEntries: [],
      categories: {},
      subGoals: {},
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Task operations
  saveTask(task, sectionId) {
    try {
      const data = this.loadData();
      
      if (!data.tasks[sectionId]) {
        data.tasks[sectionId] = [];
      }

      const taskId = task.id || this.generateId();
      const now = new Date().toISOString();
      
      const taskData = {
        ...task,
        id: taskId,
        sectionId,
        updatedAt: now,
        createdAt: task.createdAt || now
      };

      const existingIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
      if (existingIndex >= 0) {
        data.tasks[sectionId][existingIndex] = taskData;
      } else {
        data.tasks[sectionId].push(taskData);
      }

      const result = this.saveData(data);
      if (result.success) {
        console.log(`Task saved: ${task.title} in section ${sectionId}`);
        return { success: true, id: taskId };
      }
      return result;
    } catch (error) {
      console.error('Error saving task:', error);
      return { success: false, error: error.message };
    }
  }

  getTasks(sectionId) {
    try {
      const data = this.loadData();
      const tasks = data.tasks[sectionId] || [];
      console.log(`Loaded ${tasks.length} tasks for section ${sectionId}`);
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  updateTaskStatus(taskId, status) {
    try {
      const data = this.loadData();
      let updated = false;

      for (const sectionId in data.tasks) {
        const taskIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.tasks[sectionId][taskIndex].status = status;
          data.tasks[sectionId][taskIndex].updatedAt = new Date().toISOString();
          if (status === 'completed') {
            data.tasks[sectionId][taskIndex].completedAt = new Date().toISOString();
          }
          updated = true;
          break;
        }
      }

      if (updated) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Task ${taskId} status updated to ${status}`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Task not found' };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    }
  }

  deleteTask(taskId) {
    try {
      const data = this.loadData();
      let deleted = false;

      for (const sectionId in data.tasks) {
        const taskIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.tasks[sectionId].splice(taskIndex, 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Task ${taskId} deleted`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Task not found' };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  // Other methods for blog entries, categories, etc.
  saveBlogEntry(entry) {
    try {
      const data = this.loadData();
      const entryId = entry.id || this.generateId();
      const now = new Date().toISOString();
      
      const entryData = {
        ...entry,
        id: entryId,
        updatedAt: now,
        createdAt: entry.createdAt || now
      };

      const existingIndex = data.blogEntries.findIndex(e => e.id === entryId);
      if (existingIndex >= 0) {
        data.blogEntries[existingIndex] = entryData;
      } else {
        data.blogEntries.push(entryData);
      }

      const result = this.saveData(data);
      if (result.success) {
        console.log(`Blog entry saved: ${entry.title}`);
        return { success: true, id: entryId };
      }
      return result;
    } catch (error) {
      console.error('Error saving blog entry:', error);
      return { success: false, error: error.message };
    }
  }

  getBlogEntries() {
    try {
      const data = this.loadData();
      return data.blogEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting blog entries:', error);
      return [];
    }
  }

  getCategories(sectionId) {
    try {
      const data = this.loadData();
      return data.categories[sectionId] || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  addCategory(sectionId, categoryName) {
    try {
      const data = this.loadData();
      
      if (!data.categories[sectionId]) {
        data.categories[sectionId] = [];
      }

      if (!data.categories[sectionId].includes(categoryName)) {
        data.categories[sectionId].push(categoryName);
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Added category: ${categoryName} to section ${sectionId}`);
          return { success: true };
        }
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error: error.message };
    }
  }

  removeCategory(sectionId, categoryName) {
    try {
      const data = this.loadData();
      
      if (data.categories[sectionId]) {
        const index = data.categories[sectionId].indexOf(categoryName);
        if (index >= 0) {
          data.categories[sectionId].splice(index, 1);
          return this.saveData(data);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing category:', error);
      return { success: false, error: error.message };
    }
  }

  // Sub-goals and recurring tasks methods
  saveSubGoals(taskId, subGoals) {
    try {
      const data = this.loadData();
      data.subGoals[taskId] = subGoals;
      return this.saveData(data);
    } catch (error) {
      console.error('Error saving sub goals:', error);
      return { success: false, error: error.message };
    }
  }

  getSubGoals(taskId) {
    try {
      const data = this.loadData();
      return data.subGoals[taskId] || [];
    } catch (error) {
      console.error('Error getting sub goals:', error);
      return [];
    }
  }

  saveRecurringTask(task, sectionId) {
    // Similar to saveTask but for recurring tasks
    return this.saveTask(task, sectionId); // Simplified for now
  }

  getRecurringTasks(sectionId) {
    // Similar to getTasks but for recurring tasks
    return this.getTasks(sectionId); // Simplified for now
  }

  close() {
    console.log('JSON Database service closed');
  }
}

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
      allowRunningInsecureContent: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Wait for server to be ready
  if (isDev) {
    console.log('Waiting for development server...');
    
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
      
      console.error('✗ Development server not responding');
      dialog.showErrorBox('Server Connection Error', 
        'Could not connect to development server on port 5000.\n\n' +
        'Please start the server first:\nnpm run dev\n\nThen restart this application.'
      );
      return false;
    };
    
    waitForServer().then(success => {
      if (success) {
        console.log('Successfully loaded development server');
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Electron window is ready and shown');
    
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

// IPC handlers
ipcMain.handle('save-task', async (event, task, sectionId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveTask(task, sectionId);
});

ipcMain.handle('get-tasks', async (event, sectionId) => {
  if (!db) return [];
  return db.getTasks(sectionId);
});

ipcMain.handle('update-task-status', async (event, taskId, status) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.updateTaskStatus(taskId, status);
});

ipcMain.handle('delete-task', async (event, taskId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.deleteTask(taskId);
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

ipcMain.handle('save-sub-goals', async (event, taskId, subGoals) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveSubGoals(taskId, subGoals);
});

ipcMain.handle('get-sub-goals', async (event, taskId) => {
  if (!db) return [];
  return db.getSubGoals(taskId);
});

ipcMain.handle('save-recurring-task', async (event, task, sectionId) => {
  if (!db) return { success: false, error: 'Database not initialized' };
  return db.saveRecurringTask(task, sectionId);
});

ipcMain.handle('get-recurring-tasks', async (event, sectionId) => {
  if (!db) return [];
  return db.getRecurringTasks(sectionId);
});

ipcMain.handle('show-notification', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

console.log('Electron main process initialized (CommonJS)');