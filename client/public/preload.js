const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveNotificationSettings: (settings) => ipcRenderer.invoke('save-notification-settings', settings),
  loadNotificationSettings: () => ipcRenderer.invoke('load-notification-settings'),
  showNotification: (data) => ipcRenderer.invoke('show-notification', data),
  onCheckDueTasks: (callback) => {
    ipcRenderer.on('check-due-tasks', callback);
    return () => ipcRenderer.removeListener('check-due-tasks', callback);
  },
  updateNotificationIntervals: (allTasks) => ipcRenderer.invoke('update-notification-intervals', allTasks),
  
  // Database ready event
  onDatabaseReady: (callback) => {
    ipcRenderer.on('database-ready', callback);
    return () => ipcRenderer.removeListener('database-ready', callback);
  },
  
  // Database operations
  db: {
    saveTask: (task, sectionId) => ipcRenderer.invoke('db-save-task', task, sectionId),
    getTasks: (sectionId) => ipcRenderer.invoke('db-get-tasks', sectionId),
    saveRecurringTask: (task, sectionId) => ipcRenderer.invoke('db-save-recurring-task', task, sectionId),
    getRecurringTasks: (sectionId) => ipcRenderer.invoke('db-get-recurring-tasks', sectionId),
    saveBlogEntry: (entry) => ipcRenderer.invoke('db-save-blog-entry', entry),
    getBlogEntries: () => ipcRenderer.invoke('db-get-blog-entries'),
    getCategories: (sectionId) => ipcRenderer.invoke('db-get-categories', sectionId),
    addCategory: (sectionId, categoryName) => ipcRenderer.invoke('db-add-category', sectionId, categoryName),
    removeCategory: (sectionId, categoryName) => ipcRenderer.invoke('db-remove-category', sectionId, categoryName),
    updateTaskStatus: (taskId, status) => ipcRenderer.invoke('db-update-task-status', taskId, status),
    updateRecurringTaskStatus: (taskId, status) => ipcRenderer.invoke('db-update-recurring-task-status', taskId, status),
    updateBlogEntryStatus: (entryId, status) => ipcRenderer.invoke('db-update-blog-entry-status', entryId, status),
    updateSubGoalStatus: (subGoalId, status) => ipcRenderer.invoke('db-update-subgoal-status', subGoalId, status),
    deleteTask: (taskId) => ipcRenderer.invoke('db-delete-task', taskId),
    deleteRecurringTask: (taskId) => ipcRenderer.invoke('db-delete-recurring-task', taskId),
    deleteBlogEntry: (entryId) => ipcRenderer.invoke('db-delete-blog-entry', entryId),
    getSectionData: (sectionId) => ipcRenderer.invoke('db-get-section-data', sectionId),
  }
});