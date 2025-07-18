import { 
  type Task, 
  type InsertTask, 
  type RecurringTask, 
  type InsertRecurringTask,
  type SubGoal,
  type InsertSubGoal,
  type Category,
  type InsertCategory,
  type BlogEntry,
  type InsertBlogEntry
} from "@shared/schema";

export interface IStorage {
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(sectionId: string): Promise<Task[]>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  updateTaskStatus(id: string, status: "todo" | "in-progress" | "completed"): Promise<boolean>;

  // Recurring task operations
  createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask>;
  getRecurringTasks(sectionId: string): Promise<RecurringTask[]>;
  updateRecurringTask(id: string, task: Partial<InsertRecurringTask>): Promise<RecurringTask | undefined>;
  deleteRecurringTask(id: string): Promise<boolean>;

  // Sub goal operations
  createSubGoal(subGoal: InsertSubGoal): Promise<SubGoal>;
  getSubGoals(taskId: string): Promise<SubGoal[]>;
  updateSubGoal(id: string, subGoal: Partial<InsertSubGoal>): Promise<SubGoal | undefined>;
  deleteSubGoal(id: string): Promise<boolean>;
  updateSubGoalStatus(id: string, status: "todo" | "in-progress" | "completed"): Promise<boolean>;

  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(sectionId: string): Promise<Category[]>;
  deleteCategory(sectionId: string, name: string): Promise<boolean>;

  // Blog entry operations
  createBlogEntry(entry: InsertBlogEntry): Promise<BlogEntry>;
  getBlogEntries(): Promise<BlogEntry[]>;
  updateBlogEntry(id: string, entry: Partial<InsertBlogEntry>): Promise<BlogEntry | undefined>;
  deleteBlogEntry(id: string): Promise<boolean>;
  updateBlogEntryStatus(id: string, status: "to-read" | "reading" | "practiced" | "expert"): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private recurringTasks: Map<string, RecurringTask>;
  private subGoals: Map<string, SubGoal>;
  private categories: Map<string, Category>;
  private blogEntries: Map<string, BlogEntry>;
  private categoryIdCounter: number;

