const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    // Get user data directory for database storage
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'taskflow.db');
    
    console.log('Database path:', dbPath);
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
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
        insertCategory.run(category, section);
      });
    });
  }

  // Task operations
  saveTask(task, sectionId) {
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

    return { success: true };
  }

  getTasks(sectionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM tasks WHERE section_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(sectionId);

    return rows.map(row => {
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
  }

  // Recurring task operations
  saveRecurringTask(task, sectionId) {
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

    return { success: true };
  }

  getRecurringTasks(sectionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM recurring_tasks WHERE section_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(sectionId);

    return rows.map(row => ({
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
  }

  // Blog entry operations
  saveBlogEntry(entry) {
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

    return { success: true };
  }

  getBlogEntries() {
    const stmt = this.db.prepare(`
      SELECT * FROM blog_entries ORDER BY created_at DESC
    `);
    const rows = stmt.all();

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      category: row.category,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // Sub goal operations
  saveSubGoals(taskId, subGoals) {
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
  }

  getSubGoals(taskId) {
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
  }

  // Category operations
  getCategories(sectionId) {
    const stmt = this.db.prepare(`
      SELECT name FROM categories WHERE section_id = ? ORDER BY name ASC
    `);
    const rows = stmt.all(sectionId);
    return rows.map(row => row.name);
  }

  addCategory(sectionId, categoryName) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO categories (name, section_id) VALUES (?, ?)
    `);
    stmt.run(categoryName, sectionId);
    return { success: true };
  }

  removeCategory(sectionId, categoryName) {
    const stmt = this.db.prepare(`
      DELETE FROM categories WHERE name = ? AND section_id = ?
    `);
    stmt.run(categoryName, sectionId);
    return { success: true };
  }

  // Status update operations
  updateTaskStatus(taskId, status) {
    const stmt = this.db.prepare(`
      UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), taskId);
    return { success: true };
  }

  updateRecurringTaskStatus(taskId, status) {
    const stmt = this.db.prepare(`
      UPDATE recurring_tasks SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), taskId);
    return { success: true };
  }

  updateBlogEntryStatus(entryId, status) {
    const stmt = this.db.prepare(`
      UPDATE blog_entries SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), entryId);
    return { success: true };
  }

  updateSubGoalStatus(subGoalId, status) {
    const stmt = this.db.prepare(`
      UPDATE sub_goals SET status = ?, completed = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, status === 'completed', new Date().toISOString(), subGoalId);

    // Update parent task progress
    this.updateTaskProgress(subGoalId);
    return { success: true };
  }

  updateTaskProgress(subGoalId) {
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
  }

  // Delete operations
  deleteTask(taskId) {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(taskId);
    return { success: true };
  }

  deleteRecurringTask(taskId) {
    const stmt = this.db.prepare('DELETE FROM recurring_tasks WHERE id = ?');
    stmt.run(taskId);
    return { success: true };
  }

  deleteBlogEntry(entryId) {
    const stmt = this.db.prepare('DELETE FROM blog_entries WHERE id = ?');
    stmt.run(entryId);
    return { success: true };
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
    this.db.close();
  }
}

module.exports = DatabaseService;