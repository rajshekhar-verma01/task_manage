const { app, BrowserWindow, Menu } = require('electron');
const { Notification, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

// Database service
let dbService = null;

// Try to initialize database
const initializeDatabase = () => {
  try {
    const DatabaseService = require('./src/services/database-electron.js');
    dbService = new DatabaseService();
    console.log('Database service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database service:', error);
    dbService = null;
    return false;
  }
};

// Enhanced notification manager
class NotificationManager extends EventEmitter {
  constructor() {
    super();
    this.intervals = new Map();
    this.lastCheck = new Map();
    this.isSystemSleeping = false;
    this.setupPowerMonitoring();
  }

  setupPowerMonitoring() {
    // Handle system sleep/wake
    powerMonitor.on('suspend', () => {
      console.log('System is going to sleep - pausing notifications');
      this.isSystemSleeping = true;
    });

    powerMonitor.on('resume', () => {
      console.log('System woke up - resuming notifications');
      this.isSystemSleeping = false;
      // Check for missed notifications during sleep
      this.checkMissedNotifications();
    });

    // Handle system lock/unlock
    powerMonitor.on('lock-screen', () => {
      console.log('Screen locked');
    });

    powerMonitor.on('unlock-screen', () => {
      console.log('Screen unlocked');
    });
  }

  createInterval(id, callback, intervalMs) {
    this.clearInterval(id);
    
    const wrappedCallback = () => {
      if (this.isSystemSleeping) {
        console.log(`Skipping notification check for ${id} - system sleeping`);
        return;
      }
      
      console.log(`Running notification check for ${id}`);
      this.lastCheck.set(id, Date.now());
      callback();
    };
    
    const intervalId = setInterval(wrappedCallback, intervalMs);
    this.intervals.set(id, { intervalId, intervalMs, callback: wrappedCallback });
    
    // Run immediately if not sleeping
    if (!this.isSystemSleeping) {
      wrappedCallback();
    }
  }

  clearInterval(id) {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval.intervalId);
      this.intervals.delete(id);
      this.lastCheck.delete(id);
    }
  }

  clearAllIntervals() {
    this.intervals.forEach((interval, id) => {
      clearInterval(interval.intervalId);
    });
    this.intervals.clear();
    this.lastCheck.clear();
  }

  checkMissedNotifications() {
    const now = Date.now();
    this.intervals.forEach((interval, id) => {
      const lastCheck = this.lastCheck.get(id) || 0;
      const timeSinceLastCheck = now - lastCheck;
      
      // If more than the interval time has passed, run the check
      if (timeSinceLastCheck >= interval.intervalMs) {
        console.log(`Running missed notification check for ${id}`);
        interval.callback();
      }
    });
  }

  getStatus() {
    return {
      activeIntervals: Array.from(this.intervals.keys()),
      isSystemSleeping: this.isSystemSleeping,
      lastChecks: Object.fromEntries(this.lastCheck),
    };
  }
}

// Create notification manager instance
const notificationManager = new NotificationManager();
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

