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
});