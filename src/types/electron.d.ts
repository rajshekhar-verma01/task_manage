export interface ElectronAPI {
  saveNotificationSettings: (settings: any) => Promise<{ success: boolean }>;
  loadNotificationSettings: () => Promise<any>;
  showNotification: (data: { title: string; body: string; tasks?: any[] }) => Promise<{ success: boolean }>;
  onCheckDueTasks: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}