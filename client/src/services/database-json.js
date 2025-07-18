// JSON-based database service that doesn't require native modules
const fs = require('fs');
const path = require('path');
const os = require('os');

class JSONDatabaseService {
  constructor() {
    try {
      // Use user home directory for cross-platform compatibility
      const homeDir = os.homedir();
      const appDataDir = path.join(homeDir, '.task-management-app');
      
      // Ensure the directory exists
      if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true });
      }
      
      this.dbPath = path.join(appDataDir, 'taskflow-data.json');
      console.log('JSON Database path:', this.dbPath);
      
      this.initializeDatabase();
      console.log('JSON Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize JSON database:', error);
      throw error;
    }
  }

  initializeDatabase() {
    // Initialize with empty structure if file doesn't exist
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        tasks: {},
        recurringTasks: {},
        blogEntries: [],
        categories: {
          household: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'],
          personal: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'],
          official: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'],
          blog: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing']
        },
        subGoals: {},
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      this.saveData(initialData);
    }
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      return this.getEmptyStructure();
    }
  }

  saveData(data) {
    try {
      data.metadata.lastModified = new Date().toISOString();
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error saving database:', error);
      return { success: false, error: error.message };
    }
  }

  getEmptyStructure() {
    return {
      tasks: {},
      recurringTasks: {},
      blogEntries: [],
      categories: {
        household: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'],
        personal: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'],
        official: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'],
        blog: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing']
      },
      subGoals: {},
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Task operations
  saveTask(task, sectionId) {
    try {
      const data = this.loadData();
      
      if (!data.tasks[sectionId]) {
        data.tasks[sectionId] = [];
      }

      const taskId = task.id || this.generateId();
      const now = new Date().toISOString();
      
      const taskData = {
        ...task,
        id: taskId,
        sectionId,
        updatedAt: now,
        createdAt: task.createdAt || now
      };

      // Update existing task or add new one
      const existingIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
      if (existingIndex >= 0) {
        data.tasks[sectionId][existingIndex] = taskData;
      } else {
        data.tasks[sectionId].push(taskData);
      }

      const result = this.saveData(data);
      if (result.success) {
        console.log(`Task saved: ${task.title} in section ${sectionId}`);
        return { success: true, id: taskId };
      }
      return result;
    } catch (error) {
      console.error('Error saving task:', error);
      return { success: false, error: error.message };
    }
  }

  getTasks(sectionId) {
    try {
      const data = this.loadData();
      const tasks = data.tasks[sectionId] || [];
      console.log(`Loaded ${tasks.length} tasks for section ${sectionId}`);
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  updateTaskStatus(taskId, status) {
    try {
      const data = this.loadData();
      let updated = false;

      // Search through all sections
      for (const sectionId in data.tasks) {
        const taskIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.tasks[sectionId][taskIndex].status = status;
          data.tasks[sectionId][taskIndex].updatedAt = new Date().toISOString();
          if (status === 'completed') {
            data.tasks[sectionId][taskIndex].completedAt = new Date().toISOString();
          }
          updated = true;
          break;
        }
      }

      if (updated) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Task ${taskId} status updated to ${status}`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Task not found' };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    }
  }

  deleteTask(taskId) {
    try {
      const data = this.loadData();
      let deleted = false;

      // Search through all sections
      for (const sectionId in data.tasks) {
        const taskIndex = data.tasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.tasks[sectionId].splice(taskIndex, 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Task ${taskId} deleted`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Task not found' };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  // Recurring task operations
  saveRecurringTask(task, sectionId) {
    try {
      const data = this.loadData();
      
      if (!data.recurringTasks[sectionId]) {
        data.recurringTasks[sectionId] = [];
      }

      const taskId = task.id || this.generateId();
      const now = new Date().toISOString();
      
      const taskData = {
        ...task,
        id: taskId,
        sectionId,
        updatedAt: now,
        createdAt: task.createdAt || now
      };

      const existingIndex = data.recurringTasks[sectionId].findIndex(t => t.id === taskId);
      if (existingIndex >= 0) {
        data.recurringTasks[sectionId][existingIndex] = taskData;
      } else {
        data.recurringTasks[sectionId].push(taskData);
      }

      const result = this.saveData(data);
      if (result.success) {
        console.log(`Recurring task saved: ${task.title} in section ${sectionId}`);
        return { success: true, id: taskId };
      }
      return result;
    } catch (error) {
      console.error('Error saving recurring task:', error);
      return { success: false, error: error.message };
    }
  }

  getRecurringTasks(sectionId) {
    try {
      const data = this.loadData();
      const tasks = data.recurringTasks[sectionId] || [];
      console.log(`Loaded ${tasks.length} recurring tasks for section ${sectionId}`);
      return tasks;
    } catch (error) {
      console.error('Error getting recurring tasks:', error);
      return [];
    }
  }

  // Blog entry operations
  saveBlogEntry(entry) {
    try {
      const data = this.loadData();
      
      const entryId = entry.id || this.generateId();
      const now = new Date().toISOString();
      
      const entryData = {
        ...entry,
        id: entryId,
        updatedAt: now,
        createdAt: entry.createdAt || now
      };

      const existingIndex = data.blogEntries.findIndex(e => e.id === entryId);
      if (existingIndex >= 0) {
        data.blogEntries[existingIndex] = entryData;
      } else {
        data.blogEntries.push(entryData);
      }

      const result = this.saveData(data);
      if (result.success) {
        console.log(`Blog entry saved: ${entry.title}`);
        return { success: true, id: entryId };
      }
      return result;
    } catch (error) {
      console.error('Error saving blog entry:', error);
      return { success: false, error: error.message };
    }
  }

  getBlogEntries() {
    try {
      const data = this.loadData();
      console.log(`Loaded ${data.blogEntries.length} blog entries`);
      return data.blogEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting blog entries:', error);
      return [];
    }
  }

  // Category operations
  getCategories(sectionId) {
    try {
      const data = this.loadData();
      const categories = data.categories[sectionId] || [];
      console.log(`Loaded ${categories.length} categories for section ${sectionId}`);
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  addCategory(sectionId, categoryName) {
    try {
      const data = this.loadData();
      
      if (!data.categories[sectionId]) {
        data.categories[sectionId] = [];
      }

      if (!data.categories[sectionId].includes(categoryName)) {
        data.categories[sectionId].push(categoryName);
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Added category: ${categoryName} to section ${sectionId}`);
          return { success: true };
        }
        return result;
      }

      return { success: true }; // Already exists
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error: error.message };
    }
  }

  removeCategory(sectionId, categoryName) {
    try {
      const data = this.loadData();
      
      if (data.categories[sectionId]) {
        const index = data.categories[sectionId].indexOf(categoryName);
        if (index >= 0) {
          data.categories[sectionId].splice(index, 1);
          const result = this.saveData(data);
          if (result.success) {
            console.log(`Removed category: ${categoryName} from section ${sectionId}`);
            return { success: true };
          }
          return result;
        }
      }

      return { success: true }; // Already doesn't exist
    } catch (error) {
      console.error('Error removing category:', error);
      return { success: false, error: error.message };
    }
  }

  // Sub-goals operations
  saveSubGoals(taskId, subGoals) {
    try {
      const data = this.loadData();
      data.subGoals[taskId] = subGoals;
      
      const result = this.saveData(data);
      if (result.success) {
        console.log(`Sub-goals saved for task ${taskId}`);
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error saving sub goals:', error);
      return { success: false, error: error.message };
    }
  }

  getSubGoals(taskId) {
    try {
      const data = this.loadData();
      const subGoals = data.subGoals[taskId] || [];
      console.log(`Loaded ${subGoals.length} sub-goals for task ${taskId}`);
      return subGoals;
    } catch (error) {
      console.error('Error getting sub goals:', error);
      return [];
    }
  }

  // Status update operations for other entities
  updateRecurringTaskStatus(taskId, status) {
    try {
      const data = this.loadData();
      let updated = false;

      for (const sectionId in data.recurringTasks) {
        const taskIndex = data.recurringTasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.recurringTasks[sectionId][taskIndex].status = status;
          data.recurringTasks[sectionId][taskIndex].updatedAt = new Date().toISOString();
          updated = true;
          break;
        }
      }

      if (updated) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Recurring task ${taskId} status updated to ${status}`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Recurring task not found' };
    } catch (error) {
      console.error('Error updating recurring task status:', error);
      return { success: false, error: error.message };
    }
  }

  updateBlogEntryStatus(entryId, status) {
    try {
      const data = this.loadData();
      const entryIndex = data.blogEntries.findIndex(e => e.id === entryId);
      
      if (entryIndex >= 0) {
        data.blogEntries[entryIndex].status = status;
        data.blogEntries[entryIndex].updatedAt = new Date().toISOString();
        
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Blog entry ${entryId} status updated to ${status}`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Blog entry not found' };
    } catch (error) {
      console.error('Error updating blog entry status:', error);
      return { success: false, error: error.message };
    }
  }

  updateSubGoalStatus(subGoalId, status) {
    try {
      const data = this.loadData();
      let updated = false;
      let parentTaskId = null;

      // Find and update the sub-goal
      for (const taskId in data.subGoals) {
        const subGoalIndex = data.subGoals[taskId].findIndex(sg => sg.id === subGoalId);
        if (subGoalIndex >= 0) {
          data.subGoals[taskId][subGoalIndex].status = status;
          data.subGoals[taskId][subGoalIndex].completed = status === 'completed';
          data.subGoals[taskId][subGoalIndex].updatedAt = new Date().toISOString();
          parentTaskId = taskId;
          updated = true;
          break;
        }
      }

      if (updated) {
        // Update parent task progress
        if (parentTaskId && data.subGoals[parentTaskId]) {
          const subGoals = data.subGoals[parentTaskId];
          const completedCount = subGoals.filter(sg => sg.completed).length;
          const progress = subGoals.length > 0 ? Math.round((completedCount / subGoals.length) * 100) : 0;
          
          // Find and update the parent task
          for (const sectionId in data.tasks) {
            const taskIndex = data.tasks[sectionId].findIndex(t => t.id === parentTaskId);
            if (taskIndex >= 0) {
              data.tasks[sectionId][taskIndex].progress = progress;
              data.tasks[sectionId][taskIndex].updatedAt = new Date().toISOString();
              break;
            }
          }
        }

        const result = this.saveData(data);
        if (result.success) {
          console.log(`Sub-goal ${subGoalId} status updated to ${status}`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Sub-goal not found' };
    } catch (error) {
      console.error('Error updating sub-goal status:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete operations
  deleteRecurringTask(taskId) {
    try {
      const data = this.loadData();
      let deleted = false;

      for (const sectionId in data.recurringTasks) {
        const taskIndex = data.recurringTasks[sectionId].findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          data.recurringTasks[sectionId].splice(taskIndex, 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Recurring task ${taskId} deleted`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Recurring task not found' };
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      return { success: false, error: error.message };
    }
  }

  deleteBlogEntry(entryId) {
    try {
      const data = this.loadData();
      const entryIndex = data.blogEntries.findIndex(e => e.id === entryId);
      
      if (entryIndex >= 0) {
        data.blogEntries.splice(entryIndex, 1);
        
        const result = this.saveData(data);
        if (result.success) {
          console.log(`Blog entry ${entryId} deleted`);
          return { success: true };
        }
        return result;
      }

      return { success: false, error: 'Blog entry not found' };
    } catch (error) {
      console.error('Error deleting blog entry:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all data for a section
  getSectionData(sectionId) {
    const sectionNames = {
      household: 'Household Work',
      personal: 'Personal Development',
      official: 'Official Work',
      blog: 'Blog & Learning',
    };

    const sectionColors = {
      household: 'green',
      personal: 'blue',
      official: 'purple',
      blog: 'orange',
    };

    if (sectionId === 'blog') {
      return {
        id: sectionId,
        name: sectionNames[sectionId],
        color: sectionColors[sectionId],
        entries: this.getBlogEntries(),
        categories: this.getCategories(sectionId),
      };
    }

    return {
      id: sectionId,
      name: sectionNames[sectionId],
      color: sectionColors[sectionId],
      tasks: this.getTasks(sectionId),
      recurringTasks: this.getRecurringTasks(sectionId),
      categories: this.getCategories(sectionId),
    };
  }

  close() {
    // No-op for JSON database
    console.log('JSON Database service closed');
  }
}

module.exports = JSONDatabaseService;