// Check for due tasks in a specific section
const checkDueTasksForSection = (sectionId, config, sectionTasks) => {
  if (!sectionTasks || !mainWindow) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueTasks = [];
  
  // Check regular tasks
  if (sectionTasks.tasks) {
    sectionTasks.tasks.forEach(task => {
      if (task.status !== 'completed') {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate.getTime() <= today.getTime()) {
          // Only include if category doesn't have its own notification enabled
          const categoryConfig = config.categories && config.categories[task.category];
          if (!categoryConfig || !categoryConfig.enabled) {
            dueTasks.push(task);
          }
        }
      }
    });
  }
  
  // Check recurring tasks
  if (sectionTasks.recurringTasks) {
    sectionTasks.recurringTasks.forEach(task => {
      if (task.status !== 'completed') {
        const nextDate = new Date(task.nextOccurrence);
        nextDate.setHours(0, 0, 0, 0);
        
        if (nextDate.getTime() <= today.getTime()) {
          // Only include if category doesn't have its own notification enabled
          const categoryConfig = config.categories && config.categories[task.category];
          if (!categoryConfig || !categoryConfig.enabled) {
            dueTasks.push(task);
          }
        }
      }
    });
  }
  
  // Check sub-goals for personal development section
  if (sectionId === 'personal' && sectionTasks.tasks) {
    sectionTasks.tasks.forEach(task => {
      if (task.subGoals) {
        task.subGoals.forEach(subGoal => {
          if (subGoal.status !== 'completed') {
            const dueDate = new Date(subGoal.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate.getTime() <= today.getTime()) {
              // Only include if category doesn't have its own notification enabled
              const categoryConfig = config.categories && config.categories[subGoal.category];
              if (!categoryConfig || !categoryConfig.enabled) {
                dueTasks.push({
                  ...subGoal,
                  title: `${task.title} - ${subGoal.title}`,
                });
              }
            }
          }
        });
      }
    });
  }
  
  if (dueTasks.length > 0) {
    const sectionNames = {
      household: 'Household',
      personal: 'Personal Development',
      official: 'Official Work',
      blog: 'Blog'
    };
    
    const title = `${dueTasks.length} ${sectionNames[sectionId]} Task${dueTasks.length > 1 ? 's' : ''} Due`;
    const body = dueTasks.slice(0, 3).map(task => `• ${task.title}`).join('\n') + 
                 (dueTasks.length > 3 ? `\n...and ${dueTasks.length - 3} more` : '');
    
    showDesktopNotification(title, body, dueTasks);
  }
};

// Check for due tasks in a specific category
const checkDueTasksForCategory = (sectionId, categoryName, categoryConfig, sectionTasks) => {
  if (!sectionTasks || !mainWindow) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueTasks = [];
  
  // Check regular tasks for this category
  if (sectionTasks.tasks) {
    sectionTasks.tasks.forEach(task => {
      if (task.status !== 'completed' && task.category === categoryName) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate.getTime() <= today.getTime()) {
          dueTasks.push(task);
        }
      }
    });
  }
  
  // Check recurring tasks for this category
  if (sectionTasks.recurringTasks) {
    sectionTasks.recurringTasks.forEach(task => {
      if (task.status !== 'completed' && task.category === categoryName) {
        const nextDate = new Date(task.nextOccurrence);
        nextDate.setHours(0, 0, 0, 0);
        
        if (nextDate.getTime() <= today.getTime()) {
          dueTasks.push(task);
        }
      }
    });
  }
  
  // Check sub-goals for personal development section
  if (sectionId === 'personal' && sectionTasks.tasks) {
    sectionTasks.tasks.forEach(task => {
      if (task.subGoals) {
        task.subGoals.forEach(subGoal => {
          if (subGoal.status !== 'completed' && subGoal.category === categoryName) {
            const dueDate = new Date(subGoal.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate.getTime() <= today.getTime()) {
              dueTasks.push({
                ...subGoal,
                title: `${task.title} - ${subGoal.title}`,
              });
            }
          }
        });
      }
    });
  }
  
  if (dueTasks.length > 0) {
    const sectionNames = {
      household: 'Household',
      personal: 'Personal Development',
      official: 'Official Work',
      blog: 'Blog'
    };
    
    const title = `${dueTasks.length} ${categoryName} Task${dueTasks.length > 1 ? 's' : ''} Due (${sectionNames[sectionId]})`;
    const body = dueTasks.slice(0, 3).map(task => `• ${task.title}`).join('\n') + 
                 (dueTasks.length > 3 ? `\n...and ${dueTasks.length - 3} more` : '');
    
    showDesktopNotification(title, body, dueTasks);
  }
};

// Check for due tasks and show notifications
const checkDueTasks = () => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('check-due-tasks');
  }
};

