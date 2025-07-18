const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    try {
      // Get user data directory for database storage
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      
      // Ensure the directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      
      const dbPath = path.join(userDataPath, 'taskflow.db');
      console.log('Database path:', dbPath);
      
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.initializeTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  initializeTables() {
    try {
      // Create tasks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed')),
          due_date TEXT NOT NULL,
          category TEXT NOT NULL,
          section_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          class_start_date TEXT,
          class_from_time TEXT,
          class_to_time TEXT,
          progress INTEGER DEFAULT 0
        )
      `);

      // Create recurring tasks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS recurring_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed')),
          category TEXT NOT NULL,
          section_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          start_date TEXT NOT NULL,
          recurrence_value INTEGER NOT NULL,
          recurrence_unit TEXT NOT NULL,
          end_date TEXT,
          next_occurrence TEXT NOT NULL
        )
      `);

      // Create sub goals table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sub_goals (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed')),
          due_date TEXT NOT NULL,
          category TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
        )
      `);

      // Create categories table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          section_id TEXT NOT NULL,
          UNIQUE(name, section_id)
        )
      `);

      // Create blog entries table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS blog_entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('to-read', 'reading', 'practiced', 'expert')),
          category TEXT NOT NULL,
          due_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Insert default categories
      this.insertDefaultCategories();
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  insertDefaultCategories() {
    const defaultCategories = [
      { section: 'household', categories: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'] },
      { section: 'personal', categories: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'] },
      { section: 'official', categories: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'] },
      { section: 'blog', categories: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'] },
    ];

    const insertCategory = this.db.prepare(`
      INSERT OR IGNORE INTO categories (name, section_id) VALUES (?, ?)
    `);

    defaultCategories.forEach(({ section, categories }) => {
      categories.forEach(category => {
        try {
          insertCategory.run(category, section);
        } catch (error) {
          console.error(`Error inserting category ${category} for section ${section}:`, error);
        }
      });
    });
  }

  // Task operations
  saveTask(task, sectionId) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tasks (
          id, title, description, status, due_date, category, section_id,
          created_at, updated_at, class_start_date, class_from_time, class_to_time, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        task.id,
        task.title,
        task.description,
        task.status,
        task.dueDate,
        task.category,
        sectionId,
        task.createdAt,
        task.updatedAt,
        task.classStartDate || null,
        task.classFromTime || null,
        task.classToTime || null,
        task.progress || 0
      );

      // Save sub goals if they exist
      if (task.subGoals && Array.isArray(task.subGoals)) {
        this.saveSubGoals(task.id, task.subGoals);
      }

      console.log(`Task saved: ${task.title} in section ${sectionId}`);
      return { success: true };
    } catch (error) {
      console.error('Error saving task:', error);
      return { success: false, error: error.message };
    }
  }

  getTasks(sectionId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM tasks WHERE section_id = ? ORDER BY created_at DESC
      `);
      const rows = stmt.all(sectionId);

      const tasks = rows.map(row => {
        const task = {
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          dueDate: row.due_date,
          category: row.category,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        // Add personal development specific fields
        if (sectionId === 'personal') {
          task.classStartDate = row.class_start_date;
          task.classFromTime = row.class_from_time;
          task.classToTime = row.class_to_time;
          task.progress = row.progress;
          task.subGoals = this.getSubGoals(row.id);
        }

        return task;
      });

      console.log(`Loaded ${tasks.length} tasks for section ${sectionId}`);
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  // Recurring task operations
  saveRecurringTask(task, sectionId) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO recurring_tasks (
          id, title, description, status, category, section_id,
          created_at, updated_at, start_date, end_date, recurrence_value, recurrence_unit, next_occurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        task.id,
        task.title,
        task.description,
        task.status,
        task.category,
        sectionId,
        task.createdAt,
        task.updatedAt,
        task.startDate,
        task.endDate || null,
        task.recurrenceValue,
        task.recurrenceUnit,
        task.nextOccurrence
      );

      console.log(`Recurring task saved: ${task.title} in section ${sectionId}`);
      return { success: true };
    } catch (error) {
      console.error('Error saving recurring task:', error);
      return { success: false, error: error.message };
    }
  }

  getRecurringTasks(sectionId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM recurring_tasks WHERE section_id = ? ORDER BY created_at DESC
      `);
      const rows = stmt.all(sectionId);

      const tasks = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        category: row.category,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        startDate: row.start_date,
        endDate: row.end_date,
        recurrenceValue: row.recurrence_value,
        recurrenceUnit: row.recurrence_unit,
        nextOccurrence: row.next_occurrence,
      }));

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
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO blog_entries (
          id, title, description, status, category, due_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        entry.id,
        entry.title,
        entry.description,
        entry.status,
        entry.category,
        entry.dueDate,
        entry.createdAt,
        entry.updatedAt
      );

      console.log(`Blog entry saved: ${entry.title}`);
      return { success: true };
    } catch (error) {
      console.error('Error saving blog entry:', error);
      return { success: false, error: error.message };
    }
  }

  getBlogEntries() {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM blog_entries ORDER BY created_at DESC
      `);
      const rows = stmt.all();

      const entries = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        category: row.category,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(`Loaded ${entries.length} blog entries`);
      return entries;
    } catch (error) {
      console.error('Error getting blog entries:', error);
      return [];
    }
  }

  // Sub goal operations
  saveSubGoals(taskId, subGoals) {
    try {
      // First, delete existing sub goals for this task
      const deleteStmt = this.db.prepare('DELETE FROM sub_goals WHERE task_id = ?');
      deleteStmt.run(taskId);

      // Insert new sub goals
      const insertStmt = this.db.prepare(`
        INSERT INTO sub_goals (
          id, task_id, title, description, status, due_date, category,
          completed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      subGoals.forEach(subGoal => {
        insertStmt.run(
          subGoal.id,
          taskId,
          subGoal.title,
          subGoal.description,
          subGoal.status,
          subGoal.dueDate,
          subGoal.category,
          subGoal.completed,
          subGoal.createdAt,
          subGoal.updatedAt
        );
      });

      console.log(`Saved ${subGoals.length} sub goals for task ${taskId}`);
    } catch (error) {
      console.error('Error saving sub goals:', error);
    }
  }

  getSubGoals(taskId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM sub_goals WHERE task_id = ? ORDER BY created_at ASC
      `);
      const rows = stmt.all(taskId);

      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        dueDate: row.due_date,
        category: row.category,
        completed: row.completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting sub goals:', error);
      return [];
    }
  }

  // Category operations
  getCategories(sectionId) {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM categories WHERE section_id = ? ORDER BY name ASC
      `);
      const rows = stmt.all(sectionId);
      const categories = rows.map(row => row.name);
      console.log(`Loaded ${categories.length} categories for section ${sectionId}`);
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  addCategory(sectionId, categoryName) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO categories (name, section_id) VALUES (?, ?)
      `);
      stmt.run(categoryName, sectionId);
      console.log(`Added category: ${categoryName} to section ${sectionId}`);
      return { success: true };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, error: error.message };
    }
  }

  removeCategory(sectionId, categoryName) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM categories WHERE name = ? AND section_id = ?
      `);
      stmt.run(categoryName, sectionId);
      console.log(`Removed category: ${categoryName} from section ${sectionId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing category:', error);
      return { success: false, error: error.message };
    }
  }

  // Status update operations
  updateTaskStatus(taskId, status) {
    try {
      const stmt = this.db.prepare(`
        UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(status, new Date().toISOString(), taskId);
      console.log(`Updated task ${taskId} status to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    }
  }

  updateRecurringTaskStatus(taskId, status) {
    try {
      const stmt = this.db.prepare(`
        UPDATE recurring_tasks SET status = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(status, new Date().toISOString(), taskId);
      console.log(`Updated recurring task ${taskId} status to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating recurring task status:', error);
      return { success: false, error: error.message };
    }
  }

  updateBlogEntryStatus(entryId, status) {
    try {
      const stmt = this.db.prepare(`
        UPDATE blog_entries SET status = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(status, new Date().toISOString(), entryId);
      console.log(`Updated blog entry ${entryId} status to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating blog entry status:', error);
      return { success: false, error: error.message };
    }
  }

  updateSubGoalStatus(subGoalId, status) {
    try {
      const stmt = this.db.prepare(`
        UPDATE sub_goals SET status = ?, completed = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(status, status === 'completed', new Date().toISOString(), subGoalId);

      // Update parent task progress
      this.updateTaskProgress(subGoalId);
      console.log(`Updated sub goal ${subGoalId} status to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating sub goal status:', error);
      return { success: false, error: error.message };
    }
  }

  updateTaskProgress(subGoalId) {
    try {
      // Get the task ID for this sub goal
      const taskStmt = this.db.prepare('SELECT task_id FROM sub_goals WHERE id = ?');
      const result = taskStmt.get(subGoalId);
      
      if (result) {
        // Calculate progress
        const progressStmt = this.db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
          FROM sub_goals WHERE task_id = ?
        `);
        const progress = progressStmt.get(result.task_id);
        
        const progressPercentage = progress.total > 0 
          ? Math.round((progress.completed / progress.total) * 100) 
          : 0;

        // Update task progress
        const updateStmt = this.db.prepare(`
          UPDATE tasks SET progress = ?, updated_at = ? WHERE id = ?
        `);
        updateStmt.run(progressPercentage, new Date().toISOString(), result.task_id);
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  }

  // Delete operations
  deleteTask(taskId) {
    try {
      const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      stmt.run(taskId);
      console.log(`Deleted task ${taskId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  deleteRecurringTask(taskId) {
    try {
      const stmt = this.db.prepare('DELETE FROM recurring_tasks WHERE id = ?');
      stmt.run(taskId);
      console.log(`Deleted recurring task ${taskId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      return { success: false, error: error.message };
    }
  }

  deleteBlogEntry(entryId) {
    try {
      const stmt = this.db.prepare('DELETE FROM blog_entries WHERE id = ?');
      stmt.run(entryId);
      console.log(`Deleted blog entry ${entryId}`);
      return { success: true };
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
      blog: 'Blog',
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
    this.db.close();
  }
}

module.exports = DatabaseService;