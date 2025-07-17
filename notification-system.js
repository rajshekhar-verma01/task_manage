const { app, BrowserWindow, Menu } = require('electron');
const { Notification, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

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

// IPC handlers for notifications
const setupNotificationIPC = () => {
  // Save notification settings
  ipcMain.handle('save-notification-settings', (event, settings) => {
    saveNotificationSettings(settings);
    // Setup intervals with empty data initially - will be updated when tasks are available
    setupNotificationIntervals(settings, {});
    return { success: true };
  });

  // Load notification settings
  ipcMain.handle('load-notification-settings', () => {
    return loadNotificationSettings();
  });

  // Show desktop notification
  ipcMain.handle('show-notification', (event, { title, body, tasks }) => {
    showDesktopNotification(title, body, tasks);
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

  // Get notification status
  ipcMain.handle('get-notification-status', () => {
    return notificationManager.getStatus();
  });

  // Manually trigger notification check
  ipcMain.handle('trigger-notification-check', () => {
    notificationManager.checkMissedNotifications();
    return { success: true };
  });

  // Show due tasks popup
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
};

// Initialize notification system
const initializeNotificationSystem = (window) => {
  mainWindow = window;
  
  // Setup IPC handlers
  setupNotificationIPC();
  
  // Load and setup notification settings on app start
  const settings = loadNotificationSettings();
  setupNotificationIntervals(settings, {});
  
  // Show startup popup after a short delay
  setTimeout(() => {
    checkDueTasks();
  }, 2000);
  
  // Cleanup on window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    notificationManager.clearAllIntervals();
  });
};

// Export the notification system
module.exports = {
  NotificationManager,
  notificationManager,
  initializeNotificationSystem,
  setupNotificationIntervals,
  checkDueTasks,
  showDesktopNotification,
  loadNotificationSettings,
  saveNotificationSettings
};