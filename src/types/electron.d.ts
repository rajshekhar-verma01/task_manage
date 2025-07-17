export interface ElectronAPI {
  saveNotificationSettings: (settings: any) => Promise<{ success: boolean }>;
  loadNotificationSettings: () => Promise<any>;
  showNotification: (data: { title: string; body: string; tasks?: any[] }) => Promise<{ success: boolean }>;
  onCheckDueTasks: (callback: () => void) => void;
  updateNotificationIntervals: (allTasks: any) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}