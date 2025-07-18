import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class DatabaseService {
  constructor() {
    try {
      // Create data directory for testing
      const dataPath = path.join(process.cwd(), 'data');
      
      // Ensure the directory exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      const dbPath = path.join(dataPath, 'taskflow-test.db');
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
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          progress INTEGER DEFAULT 0
        );
      `);

      // Create recurring_tasks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS recurring_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed')),
          due_date TEXT NOT NULL,
          category TEXT NOT NULL,
          section_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
          start_date TEXT NOT NULL,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high'))
        );
      `);

      // Create blog_entries table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS blog_entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('to-read', 'reading', 'practiced', 'expert')),
          category TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create categories table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section_id TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(section_id, name)
        );
      `);

      // Create sub_goals table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sub_goals (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed')),
          completed BOOLEAN DEFAULT FALSE,
          category TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);

      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Task operations
  saveTask(task, sectionId) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tasks (
          id, title, description, status, due_date, category, section_id,
          created_at, updated_at, class_start_date, class_from_time, class_to_time,
          priority, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
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
        task.priority,
        task.progress || 0
      );
      
      // Save sub goals if they exist
      if (task.subGoals && Array.isArray(task.subGoals)) {
        const deleteSubGoals = this.db.prepare('DELETE FROM sub_goals WHERE task_id = ?');
        deleteSubGoals.run(task.id);
        
        const insertSubGoal = this.db.prepare(`
          INSERT INTO sub_goals (
            id, task_id, title, description, status, completed, category, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const subGoal of task.subGoals) {
          insertSubGoal.run(
            subGoal.id,
            task.id,
            subGoal.title,
            subGoal.description,
            subGoal.status,
            subGoal.completed ? 1 : 0,
            subGoal.category,
            subGoal.createdAt,
            subGoal.updatedAt
          );
        }
      }
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error saving task:', error);
      return false;
    }
  }

  getTasks(sectionId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM tasks WHERE section_id = ?');
      const tasks = stmt.all(sectionId);
      
      // Get sub goals for each task
      const subGoalStmt = this.db.prepare('SELECT * FROM sub_goals WHERE task_id = ?');
      
      return tasks.map(task => {
        const subGoals = subGoalStmt.all(task.id);
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          dueDate: task.due_date,
          category: task.category,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          classStartDate: task.class_start_date,
          classFromTime: task.class_from_time,
          classToTime: task.class_to_time,
          priority: task.priority,
          progress: task.progress,
          subGoals: subGoals.map(sg => ({
            id: sg.id,
            title: sg.title,
            description: sg.description,
            status: sg.status,
            completed: sg.completed === 1,
            category: sg.category,
            createdAt: sg.created_at,
            updatedAt: sg.updated_at
          }))
        };
      });
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

  // Blog entry operations
  saveBlogEntry(entry) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO blog_entries (
          id, title, url, description, status, category, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        entry.id,
        entry.title,
        entry.url,
        entry.description,
        entry.status,
        entry.category,
        entry.createdAt,
        entry.updatedAt
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
        updatedAt: entry.updated_at
      }));
    } catch (error) {
      console.error('Error getting blog entries:', error);
      return [];
    }
  }

  // Category operations
  addCategory(sectionId, categoryName) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO categories (section_id, name, created_at)
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(sectionId, categoryName, new Date().toISOString());
      return result.changes > 0;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  }

  getCategories(sectionId) {
    try {
      const stmt = this.db.prepare('SELECT name FROM categories WHERE section_id = ?');
      const categories = stmt.all(sectionId);
      return categories.map(cat => cat.name);
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Status update operations
  updateTaskStatus(taskId, status) {
    try {
      const stmt = this.db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?');
      const result = stmt.run(status, new Date().toISOString(), taskId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Test the database functionality
async function testDatabase() {
  console.log('=== Testing Database Functionality ===');
  
  try {
    const db = new DatabaseService();
    console.log('✓ Database service created successfully');
    
    // Test 1: Create and save a task
    const testTask = {
      id: 'test-task-' + Date.now(),
      title: 'Test Task for Data Persistence',
      description: 'This task tests if data can be saved and retrieved correctly',
      category: 'Testing',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0
    };
    
    console.log('Testing task save...');
    const taskSaved = db.saveTask(testTask, 'household');
    console.log(taskSaved ? '✓ Task saved successfully' : '✗ Task save failed');
    
    // Test 2: Retrieve tasks
    console.log('Testing task retrieval...');
    const tasks = db.getTasks('household');
    console.log(`✓ Retrieved ${tasks.length} tasks from household section`);
    console.log('Latest task:', tasks.find(t => t.id === testTask.id)?.title || 'Not found');
    
    // Test 3: Update task status
    console.log('Testing task status update...');
    const statusUpdated = db.updateTaskStatus(testTask.id, 'in-progress');
    console.log(statusUpdated ? '✓ Task status updated successfully' : '✗ Task status update failed');
    
    // Test 4: Create and save a blog entry
    const testBlogEntry = {
      id: 'blog-test-' + Date.now(),
      title: 'Test Blog Entry',
      url: 'https://example.com/test-article',
      description: 'A test blog entry to verify data persistence',
      status: 'to-read',
      category: 'Testing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Testing blog entry save...');
    const blogSaved = db.saveBlogEntry(testBlogEntry);
    console.log(blogSaved ? '✓ Blog entry saved successfully' : '✗ Blog entry save failed');
    
    // Test 5: Retrieve blog entries
    console.log('Testing blog entry retrieval...');
    const blogEntries = db.getBlogEntries();
    console.log(`✓ Retrieved ${blogEntries.length} blog entries`);
    
    // Test 6: Add and retrieve categories
    console.log('Testing category management...');
    const categoryAdded = db.addCategory('household', 'Data Test Category');
    console.log(categoryAdded ? '✓ Category added successfully' : '✗ Category add failed');
    
    const categories = db.getCategories('household');
    console.log(`✓ Retrieved ${categories.length} categories for household section`);
    
    // Test 7: Verify data persistence by creating a new connection
    console.log('Testing data persistence across connections...');
    db.close();
    
    const db2 = new DatabaseService();
    const persistedTasks = db2.getTasks('household');
    const persistedBlogEntries = db2.getBlogEntries();
    const persistedCategories = db2.getCategories('household');
    
    console.log(`✓ Data persisted - Tasks: ${persistedTasks.length}, Blog Entries: ${persistedBlogEntries.length}, Categories: ${persistedCategories.length}`);
    
    db2.close();
    
    console.log('\n=== All Database Tests PASSED! ===');
    console.log('Data persistence is working correctly.');
    
  } catch (error) {
    console.error('✗ Database test failed:', error);
  }
}

// Run the test
testDatabase();