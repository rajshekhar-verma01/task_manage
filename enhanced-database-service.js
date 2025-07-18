import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class EnhancedDatabaseService {
  constructor(dbPath = null) {
    try {
      // Use provided path or default to data directory
      const dataPath = dbPath || path.join(process.cwd(), 'data');
      
      // Ensure the directory exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      const fullDbPath = dbPath || path.join(dataPath, 'taskflow-enhanced.db');
      console.log('Enhanced database path:', fullDbPath);
      
      this.db = new Database(fullDbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('foreign_keys = ON');
      
      this.initializeTables();
      this.createIndexes();
      console.log('Enhanced database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced database:', error);
      throw error;
    }
  }

  initializeTables() {
    try {
      // Enhanced tasks table with more fields
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed', 'cancelled')),
          due_date TEXT NOT NULL,
          category TEXT NOT NULL,
          section_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          completed_at TEXT,
          class_start_date TEXT,
          class_from_time TEXT,
          class_to_time TEXT,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          progress INTEGER DEFAULT 0,
          estimated_hours REAL,
          actual_hours REAL,
          tags TEXT, -- JSON array of tags
          notes TEXT,
          parent_task_id TEXT,
          is_recurring BOOLEAN DEFAULT FALSE,
          recurrence_pattern TEXT, -- JSON for complex patterns
          next_due_date TEXT,
          reminder_enabled BOOLEAN DEFAULT FALSE,
          reminder_time TEXT,
          color TEXT DEFAULT '#3B82F6',
          FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);

      // Enhanced recurring tasks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS recurring_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          section_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
          recurrence_interval INTEGER DEFAULT 1,
          recurrence_days TEXT, -- JSON array for specific days
          start_date TEXT NOT NULL,
          end_date TEXT,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          is_active BOOLEAN DEFAULT TRUE,
          last_generated TEXT,
          next_generation TEXT,
          estimated_hours REAL,
          tags TEXT,
          color TEXT DEFAULT '#10B981'
        );
      `);

      // Enhanced blog entries table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS blog_entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('to-read', 'reading', 'practiced', 'expert', 'archived')),
          category TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          read_at TEXT,
          practiced_at TEXT,
          expert_at TEXT,
          estimated_read_time INTEGER, -- in minutes
          actual_read_time INTEGER,
          difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
          tags TEXT,
          notes TEXT,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          source TEXT,
          author TEXT,
          published_date TEXT,
          bookmark_folder TEXT,
          is_favorite BOOLEAN DEFAULT FALSE
        );
      `);

      // Enhanced categories table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#6B7280',
          icon TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          sort_order INTEGER DEFAULT 0,
          UNIQUE(section_id, name)
        );
      `);

      // Enhanced sub-goals table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sub_goals (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed', 'cancelled')),
          completed BOOLEAN DEFAULT FALSE,
          category TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          completed_at TEXT,
          due_date TEXT,
          priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          estimated_hours REAL,
          actual_hours REAL,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);

      // Time tracking table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS time_entries (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          blog_entry_id TEXT,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_active BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (blog_entry_id) REFERENCES blog_entries(id) ON DELETE CASCADE
        );
      `);

      // Analytics and statistics table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          tasks_completed INTEGER DEFAULT 0,
          tasks_created INTEGER DEFAULT 0,
          blog_entries_read INTEGER DEFAULT 0,
          total_time_minutes INTEGER DEFAULT 0,
          productivity_score REAL DEFAULT 0,
          section_breakdown TEXT, -- JSON object
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // User preferences table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Notifications table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('reminder', 'due', 'overdue', 'achievement', 'system')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          task_id TEXT,
          blog_entry_id TEXT,
          scheduled_time TEXT NOT NULL,
          sent_at TEXT,
          read_at TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          is_sent BOOLEAN DEFAULT FALSE,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (blog_entry_id) REFERENCES blog_entries(id) ON DELETE CASCADE
        );
      `);

      // Backups table for data recovery
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'auto', 'export')),
          file_path TEXT NOT NULL,
          created_at TEXT NOT NULL,
          size_bytes INTEGER,
          description TEXT,
          is_valid BOOLEAN DEFAULT TRUE
        );
      `);

      console.log('All enhanced tables created successfully');
    } catch (error) {
      console.error('Error creating enhanced tables:', error);
      throw error;
    }
  }

  createIndexes() {
    try {
      // Performance indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_section_status ON tasks(section_id, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
        
        CREATE INDEX IF NOT EXISTS idx_blog_entries_status ON blog_entries(status);
        CREATE INDEX IF NOT EXISTS idx_blog_entries_category ON blog_entries(category);
        CREATE INDEX IF NOT EXISTS idx_blog_entries_created_at ON blog_entries(created_at);
        CREATE INDEX IF NOT EXISTS idx_blog_entries_rating ON blog_entries(rating);
        
        CREATE INDEX IF NOT EXISTS idx_sub_goals_task_id ON sub_goals(task_id);
        CREATE INDEX IF NOT EXISTS idx_sub_goals_status ON sub_goals(status);
        
        CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
        CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(start_time);
        CREATE INDEX IF NOT EXISTS idx_time_entries_active ON time_entries(is_active);
        
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_time);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
        
        CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
        CREATE INDEX IF NOT EXISTS idx_categories_section ON categories(section_id);
      `);
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  // Enhanced task operations
  saveTask(task, sectionId) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tasks (
          id, title, description, status, due_date, category, section_id,
          created_at, updated_at, completed_at, class_start_date, class_from_time, class_to_time,
          priority, progress, estimated_hours, actual_hours, tags, notes,
          parent_task_id, is_recurring, recurrence_pattern, next_due_date,
          reminder_enabled, reminder_time, color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        task.id, task.title, task.description, task.status, task.dueDate, task.category, sectionId,
        task.createdAt, task.updatedAt, task.completedAt || null, task.classStartDate || null,
        task.classFromTime || null, task.classToTime || null, task.priority, task.progress || 0,
        task.estimatedHours || null, task.actualHours || null, 
        task.tags ? JSON.stringify(task.tags) : null, task.notes || null,
        task.parentTaskId || null, task.isRecurring ? 1 : 0, 
        task.recurrencePattern ? JSON.stringify(task.recurrencePattern) : null,
        task.nextDueDate || null, task.reminderEnabled ? 1 : 0, task.reminderTime || null,
        task.color || '#3B82F6'
      );
      
      // Update daily stats
      this.updateDailyStats('tasks_created', 1);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error saving enhanced task:', error);
      return false;
    }
  }

  // Enhanced search functionality
  searchTasks(query, sectionId = null, filters = {}) {
    try {
      let sql = `
        SELECT * FROM tasks 
        WHERE (title LIKE ? OR description LIKE ? OR category LIKE ? OR tags LIKE ?)
      `;
      let params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
      
      if (sectionId) {
        sql += ` AND section_id = ?`;
        params.push(sectionId);
      }
      
      if (filters.status) {
        sql += ` AND status = ?`;
        params.push(filters.status);
      }
      
      if (filters.priority) {
        sql += ` AND priority = ?`;
        params.push(filters.priority);
      }
      
      if (filters.category) {
        sql += ` AND category = ?`;
        params.push(filters.category);
      }
      
      sql += ` ORDER BY created_at DESC`;
      
      const stmt = this.db.prepare(sql);
      const tasks = stmt.all(params);
      
      return tasks.map(this.mapTaskFromDb);
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  // Analytics functions
  getProductivityStats(startDate, endDate) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as tasks_created,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
          AVG(actual_hours) as avg_hours,
          section_id
        FROM tasks 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at), section_id
        ORDER BY date DESC
      `);
      
      return stmt.all(startDate, endDate);
    } catch (error) {
      console.error('Error getting productivity stats:', error);
      return [];
    }
  }

  // Time tracking functions
  startTimeEntry(taskId, blogEntryId = null, description = '') {
    try {
      const id = 'time-' + Date.now();
      const now = new Date().toISOString();
      
      // Stop any active time entries first
      this.stopActiveTimeEntries();
      
      const stmt = this.db.prepare(`
        INSERT INTO time_entries (
          id, task_id, blog_entry_id, start_time, description, created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(id, taskId, blogEntryId, now, description, now, now, 1);
      return result.changes > 0 ? id : null;
    } catch (error) {
      console.error('Error starting time entry:', error);
      return null;
    }
  }

  stopTimeEntry(entryId) {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE time_entries 
        SET end_time = ?, duration_minutes = CAST((julianday(?) - julianday(start_time)) * 24 * 60 AS INTEGER), 
            updated_at = ?, is_active = 0
        WHERE id = ?
      `);
      
      const result = stmt.run(now, now, now, entryId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error stopping time entry:', error);
      return false;
    }
  }

  // User preferences
  setPreference(key, value, type = 'string') {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_preferences (key, value, type, created_at, updated_at)
        VALUES (?, ?, ?, COALESCE((SELECT created_at FROM user_preferences WHERE key = ?), ?), ?)
      `);
      
      const result = stmt.run(key, typeof value === 'object' ? JSON.stringify(value) : String(value), type, key, now, now);
      return result.changes > 0;
    } catch (error) {
      console.error('Error setting preference:', error);
      return false;
    }
  }

  getPreference(key, defaultValue = null) {
    try {
      const stmt = this.db.prepare('SELECT value, type FROM user_preferences WHERE key = ?');
      const result = stmt.get(key);
      
      if (!result) return defaultValue;
      
      switch (result.type) {
        case 'boolean':
          return result.value === 'true';
        case 'number':
          return parseFloat(result.value);
        case 'json':
          return JSON.parse(result.value);
        default:
          return result.value;
      }
    } catch (error) {
      console.error('Error getting preference:', error);
      return defaultValue;
    }
  }

  // Helper functions
  mapTaskFromDb(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.due_date,
      category: task.category,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at,
      classStartDate: task.class_start_date,
      classFromTime: task.class_from_time,
      classToTime: task.class_to_time,
      priority: task.priority,
      progress: task.progress,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      tags: task.tags ? JSON.parse(task.tags) : [],
      notes: task.notes,
      parentTaskId: task.parent_task_id,
      isRecurring: task.is_recurring,
      recurrencePattern: task.recurrence_pattern ? JSON.parse(task.recurrence_pattern) : null,
      nextDueDate: task.next_due_date,
      reminderEnabled: task.reminder_enabled,
      reminderTime: task.reminder_time,
      color: task.color
    };
  }

  updateDailyStats(metric, increment = 1) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO daily_stats (date, ${metric}, created_at, updated_at)
        VALUES (?, COALESCE((SELECT ${metric} FROM daily_stats WHERE date = ?), 0) + ?, 
                COALESCE((SELECT created_at FROM daily_stats WHERE date = ?), ?), ?)
      `);
      
      stmt.run(today, today, increment, today, now, now);
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  stopActiveTimeEntries() {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE time_entries 
        SET end_time = ?, duration_minutes = CAST((julianday(?) - julianday(start_time)) * 24 * 60 AS INTEGER), 
            updated_at = ?, is_active = 0
        WHERE is_active = 1
      `);
      
      stmt.run(now, now, now);
    } catch (error) {
      console.error('Error stopping active time entries:', error);
    }
  }

  // Database maintenance
  vacuum() {
    try {
      this.db.exec('VACUUM');
      console.log('Database vacuumed successfully');
    } catch (error) {
      console.error('Error vacuuming database:', error);
    }
  }

  backup(backupPath) {
    try {
      // Simple file copy backup since better-sqlite3 backup API varies
      const srcPath = this.db.name;
      fs.copyFileSync(srcPath, backupPath);
      
      // Record backup
      const now = new Date().toISOString();
      const size = fs.statSync(backupPath).size;
      const stmt = this.db.prepare(`
        INSERT INTO backups (backup_type, file_path, created_at, size_bytes, description)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run('manual', backupPath, now, size, 'Manual backup');
      console.log('Database backed up successfully to:', backupPath);
      return true;
    } catch (error) {
      console.error('Error backing up database:', error);
      return false;
    }
  }

  // Add missing methods from original database service
  getTasks(sectionId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM tasks WHERE section_id = ? ORDER BY created_at DESC');
      const tasks = stmt.all(sectionId);
      return tasks.map(this.mapTaskFromDb);
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  deleteTask(taskId) {
    try {
      const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      const result = stmt.run(taskId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  saveBlogEntry(entry) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO blog_entries (
          id, title, url, description, status, category, created_at, updated_at,
          read_at, practiced_at, expert_at, estimated_read_time, actual_read_time,
          difficulty_level, tags, notes, rating, source, author, published_date,
          bookmark_folder, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        entry.id, entry.title, entry.url, entry.description, entry.status, entry.category,
        entry.createdAt, entry.updatedAt, entry.readAt || null, entry.practicedAt || null,
        entry.expertAt || null, entry.estimatedReadTime || null, entry.actualReadTime || null,
        entry.difficultyLevel || null, entry.tags ? JSON.stringify(entry.tags) : null,
        entry.notes || null, entry.rating || null, entry.source || null, entry.author || null,
        entry.publishedDate || null, entry.bookmarkFolder || null, entry.isFavorite ? 1 : 0
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error saving blog entry:', error);
      return false;
    }
  }

  getBlogEntries() {
    try {
      const stmt = this.db.prepare('SELECT * FROM blog_entries ORDER BY created_at DESC');
      const entries = stmt.all();
      
      return entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        description: entry.description,
        status: entry.status,
        category: entry.category,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
        readAt: entry.read_at,
        practicedAt: entry.practiced_at,
        expertAt: entry.expert_at,
        estimatedReadTime: entry.estimated_read_time,
        actualReadTime: entry.actual_read_time,
        difficultyLevel: entry.difficulty_level,
        tags: entry.tags ? JSON.parse(entry.tags) : [],
        notes: entry.notes,
        rating: entry.rating,
        source: entry.source,
        author: entry.author,
        publishedDate: entry.published_date,
        bookmarkFolder: entry.bookmark_folder,
        isFavorite: entry.is_favorite === 1
      }));
    } catch (error) {
      console.error('Error getting blog entries:', error);
      return [];
    }
  }

  updateTaskStatus(taskId, status) {
    try {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      const stmt = this.db.prepare('UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?');
      const result = stmt.run(status, new Date().toISOString(), completedAt, taskId);
      
      if (result.changes > 0 && status === 'completed') {
        this.updateDailyStats('tasks_completed', 1);
      }
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  addCategory(sectionId, categoryName) {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO categories (section_id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(sectionId, categoryName, now, now);
      return result.changes > 0;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  }

  getCategories(sectionId) {
    try {
      const stmt = this.db.prepare('SELECT name FROM categories WHERE section_id = ? AND is_active = 1');
      const categories = stmt.all(sectionId);
      return categories.map(cat => cat.name);
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default EnhancedDatabaseService;