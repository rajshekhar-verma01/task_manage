export interface ElectronAPI {
  saveNotificationSettings: (settings: any) => Promise<{ success: boolean }>;
  loadNotificationSettings: () => Promise<any>;
  showNotification: (data: { title: string; body: string; tasks?: any[] }) => Promise<{ success: boolean }>;
  onCheckDueTasks: (callback: () => void) => void;
  updateNotificationIntervals: (allTasks: any) => Promise<{ success: boolean }>;
  onDatabaseReady: (callback: (event: any, data: { success: boolean, hasDatabase: boolean }) => void) => () => void;
  db: {
    saveTask: (task: any, sectionId: string) => Promise<{ success: boolean }>;
    getTasks: (sectionId: string) => Promise<any[]>;
    saveRecurringTask: (task: any, sectionId: string) => Promise<{ success: boolean }>;
    getRecurringTasks: (sectionId: string) => Promise<any[]>;
    saveBlogEntry: (entry: any) => Promise<{ success: boolean }>;
    getBlogEntries: () => Promise<any[]>;
    getCategories: (sectionId: string) => Promise<string[]>;
    addCategory: (sectionId: string, categoryName: string) => Promise<{ success: boolean }>;
    removeCategory: (sectionId: string, categoryName: string) => Promise<{ success: boolean }>;
    updateTaskStatus: (taskId: string, status: string) => Promise<{ success: boolean }>;
    updateRecurringTaskStatus: (taskId: string, status: string) => Promise<{ success: boolean }>;
    updateBlogEntryStatus: (entryId: string, status: string) => Promise<{ success: boolean }>;
    updateSubGoalStatus: (subGoalId: string, status: string) => Promise<{ success: boolean }>;
    deleteTask: (taskId: string) => Promise<{ success: boolean }>;
    deleteRecurringTask: (taskId: string) => Promise<{ success: boolean }>;
    deleteBlogEntry: (entryId: string) => Promise<{ success: boolean }>;
    getSectionData: (sectionId: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}