// Setup notification intervals
const setupNotificationIntervals = (settings, allTasks = {}) => {
  // Clear existing intervals
  notificationManager.clearAllIntervals();

  console.log('Setting up notification intervals with settings:', settings);
  console.log('Available tasks:', Object.keys(allTasks));
  Object.entries(settings).forEach(([sectionId, config]) => {
    console.log(`Processing section ${sectionId}:`, config);
    
    if (config && config.enabled && config.interval > 0) {
      // Convert to minutes based on unit
      const intervalInMinutes = config.unit === 'hours' ? config.interval * 60 : config.interval;
      const intervalMs = intervalInMinutes * 60 * 1000; // Convert to milliseconds
      
      console.log(`Setting up section interval for ${sectionId}: ${intervalInMinutes} minutes`);
      
      notificationManager.createInterval(sectionId, () => {
        console.log(`Running section notification check for ${sectionId}`);
        checkDueTasksForSection(sectionId, config, allTasks[sectionId]);
      }, intervalMs);
      
      // Setup category-specific intervals
      if (config.categories) {
        Object.entries(config.categories).forEach(([categoryName, categoryConfig]) => {
          if (categoryConfig && categoryConfig.enabled && categoryConfig.interval > 0) {
            const categoryIntervalInMinutes = categoryConfig.unit === 'hours' ? 
              categoryConfig.interval * 60 : categoryConfig.interval;
            const categoryIntervalMs = categoryIntervalInMinutes * 60 * 1000;
            
            console.log(`Setting up category interval for ${sectionId}-${categoryName}: ${categoryIntervalInMinutes} minutes`);
            
            notificationManager.createInterval(`${sectionId}-${categoryName}`, () => {
              console.log(`Running category notification check for ${sectionId}-${categoryName}`);
              checkDueTasksForCategory(sectionId, categoryName, categoryConfig, allTasks[sectionId]);
            }, categoryIntervalMs);
          }
        });
      }
    }
  });
  
  console.log('Active notification intervals:', notificationManager.getStatus());
};

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');


function createWindow() {
  console.log('Creating Electron window...');
  console.log('Development mode:', isDev);
  
  // Initialize database service
  const dbInitialized = initializeDatabase();
  console.log('Database initialization:', dbInitialized ? 'SUCCESS' : 'FAILED - using localStorage fallback');
  
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
    notificationManager.clearAllIntervals();
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
    setupNotificationIntervals(settings, {});
    
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
  // Keep notifications running even when all windows are closed (except on macOS)
  if (process.platform !== 'darwin') {
    notificationManager.clearAllIntervals();
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
  // We'll need to get current tasks data for proper interval setup
  // For now, setup with empty data - intervals will be updated when tasks are available
  setupNotificationIntervals(settings, {});
  return { success: true };
});

ipcMain.handle('load-notification-settings', () => {
  return loadNotificationSettings();
});

ipcMain.handle('show-notification', (event, { title, body, tasks }) => {
  showDesktopNotification(title, body, tasks);
  return { success: true };
});

