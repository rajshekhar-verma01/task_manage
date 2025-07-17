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
    loadFromLocalStorage();
  }, []);

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
        
        // Ensure all required arrays exist with defaults and proper structure
        const sanitizedTasks = {
          household: {
            id: 'household',
            name: 'Household Work',
            color: 'green',
            tasks: Array.isArray(parsedTasks.household?.tasks) ? parsedTasks.household.tasks : [],
            recurringTasks: Array.isArray(parsedTasks.household?.recurringTasks) ? parsedTasks.household.recurringTasks : [],
            categories: Array.isArray(parsedTasks.household?.categories) ? parsedTasks.household.categories : ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'],
          },
          personal: {
            id: 'personal',
            name: 'Personal Development',
            color: 'blue',
            tasks: Array.isArray(parsedTasks.personal?.tasks) ? parsedTasks.personal.tasks : [],
            recurringTasks: Array.isArray(parsedTasks.personal?.recurringTasks) ? parsedTasks.personal.recurringTasks : [],
            categories: Array.isArray(parsedTasks.personal?.categories) ? parsedTasks.personal.categories : ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'],
          },
          official: {
            id: 'official',
            name: 'Official Work',
            color: 'purple',
            tasks: Array.isArray(parsedTasks.official?.tasks) ? parsedTasks.official.tasks : [],
            recurringTasks: Array.isArray(parsedTasks.official?.recurringTasks) ? parsedTasks.official.recurringTasks : [],
            categories: Array.isArray(parsedTasks.official?.categories) ? parsedTasks.official.categories : ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'],
          },
          blog: {
            id: 'blog',
            name: 'Blog & Learning',
            color: 'orange',
            entries: Array.isArray(parsedTasks.blog?.entries) ? parsedTasks.blog.entries : [],
            categories: Array.isArray(parsedTasks.blog?.categories) ? parsedTasks.blog.categories : ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'],
          },
        };
        
        setTasks(sanitizedTasks);
        
        // Update recurring task statuses after loading from localStorage
        setTimeout(() => {
          updateRecurringTaskStatuses();
        }, 100);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
      }
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
      
      Object.keys(newTasks).forEach(sectionId => {
        const section = newTasks[sectionId as keyof TaskData];
        if ('recurringTasks' in section) {
          section.recurringTasks = section.recurringTasks.map(task => {
            const startDate = new Date(task.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            // If start date is today or in the past, and status is 'todo', change to 'in-progress'
            if (startDate <= today && task.status === 'todo') {
              hasUpdates = true;
              const updatedTask = {
                ...task,
                status: 'in-progress' as const,
                updatedAt: new Date().toISOString(),
              };
              
              if (dbService) {
                try {
                  dbService.saveRecurringTask(updatedTask, sectionId);
                } catch (error) {
                  console.error('Error updating recurring task status in database:', error);
                }
              }
              
              return updatedTask;
            }
            
            return task;
          });
        }
      });
      
      if (hasUpdates) {
        saveToLocalStorage(newTasks);
      }
      
      return newTasks;
    });
  };

  const updateTask = (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    updateTaskInMemory(sectionId, task);
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
    
    updateRecurringTaskInMemory(sectionId, task);
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
    updateTaskStatusInMemory(sectionId, taskId, status);
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
    updateSubGoalStatusInMemory(sectionId, taskId, subGoalId, status);
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
    updateBlogEntryInMemory(entry);
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
    updateBlogEntryStatusInMemory(entryId, status);
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
    deleteBlogEntryInMemory(entryId);
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
    addCategoryInMemory(sectionId, category);
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
    deleteTaskInMemory(sectionId, taskId);
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
    deleteRecurringTaskInMemory(sectionId, taskId);
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
    removeCategoryInMemory(sectionId, category);
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