const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    saveTask: (task, sectionId) => ipcRenderer.invoke('save-task', task, sectionId),
    getTasks: (sectionId) => ipcRenderer.invoke('get-tasks', sectionId),
    saveRecurringTask: (task, sectionId) => ipcRenderer.invoke('save-recurring-task', task, sectionId),
    getRecurringTasks: (sectionId) => ipcRenderer.invoke('get-recurring-tasks', sectionId),
    saveBlogEntry: (entry) => ipcRenderer.invoke('save-blog-entry', entry),
    getBlogEntries: () => ipcRenderer.invoke('get-blog-entries'),
    getCategories: (sectionId) => ipcRenderer.invoke('get-categories', sectionId),
    addCategory: (sectionId, categoryName) => ipcRenderer.invoke('add-category', sectionId, categoryName),
    removeCategory: (sectionId, categoryName) => ipcRenderer.invoke('remove-category', sectionId, categoryName),
    updateTaskStatus: (taskId, status) => ipcRenderer.invoke('update-task-status', taskId, status),
    updateRecurringTaskStatus: (taskId, status) => ipcRenderer.invoke('update-recurring-task-status', taskId, status),
    updateBlogEntryStatus: (entryId, status) => ipcRenderer.invoke('update-blog-entry-status', entryId, status),
    updateSubGoalStatus: (subGoalId, status) => ipcRenderer.invoke('update-sub-goal-status', subGoalId, status),
    deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
    deleteRecurringTask: (taskId) => ipcRenderer.invoke('delete-recurring-task', taskId),
    deleteBlogEntry: (entryId) => ipcRenderer.invoke('delete-blog-entry', entryId),
    getSectionData: (sectionId) => ipcRenderer.invoke('get-section-data', sectionId)
  },

  // Notification operations
  saveNotificationSettings: (settings) => ipcRenderer.invoke('save-notification-settings', settings),
  loadNotificationSettings: () => ipcRenderer.invoke('load-notification-settings'),
  showNotification: (data) => ipcRenderer.invoke('show-notification', data),
  updateNotificationIntervals: (allTasks) => ipcRenderer.invoke('update-notification-intervals', allTasks),

  // Event listeners
  onDatabaseReady: (callback) => {
    const subscription = (event, data) => callback(event, data);
    ipcRenderer.on('database-ready', subscription);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('database-ready', subscription);
    };
  },

  onCheckDueTasks: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('check-due-tasks', subscription);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('check-due-tasks', subscription);
    };
  }
});