// Database IPC handlers
ipcMain.handle('db-save-task', (event, task, sectionId) => {
  if (dbService) {
    try {
      return dbService.saveTask(task, sectionId);
    } catch (error) {
      console.error('Error in db-save-task:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-get-tasks', (event, sectionId) => {
  if (dbService) {
    try {
      return dbService.getTasks(sectionId);
    } catch (error) {
      console.error('Error in db-get-tasks:', error);
      return [];
    }
  }
  return [];
});

ipcMain.handle('db-save-recurring-task', (event, task, sectionId) => {
  if (dbService) {
    try {
      return dbService.saveRecurringTask(task, sectionId);
    } catch (error) {
      console.error('Error in db-save-recurring-task:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-get-recurring-tasks', (event, sectionId) => {
  if (dbService) {
    try {
      return dbService.getRecurringTasks(sectionId);
    } catch (error) {
      console.error('Error in db-get-recurring-tasks:', error);
      return [];
    }
  }
  return [];
});

ipcMain.handle('db-save-blog-entry', (event, entry) => {
  if (dbService) {
    try {
      return dbService.saveBlogEntry(entry);
    } catch (error) {
      console.error('Error in db-save-blog-entry:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-get-blog-entries', () => {
  if (dbService) {
    try {
      return dbService.getBlogEntries();
    } catch (error) {
      console.error('Error in db-get-blog-entries:', error);
      return [];
    }
  }
  return [];
});

ipcMain.handle('db-get-categories', (event, sectionId) => {
  if (dbService) {
    try {
      return dbService.getCategories(sectionId);
    } catch (error) {
      console.error('Error in db-get-categories:', error);
      return [];
    }
  }
  return [];
});

ipcMain.handle('db-add-category', (event, sectionId, categoryName) => {
  if (dbService) {
    try {
      return dbService.addCategory(sectionId, categoryName);
    } catch (error) {
      console.error('Error in db-add-category:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-remove-category', (event, sectionId, categoryName) => {
  if (dbService) {
    try {
      return dbService.removeCategory(sectionId, categoryName);
    } catch (error) {
      console.error('Error in db-remove-category:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-update-task-status', (event, taskId, status) => {
  if (dbService) {
    try {
      return dbService.updateTaskStatus(taskId, status);
    } catch (error) {
      console.error('Error in db-update-task-status:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-update-recurring-task-status', (event, taskId, status) => {
  if (dbService) {
    try {
      return dbService.updateRecurringTaskStatus(taskId, status);
    } catch (error) {
      console.error('Error in db-update-recurring-task-status:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-update-blog-entry-status', (event, entryId, status) => {
  if (dbService) {
    try {
      return dbService.updateBlogEntryStatus(entryId, status);
    } catch (error) {
      console.error('Error in db-update-blog-entry-status:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-update-subgoal-status', (event, subGoalId, status) => {
  if (dbService) {
    try {
      return dbService.updateSubGoalStatus(subGoalId, status);
    } catch (error) {
      console.error('Error in db-update-subgoal-status:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-delete-task', (event, taskId) => {
  if (dbService) {
    try {
      return dbService.deleteTask(taskId);
    } catch (error) {
      console.error('Error in db-delete-task:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-delete-recurring-task', (event, taskId) => {
  if (dbService) {
    try {
      return dbService.deleteRecurringTask(taskId);
    } catch (error) {
      console.error('Error in db-delete-recurring-task:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-delete-blog-entry', (event, entryId) => {
  if (dbService) {
    try {
      return dbService.deleteBlogEntry(entryId);
    } catch (error) {
      console.error('Error in db-delete-blog-entry:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Database not initialized' };
});

ipcMain.handle('db-get-section-data', (event, sectionId) => {
  if (dbService) {
    try {
      return dbService.getSectionData(sectionId);
    } catch (error) {
      console.error('Error in db-get-section-data:', error);
      return null;
    }
  }
  return null;
});

// Handle task data updates for notification intervals
ipcMain.handle('update-notification-intervals', (event, allTasks) => {
  const settings = loadNotificationSettings();
  setupNotificationIntervals(settings, allTasks);
  return { success: true };
});

// Add IPC handler for notification status
ipcMain.handle('get-notification-status', () => {
  return notificationManager.getStatus();
});

// Add IPC handler to manually trigger notification check
ipcMain.handle('trigger-notification-check', () => {
  notificationManager.checkMissedNotifications();
  return { success: true };
});

// Handle task data updates for notification intervals
ipcMain.handle('update-notification-intervals', (event, allTasks) => {
  console.log('Received task data update for notification intervals');
  const settings = loadNotificationSettings();
  console.log('Loaded notification settings:', settings);
  setupNotificationIntervals(settings, allTasks);
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