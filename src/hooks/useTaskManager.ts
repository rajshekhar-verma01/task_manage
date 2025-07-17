import { useState, useEffect } from 'react';
import { Task, PersonalDevelopmentTask, RecurringTask, TaskSection, Analytics } from '../types';
import DatabaseService from '../services/database';

interface TaskData {
  household: TaskSection;
  personal: TaskSection;
  official: TaskSection;
  blog: TaskSection;
}

// Initialize database service
let dbService: DatabaseService | null = null;

// Check if we're in Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && window.process && window.process.versions && window.process.versions.electron;
};

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<TaskData>({
    household: {
      id: 'household',
      name: 'Household Work',
      color: 'green',
      tasks: [],
      recurringTasks: [],
      categories: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'],
    },
    personal: {
      id: 'personal',
      name: 'Personal Development',
      color: 'blue',
      tasks: [],
      recurringTasks: [],
      categories: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'],
    },
    official: {
      id: 'official',
      name: 'Official Work',
      color: 'purple',
      tasks: [],
      recurringTasks: [],
      categories: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'],
    },
    blog: {
      id: 'blog',
      name: 'Blog',
      color: 'orange',
      tasks: [],
      recurringTasks: [],
      categories: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'],
    },
  });

  // Initialize database service
  useEffect(() => {
    const initDatabase = async () => {
      if (isElectron()) {
        try {
          // Dynamic import for Electron environment
          const DatabaseService = (await import('../services/database')).default;
          dbService = new DatabaseService();
          loadAllData();
        } catch (error) {
          console.error('Failed to initialize database:', error);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Web environment - use localStorage
        loadFromLocalStorage();
      }
    };

    initDatabase();

    // Cleanup on unmount
    return () => {
      if (dbService) {
        dbService.close();
      }
    };
  }, []);

  const loadFromLocalStorage = () => {
    const savedTasks = localStorage.getItem('taskManagerData');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
      }
    }
  };

  const saveToLocalStorage = (data: TaskData) => {
    localStorage.setItem('taskManagerData', JSON.stringify(data));
  };

  const loadAllData = () => {
    if (!dbService) return;

    try {
      const sections = ['household', 'personal', 'official', 'blog'];
      const newTaskData: Partial<TaskData> = {};

      sections.forEach(sectionId => {
        newTaskData[sectionId as keyof TaskData] = dbService!.getSectionData(sectionId);
      });

      setTasks(newTaskData as TaskData);
    } catch (error) {
      console.error('Error loading data from database:', error);
      loadFromLocalStorage();
    }
  };

  const updateTask = (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    if (dbService) {
      try {
        dbService.saveTask(task, sectionId);
        loadAllData(); // Reload from database
      } catch (error) {
        console.error('Error saving task to database:', error);
        // Fallback to localStorage
        updateTaskInMemory(sectionId, task);
      }
    } else {
      updateTaskInMemory(sectionId, task);
    }
  };

  const updateTaskInMemory = (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          tasks: prev[sectionId as keyof TaskData].tasks.some(t => t.id === task.id)
            ? prev[sectionId as keyof TaskData].tasks.map(t => t.id === task.id ? task : t)
            : [...prev[sectionId as keyof TaskData].tasks, task],
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateTaskStatus = (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (dbService) {
      try {
        dbService.updateTaskStatus(taskId, status);
        loadAllData(); // Reload from database
      } catch (error) {
        console.error('Error updating task status in database:', error);
        updateTaskStatusInMemory(sectionId, taskId, status);
      }
    } else {
      updateTaskStatusInMemory(sectionId, taskId, status);
    }
  };

  const updateTaskStatusInMemory = (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          tasks: prev[sectionId as keyof TaskData].tasks.map(task =>
            task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
          ),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateSubGoalStatus = (sectionId: string, taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (dbService) {
      try {
        dbService.updateSubGoalStatus(subGoalId, status);
        loadAllData(); // Reload from database
      } catch (error) {
        console.error('Error updating sub goal status in database:', error);
        updateSubGoalStatusInMemory(sectionId, taskId, subGoalId, status);
      }
    } else {
      updateSubGoalStatusInMemory(sectionId, taskId, subGoalId, status);
    }
  };

  const updateSubGoalStatusInMemory = (sectionId: string, taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          tasks: prev[sectionId as keyof TaskData].tasks.map(task => {
            if (task.id === taskId && 'subGoals' in task && task.subGoals) {
              const updatedSubGoals = task.subGoals.map(subGoal =>
                subGoal.id === subGoalId 
                  ? { ...subGoal, status, completed: status === 'completed', updatedAt: new Date().toISOString() }
                  : subGoal
              );
              const progress = Math.round((updatedSubGoals.filter(sg => sg.status === 'completed').length / updatedSubGoals.length) * 100);
              return {
                ...task,
                subGoals: updatedSubGoals,
                progress,
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          }),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const addCategory = (sectionId: string, category: string) => {
    if (dbService) {
      try {
        dbService.addCategory(sectionId, category);
        loadAllData(); // Reload from database
      } catch (error) {
        console.error('Error adding category to database:', error);
        addCategoryInMemory(sectionId, category);
      }
    } else {
      addCategoryInMemory(sectionId, category);
    }
  };

  const addCategoryInMemory = (sectionId: string, category: string) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          categories: [...prev[sectionId as keyof TaskData].categories, category],
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const removeCategory = (sectionId: string, category: string) => {
    if (dbService) {
      try {
        dbService.removeCategory(sectionId, category);
        loadAllData(); // Reload from database
      } catch (error) {
        console.error('Error removing category from database:', error);
        removeCategoryInMemory(sectionId, category);
      }
    } else {
      removeCategoryInMemory(sectionId, category);
    }
  };

  const removeCategoryInMemory = (sectionId: string, category: string) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          categories: prev[sectionId as keyof TaskData].categories.filter(c => c !== category),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const getAnalytics = (): {
    household: Analytics;
    personal: Analytics;
    official: Analytics;
    blog: Analytics;
  } => {
    const generateAnalytics = (section: TaskSection): Analytics => {
      const allTasks = [...section.tasks, ...section.recurringTasks];
      
      // Include sub goals in analytics for personal development
      let allItems = [...allTasks];
      if (section.id === 'personal') {
        section.tasks.forEach(task => {
          const personalTask = task as PersonalDevelopmentTask;
          if (personalTask.subGoals) {
            allItems.push(...personalTask.subGoals);
          }
        });
      }
      
      const totalTasks = allItems.length;
      const completedTasks = allItems.filter(t => t.status === 'completed').length;
      const inProgressTasks = allItems.filter(t => t.status === 'in-progress').length;
      const todoTasks = allItems.filter(t => t.status === 'todo').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const categoryBreakdown = allItems.reduce((acc: { [key: string]: number }, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      // Generate monthly progress (simplified for demo)
      const monthlyProgress = [
        { month: 'Jan', completed: Math.floor(completedTasks * 0.8), total: Math.floor(totalTasks * 0.8) },
        { month: 'Feb', completed: Math.floor(completedTasks * 0.9), total: Math.floor(totalTasks * 0.9) },
        { month: 'Mar', completed: completedTasks, total: totalTasks },
      ];

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        categoryBreakdown,
        monthlyProgress,
      };
    };

    return {
      household: generateAnalytics(tasks.household),
      personal: generateAnalytics(tasks.personal),
      official: generateAnalytics(tasks.official),
      blog: generateAnalytics(tasks.blog),
    };
  };

  return {
    tasks,
    updateTask,
    updateTaskStatus,
    updateSubGoalStatus,
    addCategory,
    removeCategory,
    getAnalytics,
  };
};