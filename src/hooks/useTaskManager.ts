import { useState, useEffect } from 'react';
import { Task, PersonalDevelopmentTask, RecurringTask, TaskSection, Analytics, BlogEntry, BlogSection, BlogAnalytics } from '../types';

interface TaskData {
  household: TaskSection;
  personal: TaskSection;
  official: TaskSection;
  blog: BlogSection;
}

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
      name: 'Blog & Learning',
      color: 'orange',
      entries: [] as BlogEntry[],
      categories: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'],
    },
  });

  // Load data from localStorage on mount
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.db) {
      loadFromDatabase();
    } else {
      loadFromLocalStorage();
    }
  }, []);

  // Helper function to ensure safe data structure
  const ensureSafeTaskData = (data: any): TaskData => {
    const defaultTaskData: TaskData = {
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
        name: 'Blog & Learning',
        color: 'orange',
        entries: [],
        categories: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'],
      },
    };

    if (!data || typeof data !== 'object') {
      return defaultTaskData;
    }

    const safeData = { ...defaultTaskData };

    // Safely merge each section
    ['household', 'personal', 'official'].forEach(sectionId => {
      if (data[sectionId] && typeof data[sectionId] === 'object') {
        safeData[sectionId as keyof TaskData] = {
          ...defaultTaskData[sectionId as keyof TaskData],
          tasks: Array.isArray(data[sectionId].tasks) ? data[sectionId].tasks : [],
          recurringTasks: Array.isArray(data[sectionId].recurringTasks) ? data[sectionId].recurringTasks : [],
          categories: Array.isArray(data[sectionId].categories) ? data[sectionId].categories : defaultTaskData[sectionId as keyof TaskData].categories,
        };
      }
    });

    // Handle blog section separately
    if (data.blog && typeof data.blog === 'object') {
      safeData.blog = {
        ...defaultTaskData.blog,
        entries: Array.isArray(data.blog.entries) ? data.blog.entries : [],
        categories: Array.isArray(data.blog.categories) ? data.blog.categories : defaultTaskData.blog.categories,
      };
    }

    return safeData;
  };
  const loadFromDatabase = async () => {
    try {
      const sections = ['household', 'personal', 'official', 'blog'];
      const loadedData = ensureSafeTaskData({});

      for (const sectionId of sections) {
        if (sectionId === 'blog') {
          const entries = await window.electronAPI.db.getBlogEntries();
          const categories = await window.electronAPI.db.getCategories(sectionId);
          loadedData.blog = {
            ...loadedData.blog,
            entries: Array.isArray(entries) ? entries : [],
            categories: Array.isArray(categories) ? categories : loadedData.blog.categories,
          };
        } else {
          const sectionTasks = await window.electronAPI.db.getTasks(sectionId);
          const recurringTasks = await window.electronAPI.db.getRecurringTasks(sectionId);
          const categories = await window.electronAPI.db.getCategories(sectionId);
          
          loadedData[sectionId as keyof TaskData] = {
            ...loadedData[sectionId as keyof TaskData],
            tasks: Array.isArray(sectionTasks) ? sectionTasks : [],
            recurringTasks: Array.isArray(recurringTasks) ? recurringTasks : [],
            categories: Array.isArray(categories) ? categories : loadedData[sectionId as keyof TaskData].categories,
          };
        }
      }

      setTasks(loadedData);
      
      // Update recurring task statuses after loading from database
      setTimeout(() => {
        updateRecurringTaskStatuses();
      }, 100);
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      // Fallback to localStorage if database fails
      loadFromLocalStorage();
    }
  };
  // Update notification intervals when tasks change
  useEffect(() => {
    if (window.electronAPI && Object.keys(tasks).length > 0) {
      window.electronAPI.updateNotificationIntervals(tasks);
    }
  }, [tasks]);

  const loadFromLocalStorage = () => {
    const savedTasks = localStorage.getItem('taskManagerData');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        const sanitizedTasks = ensureSafeTaskData(parsedTasks);
        
        setTasks(sanitizedTasks);
        
        // Update recurring task statuses after loading from localStorage
        setTimeout(() => {
          updateRecurringTaskStatuses();
        }, 100);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        // Set default safe data if parsing fails
        setTasks(ensureSafeTaskData({}));
      }
    } else {
      // Set default safe data if no saved data exists
      setTasks(ensureSafeTaskData({}));
    }
  };

  const saveToLocalStorage = (data: TaskData) => {
    localStorage.setItem('taskManagerData', JSON.stringify(data));
  };

  // Function to update recurring task statuses based on start date
  const updateRecurringTaskStatuses = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasUpdates = false;
    
    setTasks(prev => {
      const newTasks = { ...prev };
      
      ['household', 'personal', 'official'].forEach(sectionId => {
        const safeTasks = Array.isArray(tasks[sectionId as keyof TaskData]?.tasks) ? tasks[sectionId as keyof TaskData].tasks : [];
        const section = newTasks[sectionId as keyof TaskData];
        
        if (section && 'recurringTasks' in section && Array.isArray(section.recurringTasks)) {
          section.recurringTasks = section.recurringTasks.map(task => {
            const startDate = new Date(task.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            const safeRecurringTasks = Array.isArray(tasks[sectionId as keyof TaskData]?.recurringTasks) ? tasks[sectionId as keyof TaskData].recurringTasks : [];
            if (startDate <= today && task.status === 'todo') {
              hasUpdates = true;
              const updatedTask = {
                ...task,
                status: 'in-progress' as const,
                updatedAt: new Date().toISOString(),
              };
              if (tasks.personal && Array.isArray(tasks.personal.tasks)) {
                tasks.personal.tasks.forEach(task => {
                  try {
                    window.electronAPI.db.saveRecurringTask(updatedTask, sectionId);
                  } catch (error) {
                    console.error('Error updating recurring task status in database:', error);
                  }
                });
              }
              
              return updatedTask;
            }
            
            return task;
          };
        }
      });
      
      if (hasUpdates) {
        saveToLocalStorage(newTasks);
      }
      
      return newTasks;
    });
  };

  const updateTask = (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    if (window.electronAPI && window.electronAPI.db) {
      updateTaskInDatabase(sectionId, task);
    } else {
      updateTaskInMemory(sectionId, task);
    }
  };

  const updateTaskInDatabase = async (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    try {
      await window.electronAPI.db.saveTask(task, sectionId);
      updateTaskInMemory(sectionId, task);
    } catch (error) {
      console.error('Error saving task to database:', error);
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

  const updateRecurringTask = (sectionId: string, task: RecurringTask) => {
    // Auto-set status based on start date for new recurring tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskStartDate = new Date(task.startDate);
    taskStartDate.setHours(0, 0, 0, 0);
    
    // Only auto-set status if it's a new task (no existing ID in database/memory)
    const existingTask = tasks[sectionId as keyof TaskData]?.recurringTasks.find(t => t.id === task.id);
    if (!existingTask) {
      task.status = taskStartDate <= today ? 'in-progress' : 'todo';
    }
    
    if (window.electronAPI && window.electronAPI.db) {
      updateRecurringTaskInDatabase(sectionId, task);
    } else {
      updateRecurringTaskInMemory(sectionId, task);
    }
  };

  const updateRecurringTaskInDatabase = async (sectionId: string, task: RecurringTask) => {
    try {
      await window.electronAPI.db.saveRecurringTask(task, sectionId);
      updateRecurringTaskInMemory(sectionId, task);
    } catch (error) {
      console.error('Error saving recurring task to database:', error);
      updateRecurringTaskInMemory(sectionId, task);
    }
  };

  const updateRecurringTaskInMemory = (sectionId: string, task: RecurringTask) => {
    // Auto-set status based on start date for new recurring tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskStartDate = new Date(task.startDate);
    taskStartDate.setHours(0, 0, 0, 0);
    
    // Only auto-set status if it's a new task
    const existingTask = tasks[sectionId as keyof TaskData]?.recurringTasks.find(t => t.id === task.id);
    if (!existingTask) {
      task.status = taskStartDate <= today ? 'in-progress' : 'todo';
    }
    
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          recurringTasks: prev[sectionId as keyof TaskData].recurringTasks.some(t => t.id === task.id)
            ? prev[sectionId as keyof TaskData].recurringTasks.map(t => t.id === task.id ? task : t)
            : [...prev[sectionId as keyof TaskData].recurringTasks, task],
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateTaskStatus = (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (window.electronAPI && window.electronAPI.db) {
      updateTaskStatusInDatabase(sectionId, taskId, status);
    } else {
      updateTaskStatusInMemory(sectionId, taskId, status);
    }
  };

  const updateTaskStatusInDatabase = async (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    try {
      await window.electronAPI.db.updateTaskStatus(taskId, status);
      updateTaskStatusInMemory(sectionId, taskId, status);
    } catch (error) {
      console.error('Error updating task status in database:', error);
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
    if (window.electronAPI && window.electronAPI.db) {
      updateSubGoalStatusInDatabase(sectionId, taskId, subGoalId, status);
    } else {
      updateSubGoalStatusInMemory(sectionId, taskId, subGoalId, status);
    }
  };

  const updateSubGoalStatusInDatabase = async (sectionId: string, taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => {
    try {
      await window.electronAPI.db.updateSubGoalStatus(subGoalId, status);
      updateSubGoalStatusInMemory(sectionId, taskId, subGoalId, status);
    } catch (error) {
      console.error('Error updating subgoal status in database:', error);
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

  // Blog entry management functions
  const updateBlogEntry = (entry: BlogEntry) => {
    if (window.electronAPI && window.electronAPI.db) {
      updateBlogEntryInDatabase(entry);
    } else {
      updateBlogEntryInMemory(entry);
    }
  };

  const updateBlogEntryInDatabase = async (entry: BlogEntry) => {
    try {
      await window.electronAPI.db.saveBlogEntry(entry);
      updateBlogEntryInMemory(entry);
    } catch (error) {
      console.error('Error saving blog entry to database:', error);
      updateBlogEntryInMemory(entry);
    }
  };

  const updateBlogEntryInMemory = (entry: BlogEntry) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        blog: {
          ...prev.blog,
          entries: prev.blog.entries?.some(e => e.id === entry.id)
            ? prev.blog.entries.map(e => e.id === entry.id ? entry : e)
            : [...(prev.blog.entries || []), entry],
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateBlogEntryStatus = (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => {
    if (window.electronAPI && window.electronAPI.db) {
      updateBlogEntryStatusInDatabase(entryId, status);
    } else {
      updateBlogEntryStatusInMemory(entryId, status);
    }
  };

  const updateBlogEntryStatusInDatabase = async (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => {
    try {
      await window.electronAPI.db.updateBlogEntryStatus(entryId, status);
      updateBlogEntryStatusInMemory(entryId, status);
    } catch (error) {
      console.error('Error updating blog entry status in database:', error);
      updateBlogEntryStatusInMemory(entryId, status);
    }
  };

  const updateBlogEntryStatusInMemory = (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        blog: {
          ...prev.blog,
          entries: (prev.blog.entries || []).map(entry =>
            entry.id === entryId ? { ...entry, status, updatedAt: new Date().toISOString() } : entry
          ),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const deleteBlogEntry = (entryId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      deleteBlogEntryInDatabase(entryId);
    } else {
      deleteBlogEntryInMemory(entryId);
    }
  };

  const deleteBlogEntryInDatabase = async (entryId: string) => {
    try {
      await window.electronAPI.db.deleteBlogEntry(entryId);
      deleteBlogEntryInMemory(entryId);
    } catch (error) {
      console.error('Error deleting blog entry from database:', error);
      deleteBlogEntryInMemory(entryId);
    }
  };

  const deleteBlogEntryInMemory = (entryId: string) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        blog: {
          ...prev.blog,
          entries: (prev.blog.entries || []).filter(entry => entry.id !== entryId),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const addCategory = (sectionId: string, category: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      addCategoryInDatabase(sectionId, category);
    } else {
      addCategoryInMemory(sectionId, category);
    }
  };

  const addCategoryInDatabase = async (sectionId: string, category: string) => {
    try {
      await window.electronAPI.db.addCategory(sectionId, category);
      addCategoryInMemory(sectionId, category);
    } catch (error) {
      console.error('Error adding category to database:', error);
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

  const deleteTask = (sectionId: string, taskId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      deleteTaskInDatabase(sectionId, taskId);
    } else {
      deleteTaskInMemory(sectionId, taskId);
    }
  };

  const deleteTaskInDatabase = async (sectionId: string, taskId: string) => {
    try {
      await window.electronAPI.db.deleteTask(taskId);
      deleteTaskInMemory(sectionId, taskId);
    } catch (error) {
      console.error('Error deleting task from database:', error);
      deleteTaskInMemory(sectionId, taskId);
    }
  };

  const deleteTaskInMemory = (sectionId: string, taskId: string) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          tasks: prev[sectionId as keyof TaskData].tasks.filter(task => task.id !== taskId),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const deleteRecurringTask = (sectionId: string, taskId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      deleteRecurringTaskInDatabase(sectionId, taskId);
    } else {
      deleteRecurringTaskInMemory(sectionId, taskId);
    }
  };

  const deleteRecurringTaskInDatabase = async (sectionId: string, taskId: string) => {
    try {
      await window.electronAPI.db.deleteRecurringTask(taskId);
      deleteRecurringTaskInMemory(sectionId, taskId);
    } catch (error) {
      console.error('Error deleting recurring task from database:', error);
      deleteRecurringTaskInMemory(sectionId, taskId);
    }
  };

  const deleteRecurringTaskInMemory = (sectionId: string, taskId: string) => {
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          recurringTasks: prev[sectionId as keyof TaskData].recurringTasks.filter(task => task.id !== taskId),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };
  const removeCategory = (sectionId: string, category: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      removeCategoryInDatabase(sectionId, category);
    } else {
      removeCategoryInMemory(sectionId, category);
    }
  };

  const removeCategoryInDatabase = async (sectionId: string, category: string) => {
    try {
      await window.electronAPI.db.removeCategory(sectionId, category);
      removeCategoryInMemory(sectionId, category);
    } catch (error) {
      console.error('Error removing category from database:', error);
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
    blog: BlogAnalytics;
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

    const generateBlogAnalytics = (blogSection: BlogSection): BlogAnalytics => {
      const entries = blogSection.entries || [];
      
      const totalEntries = entries.length;
      const toReadEntries = entries.filter(e => e.status === 'to-read').length;
      const readingEntries = entries.filter(e => e.status === 'reading').length;
      const practicedEntries = entries.filter(e => e.status === 'practiced').length;
      const expertEntries = entries.filter(e => e.status === 'expert').length;
      const completionRate = totalEntries > 0 ? Math.round((expertEntries / totalEntries) * 100) : 0;

      const categoryBreakdown = entries.reduce((acc: { [key: string]: number }, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
        return acc;
      }, {});

      const statusBreakdown = {
        'to-read': toReadEntries,
        'reading': readingEntries,
        'practiced': practicedEntries,
        'expert': expertEntries,
      };

      // Generate monthly progress (simplified for demo)
      const monthlyProgress = [
        { month: 'Jan', completed: Math.floor(expertEntries * 0.8), total: Math.floor(totalEntries * 0.8) },
        { month: 'Feb', completed: Math.floor(expertEntries * 0.9), total: Math.floor(totalEntries * 0.9) },
        { month: 'Mar', completed: expertEntries, total: totalEntries },
      ];

      return {
        totalEntries,
        toReadEntries,
        readingEntries,
        practicedEntries,
        expertEntries,
        completionRate,
        categoryBreakdown,
        statusBreakdown,
        monthlyProgress,
      };
    };

    return {
      household: generateAnalytics(tasks.household),
      personal: generateAnalytics(tasks.personal),
      official: generateAnalytics(tasks.official),
      blog: generateBlogAnalytics(tasks.blog || { entries: [], categories: [] }),
    };
  };

  return {
    tasks,
    updateTask,
    updateRecurringTask,
    updateTaskStatus,
    updateSubGoalStatus,
    deleteTask,
    deleteRecurringTask,
    updateBlogEntry,
    updateBlogEntryStatus,
    deleteBlogEntry,
    addCategory,
    removeCategory,
    getAnalytics,
  };
};