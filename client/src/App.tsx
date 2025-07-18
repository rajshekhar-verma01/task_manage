import React, { useState } from 'react';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import TaskSection from './components/TaskSection';
import BlogSection from './components/BlogSection';
import Analytics from './components/Analytics';
import NotificationSettings from './components/NotificationSettings';
import DueTasksPopup from './components/DueTasksPopup';
import { useTaskManager } from './hooks/useTaskManager';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const [activeSection, setActiveSection] = useState('household');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { 
    tasks, 
    updateTask, 
    updateRecurringTask,
    updateTaskStatus, 
    updateSubGoalStatus,
    updateBlogEntry,
    updateBlogEntryStatus,
    deleteBlogEntry,
    addCategory,
    removeCategory,
    getAnalytics 
  } = useTaskManager();
  
  const { showDueTasksPopup, dueTasks, closeDueTasksPopup, checkDueTasks } = useNotifications();

  // Check for due tasks on app start and when tasks change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(tasks).length > 0) {
        checkDueTasks(tasks, true); // Pass true to indicate this is a startup check
      }
    }, 1000); // Small delay to ensure tasks are loaded

    return () => clearTimeout(timer);
  }, [tasks, checkDueTasks]); // Add back dependencies but with proper check

  // Listen for due task checks from main process
  useEffect(() => {
    const handleCheckDueTasks = () => {
      checkDueTasks(tasks, false); // Pass false for regular notification checks
    };

    window.addEventListener('check-due-tasks', handleCheckDueTasks);

    return () => {
      window.removeEventListener('check-due-tasks', handleCheckDueTasks);
    };
  }, [tasks, checkDueTasks]);

  const renderContent = () => {
    if (activeSection === 'analytics') {
      return <Analytics analytics={getAnalytics()} />;
    }

    if (activeSection === 'blog') {
      const blogData = tasks.blog;
      return (
        <BlogSection
          entries={Array.isArray(blogData?.entries) ? blogData.entries : []}
          categories={Array.isArray(blogData?.categories) ? blogData.categories : []}
          onEntryUpdate={updateBlogEntry}
          onEntryStatusChange={updateBlogEntryStatus}
          onDeleteEntry={deleteBlogEntry}
          onAddCategory={(category) => addCategory('blog', category)}
          onRemoveCategory={(category) => removeCategory('blog', category)}
        />
      );
    }

    const sectionData = tasks[activeSection as keyof typeof tasks];
    if (!sectionData || activeSection === 'blog') return null;

    return (
      <TaskSection
        sectionName={sectionData.name}
        sectionType={activeSection}
        tasks={Array.isArray(sectionData.tasks) ? sectionData.tasks : []}
        recurringTasks={Array.isArray(sectionData.recurringTasks) ? sectionData.recurringTasks : []}
        categories={Array.isArray(sectionData.categories) ? sectionData.categories : []}
        onTaskUpdate={(task) => updateTask(activeSection, task)}
        onRecurringTaskUpdate={(task) => updateRecurringTask(activeSection, task)}
        onTaskStatusChange={(taskId, status) => updateTaskStatus(activeSection, taskId, status)}
        onSubGoalStatusChange={(taskId, subGoalId, status) => updateSubGoalStatus(activeSection, taskId, subGoalId, status)}
        onDeleteTask={(taskId) => deleteTask(activeSection, taskId)}
        onDeleteRecurringTask={(taskId) => deleteRecurringTask(activeSection, taskId)}
        onAddCategory={(category) => addCategory(activeSection, category)}
        onRemoveCategory={(category) => removeCategory(activeSection, category)}
      />
    );
  };

  const handleTaskStatusChangeFromPopup = (sectionId: string, taskId: string, status: 'in-progress' | 'completed') => {
    updateTaskStatus(sectionId, taskId, status);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNotificationSettings={() => setShowNotificationSettings(true)}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
      
      <DueTasksPopup
        isOpen={showDueTasksPopup}
        onClose={closeDueTasksPopup}
        dueTasks={dueTasks}
        onTaskStatusChange={handleTaskStatusChangeFromPopup}
      />
    </div>
  );
}

export default App;