  constructor() {
    this.tasks = new Map();
    this.recurringTasks = new Map();
    this.subGoals = new Map();
    this.categories = new Map();
    this.blogEntries = new Map();
    this.categoryIdCounter = 1;
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { section: 'household', categories: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'] },
      { section: 'personal', categories: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'] },
      { section: 'official', categories: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'] },
      { section: 'blog', categories: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'] },
    ];

    defaultCategories.forEach(({ section, categories }) => {
      categories.forEach(categoryName => {
        const category: Category = {
          id: this.categoryIdCounter++,
          name: categoryName,
          sectionId: section,
        };
        this.categories.set(`${section}-${categoryName}`, category);
      });
    });
  }

  // Task operations
  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      ...insertTask,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getTasks(sectionId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.sectionId === sectionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTask(id: string, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated: Task = {
      ...existing,
      ...taskUpdate,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    // Also delete associated sub goals
    Array.from(this.subGoals.values())
      .filter(subGoal => subGoal.taskId === id)
      .forEach(subGoal => this.subGoals.delete(subGoal.id));
      
    return this.tasks.delete(id);
  }

  async updateTaskStatus(id: string, status: "todo" | "in-progress" | "completed"): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    const updated = { ...task, status, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return true;
  }

  // Recurring task operations
  async createRecurringTask(insertRecurringTask: InsertRecurringTask): Promise<RecurringTask> {
    const now = new Date().toISOString();
    const recurringTask: RecurringTask = {
      ...insertRecurringTask,
      createdAt: now,
      updatedAt: now,
    };
    this.recurringTasks.set(recurringTask.id, recurringTask);
    return recurringTask;
  }

  async getRecurringTasks(sectionId: string): Promise<RecurringTask[]> {
    return Array.from(this.recurringTasks.values())
      .filter(task => task.sectionId === sectionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateRecurringTask(id: string, taskUpdate: Partial<InsertRecurringTask>): Promise<RecurringTask | undefined> {
    const existing = this.recurringTasks.get(id);
    if (!existing) return undefined;
    
    const updated: RecurringTask = {
      ...existing,
      ...taskUpdate,
      updatedAt: new Date().toISOString(),
    };
    this.recurringTasks.set(id, updated);
    return updated;
  }

  async deleteRecurringTask(id: string): Promise<boolean> {
    return this.recurringTasks.delete(id);
  }

  // Sub goal operations
  async createSubGoal(insertSubGoal: InsertSubGoal): Promise<SubGoal> {
    const now = new Date().toISOString();
    const subGoal: SubGoal = {
      ...insertSubGoal,
      createdAt: now,
      updatedAt: now,
    };
    this.subGoals.set(subGoal.id, subGoal);
    return subGoal;
  }

  async getSubGoals(taskId: string): Promise<SubGoal[]> {
    return Array.from(this.subGoals.values())
      .filter(subGoal => subGoal.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateSubGoal(id: string, subGoalUpdate: Partial<InsertSubGoal>): Promise<SubGoal | undefined> {
    const existing = this.subGoals.get(id);
    if (!existing) return undefined;
    
    const updated: SubGoal = {
      ...existing,
      ...subGoalUpdate,
      updatedAt: new Date().toISOString(),
    };
    this.subGoals.set(id, updated);
    return updated;
  }

  async deleteSubGoal(id: string): Promise<boolean> {
    return this.subGoals.delete(id);
  }

  async updateSubGoalStatus(id: string, status: "todo" | "in-progress" | "completed"): Promise<boolean> {
    const subGoal = this.subGoals.get(id);
    if (!subGoal) return false;
    
    const updated = { 
      ...subGoal, 
      status, 
      completed: status === 'completed',
      updatedAt: new Date().toISOString() 
    };
    this.subGoals.set(id, updated);
    
    // Update parent task progress
    await this.updateTaskProgress(subGoal.taskId);
    return true;
  }

  private async updateTaskProgress(taskId: string): Promise<void> {
    const subGoals = await this.getSubGoals(taskId);
    if (subGoals.length === 0) return;
    
    const completedCount = subGoals.filter(sg => sg.status === 'completed').length;
    const progress = Math.round((completedCount / subGoals.length) * 100);
    
    await this.updateTask(taskId, { progress });
  }

  // Category operations
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.categoryIdCounter++,
      ...insertCategory,
    };
    this.categories.set(`${category.sectionId}-${category.name}`, category);
    return category;
  }

  async getCategories(sectionId: string): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(category => category.sectionId === sectionId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteCategory(sectionId: string, name: string): Promise<boolean> {
    return this.categories.delete(`${sectionId}-${name}`);
  }

  // Blog entry operations
  async createBlogEntry(insertBlogEntry: InsertBlogEntry): Promise<BlogEntry> {
    const now = new Date().toISOString();
    const blogEntry: BlogEntry = {
      ...insertBlogEntry,
      createdAt: now,
      updatedAt: now,
    };
    this.blogEntries.set(blogEntry.id, blogEntry);
    return blogEntry;
  }

  async getBlogEntries(): Promise<BlogEntry[]> {
    return Array.from(this.blogEntries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateBlogEntry(id: string, entryUpdate: Partial<InsertBlogEntry>): Promise<BlogEntry | undefined> {
    const existing = this.blogEntries.get(id);
    if (!existing) return undefined;
    
    const updated: BlogEntry = {
      ...existing,
      ...entryUpdate,
      updatedAt: new Date().toISOString(),
    };
    this.blogEntries.set(id, updated);
    return updated;
  }

  async deleteBlogEntry(id: string): Promise<boolean> {
    return this.blogEntries.delete(id);
  }

  async updateBlogEntryStatus(id: string, status: "to-read" | "reading" | "practiced" | "expert"): Promise<boolean> {
    const entry = this.blogEntries.get(id);
    if (!entry) return false;
    
    const updated = { ...entry, status, updatedAt: new Date().toISOString() };
    this.blogEntries.set(id, updated);
    return true;
  }
}

export const storage = new MemStorage();
