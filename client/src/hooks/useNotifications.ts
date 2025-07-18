import { useEffect, useState } from 'react';
import { Task, PersonalDevelopmentTask, RecurringTask } from '../types';

interface NotificationHook {
  showDueTasksPopup: boolean;
  dueTasks: (Task | PersonalDevelopmentTask)[];
  closeDueTasksPopup: () => void;
  checkDueTasks: (allTasks: any) => void;
}

export const useNotifications = (): NotificationHook => {
  const [showDueTasksPopup, setShowDueTasksPopup] = useState(false);
  const [dueTasks, setDueTasks] = useState<(Task | PersonalDevelopmentTask)[]>([]);
  const [hasShownStartupPopup, setHasShownStartupPopup] = useState(false);

  useEffect(() => {
    // Set up IPC listener for due task checks
    if (window.electronAPI) {
      const handleCheckDueTasks = () => {
        // This will be called from the main process
        // We need to get the current tasks and check for due ones
        const event = new CustomEvent('check-due-tasks');
        window.dispatchEvent(event);
      };

      window.electronAPI.onCheckDueTasks(handleCheckDueTasks);

      return () => {
        // Cleanup listener if needed
      };
    }
  }, []);

  const checkDueTasks = (allTasks: any, isStartupCheck = false) => {
    // If this is a startup check and we've already shown the popup, don't show again
    if (isStartupCheck && hasShownStartupPopup) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const tasksToCheck: (Task | PersonalDevelopmentTask & { sectionId: string })[] = [];

    // Check all sections for due tasks
    Object.entries(allTasks).forEach(([sectionId, sectionData]: [string, any]) => {
      if (sectionData && sectionData.tasks) {
        sectionData.tasks.forEach((task: Task | PersonalDevelopmentTask) => {
          if (task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate.getTime() <= today.getTime()) {
              tasksToCheck.push({ ...task, sectionId });
            }
          }
        });

        // Also check sub-goals for personal development
        if (sectionId === 'personal' && sectionData.tasks) {
          sectionData.tasks.forEach((task: PersonalDevelopmentTask) => {
            if (task.subGoals) {
              task.subGoals.forEach(subGoal => {
                if (subGoal.status !== 'completed') {
                  const dueDate = new Date(subGoal.dueDate);
                  dueDate.setHours(0, 0, 0, 0);
                  
                  if (dueDate.getTime() <= today.getTime()) {
                    tasksToCheck.push({
                      ...subGoal,
                      title: `${task.title} - ${subGoal.title}`,
                      sectionId,
                    } as any);
                  }
                }
              });
            }
          });
        }

        // Check recurring tasks
        if (sectionData.recurringTasks) {
          sectionData.recurringTasks.forEach((task: RecurringTask) => {
            if (task.status !== 'completed') {
              const nextDate = new Date(task.nextOccurrence);
              nextDate.setHours(0, 0, 0, 0);
              
              if (nextDate.getTime() <= today.getTime()) {
                tasksToCheck.push({ ...task, sectionId } as any);
              }
            }
          });
        }
      }
    });

    if (tasksToCheck.length > 0) {
      setDueTasks(tasksToCheck);
      setShowDueTasksPopup(true);
      
      // Mark that we've shown the startup popup
      if (isStartupCheck) {
        setHasShownStartupPopup(true);
      }

      // Show desktop notification if available
      if (window.electronAPI) {
        const taskCount = tasksToCheck.length;
        const title = `${taskCount} Task${taskCount > 1 ? 's' : ''} Due Today`;
        const body = tasksToCheck.slice(0, 3).map(task => `• ${task.title}`).join('\n') + 
                     (taskCount > 3 ? `\n...and ${taskCount - 3} more` : '');
        
        window.electronAPI.showNotification({
          title,
          body,
          tasks: tasksToCheck,
        });
      }
    }
  };

  const closeDueTasksPopup = () => {
    setShowDueTasksPopup(false);
    setDueTasks([]);
  };

  // Listen for custom check-due-tasks event
  useEffect(() => {
    const handleCheckDueTasksEvent = () => {
      // This event will be dispatched when we need to check due tasks
      // The actual task data will be passed from the component that has access to it
    };

    window.addEventListener('check-due-tasks', handleCheckDueTasksEvent);

    return () => {
      window.removeEventListener('check-due-tasks', handleCheckDueTasksEvent);
    };
  }, []);

  return {
    showDueTasksPopup,
    dueTasks,
    closeDueTasksPopup,
    checkDueTasks,
  };
};