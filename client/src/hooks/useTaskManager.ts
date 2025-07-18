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

  // Load data from database on mount
  useEffect(() => {
    // Wait for database to be ready
    const handleDatabaseReady = (event: any, { success, hasDatabase }: { success: boolean, hasDatabase: boolean }) => {
      console.log('Database ready event received:', { success, hasDatabase });
      if (success && hasDatabase) {
        console.log('Loading data from SQLite database...');
        loadFromDatabase();
      } else {
        console.log('Loading data from localStorage...');
        loadFromLocalStorage();
      }
    };

    // Listen for database ready event
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onDatabaseReady(handleDatabaseReady);
      return cleanup;
    } else {
      // Fallback for web version
      loadFromLocalStorage();
      return () => {};
    }
  }, []);

  const loadFromDatabase = async () => {
    try {
      console.log('Starting database load...');
      const sections = ['household', 'personal', 'official', 'blog'];
      const loadedData = { ...tasks };

      for (const sectionId of sections) {
        console.log(`Loading data for section: ${sectionId}`);
        try {
          if (sectionId === 'blog') {
            const entries = await window.electronAPI.db.getBlogEntries();
            const categories = await window.electronAPI.db.getCategories(sectionId);
            console.log(`Blog: ${entries?.length || 0} entries, ${categories?.length || 0} categories`);
            loadedData.blog = {
              ...loadedData.blog,
              entries: Array.isArray(entries) ? entries : [],
              categories: Array.isArray(categories) && categories.length > 0 ? categories : loadedData.blog.categories,
            };
          } else {
            const sectionTasks = await window.electronAPI.db.getTasks(sectionId);
            const recurringTasks = await window.electronAPI.db.getRecurringTasks(sectionId);
            const categories = await window.electronAPI.db.getCategories(sectionId);
            console.log(`${sectionId}: ${sectionTasks?.length || 0} tasks, ${recurringTasks?.length || 0} recurring, ${categories?.length || 0} categories`);
            
            loadedData[sectionId as keyof TaskData] = {
              ...loadedData[sectionId as keyof TaskData],
              tasks: Array.isArray(sectionTasks) ? sectionTasks : [],
              recurringTasks: Array.isArray(recurringTasks) ? recurringTasks : [],
              categories: Array.isArray(categories) && categories.length > 0 ? categories : loadedData[sectionId as keyof TaskData].categories,
            };
          }
        } catch (sectionError) {
          console.error(`Error loading section ${sectionId}:`, sectionError);
        }
      }

      setTasks(loadedData);
      console.log('Database load completed successfully');
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      // Fallback to localStorage if database fails
      loadFromLocalStorage();
    }
  };

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

  const updateTask = (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    if (window.electronAPI && window.electronAPI.db) {
      updateTaskInDatabase(sectionId, task);
    } else {
      updateTaskInMemory(sectionId, task);
    }
  };

  const updateTaskInDatabase = async (sectionId: string, task: Task | PersonalDevelopmentTask) => {
    try {
      const result = await window.electronAPI.db.saveTask(task, sectionId);
      console.log('Task saved to database:', result);
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
    if (window.electronAPI && window.electronAPI.db) {
      updateRecurringTaskInDatabase(sectionId, task);
    } else {
      updateRecurringTaskInMemory(sectionId, task);
    }
  };

  const updateRecurringTaskInDatabase = async (sectionId: string, task: RecurringTask) => {
    try {
      const result = await window.electronAPI.db.saveRecurringTask(task, sectionId);
      console.log('Recurring task saved to database:', result);
      updateRecurringTaskInMemory(sectionId, task);
    } catch (error) {
      console.error('Error saving recurring task to database:', error);
      updateRecurringTaskInMemory(sectionId, task);
    }
  };

  const updateRecurringTaskInMemory = (sectionId: string, task: RecurringTask) => {
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

  const updateBlogEntry = (entry: BlogEntry) => {
    if (window.electronAPI && window.electronAPI.db) {
      updateBlogEntryInDatabase(entry);
    } else {
      updateBlogEntryInMemory(entry);
    }
  };

  const updateBlogEntryInDatabase = async (entry: BlogEntry) => {
    try {
      const result = await window.electronAPI.db.saveBlogEntry(entry);
      console.log('Blog entry saved to database:', result);
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
          entries: prev.blog.entries.some(e => e.id === entry.id)
            ? prev.blog.entries.map(e => e.id === entry.id ? entry : e)
            : [...prev.blog.entries, entry],
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateTaskStatus = async (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.updateTaskStatus(taskId, status);
        console.log(`Task ${taskId} status updated to ${status} in database`);
      } catch (error) {
        console.error('Error updating task status in database:', error);
      }
    }

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

  const updateRecurringTaskStatus = async (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.updateRecurringTaskStatus(taskId, status);
        console.log(`Recurring task ${taskId} status updated to ${status} in database`);
      } catch (error) {
        console.error('Error updating recurring task status in database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId as keyof TaskData],
          recurringTasks: prev[sectionId as keyof TaskData].recurringTasks.map(task =>
            task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
          ),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateBlogEntryStatus = async (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.updateBlogEntryStatus(entryId, status);
        console.log(`Blog entry ${entryId} status updated to ${status} in database`);
      } catch (error) {
        console.error('Error updating blog entry status in database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = {
        ...prev,
        blog: {
          ...prev.blog,
          entries: prev.blog.entries.map(entry =>
            entry.id === entryId ? { ...entry, status, updatedAt: new Date().toISOString() } : entry
          ),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const updateSubGoalStatus = async (subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.updateSubGoalStatus(subGoalId, status);
        console.log(`Sub goal ${subGoalId} status updated to ${status} in database`);
      } catch (error) {
        console.error('Error updating sub goal status in database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = { ...prev };
      
      // Update sub goal in personal development tasks
      if (newTasks.personal && newTasks.personal.tasks) {
        newTasks.personal = {
          ...newTasks.personal,
          tasks: newTasks.personal.tasks.map(task => {
            if ('subGoals' in task && task.subGoals) {
              const updatedSubGoals = task.subGoals.map(subGoal =>
                subGoal.id === subGoalId 
                  ? { ...subGoal, status, completed: status === 'completed', updatedAt: new Date().toISOString() }
                  : subGoal
              );
              
              // Calculate progress
              const completedCount = updatedSubGoals.filter(sg => sg.completed).length;
              const progress = updatedSubGoals.length > 0 ? (completedCount / updatedSubGoals.length) * 100 : 0;
              
              return {
                ...task,
                subGoals: updatedSubGoals,
                progress: Math.round(progress),
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          }),
        };
      }
      
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const deleteTask = async (sectionId: string, taskId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.deleteTask(taskId);
        console.log(`Task ${taskId} deleted from database`);
      } catch (error) {
        console.error('Error deleting task from database:', error);
      }
    }

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

  const deleteRecurringTask = async (sectionId: string, taskId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.deleteRecurringTask(taskId);
        console.log(`Recurring task ${taskId} deleted from database`);
      } catch (error) {
        console.error('Error deleting recurring task from database:', error);
      }
    }

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

  const deleteBlogEntry = async (entryId: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.deleteBlogEntry(entryId);
        console.log(`Blog entry ${entryId} deleted from database`);
      } catch (error) {
        console.error('Error deleting blog entry from database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = {
        ...prev,
        blog: {
          ...prev.blog,
          entries: prev.blog.entries.filter(entry => entry.id !== entryId),
        },
      };
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const addCategory = async (sectionId: string, categoryName: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.addCategory(sectionId, categoryName);
        console.log(`Category ${categoryName} added to section ${sectionId} in database`);
      } catch (error) {
        console.error('Error adding category to database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = { ...prev };
      const section = newTasks[sectionId as keyof TaskData];
      if (section && 'categories' in section && !section.categories.includes(categoryName)) {
        if (sectionId === 'blog') {
          newTasks.blog = {
            ...newTasks.blog,
            categories: [...newTasks.blog.categories, categoryName],
          };
        } else {
          newTasks[sectionId as keyof TaskData] = {
            ...section,
            categories: [...section.categories, categoryName],
          };
        }
      }
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const removeCategory = async (sectionId: string, categoryName: string) => {
    if (window.electronAPI && window.electronAPI.db) {
      try {
        await window.electronAPI.db.removeCategory(sectionId, categoryName);
        console.log(`Category ${categoryName} removed from section ${sectionId} in database`);
      } catch (error) {
        console.error('Error removing category from database:', error);
      }
    }

    setTasks(prev => {
      const newTasks = { ...prev };
      const section = newTasks[sectionId as keyof TaskData];
      if (section && 'categories' in section) {
        if (sectionId === 'blog') {
          newTasks.blog = {
            ...newTasks.blog,
            categories: newTasks.blog.categories.filter(cat => cat !== categoryName),
          };
        } else {
          newTasks[sectionId as keyof TaskData] = {
            ...section,
            categories: section.categories.filter(cat => cat !== categoryName),
          };
        }
      }
      saveToLocalStorage(newTasks);
      return newTasks;
    });
  };

  const getAnalytics = (): Analytics => {
    const sections = ['household', 'personal', 'official'] as const;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;

    sections.forEach(sectionId => {
      const section = tasks[sectionId];
      if (section && 'tasks' in section) {
        totalTasks += section.tasks.length;
        section.tasks.forEach(task => {
          switch (task.status) {
            case 'completed':
              completedTasks++;
              break;
            case 'in-progress':
              inProgressTasks++;
              break;
            case 'todo':
              todoTasks++;
              break;
          }
        });
      }
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      sections: sections.map(sectionId => {
        const section = tasks[sectionId];
        if (!section || !('tasks' in section)) {
          return {
            id: sectionId,
            name: section?.name || '',
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0,
          };
        }

        const sectionTotal = section.tasks.length;
        const sectionCompleted = section.tasks.filter(task => task.status === 'completed').length;
        const sectionRate = sectionTotal > 0 ? (sectionCompleted / sectionTotal) * 100 : 0;

        return {
          id: sectionId,
          name: section.name,
          totalTasks: sectionTotal,
          completedTasks: sectionCompleted,
          completionRate: Math.round(sectionRate * 100) / 100,
        };
      }),
    };
  };

  const getBlogAnalytics = (): BlogAnalytics => {
    const entries = tasks.blog.entries;
    const totalEntries = entries.length;
    
    const statusCounts = {
      'to-read': 0,
      'reading': 0,
      'practiced': 0,
      'expert': 0,
    };

    entries.forEach(entry => {
      statusCounts[entry.status]++;
    });

    const completionRate = totalEntries > 0 ? ((statusCounts.practiced + statusCounts.expert) / totalEntries) * 100 : 0;

    return {
      totalEntries,
      toRead: statusCounts['to-read'],
      reading: statusCounts.reading,
      practiced: statusCounts.practiced,
      expert: statusCounts.expert,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  };

  return {
    tasks,
    updateTask,
    updateRecurringTask,
    updateBlogEntry,
    updateTaskStatus,
    updateRecurringTaskStatus,
    updateBlogEntryStatus,
    updateSubGoalStatus,
    deleteTask,
    deleteRecurringTask,
    deleteBlogEntry,
    addCategory,
    removeCategory,
    getAnalytics,
    getBlogAnalytics,
  };
};