import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema, 
  insertRecurringTaskSchema,
  insertSubGoalSchema,
  insertCategorySchema,
  insertBlogEntrySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task routes
  app.get("/api/tasks/:sectionId", async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.params.sectionId);
      const subGoalsPromises = tasks.map(async (task) => {
        const subGoals = await storage.getSubGoals(task.id);
        return { ...task, subGoals };
      });
      const tasksWithSubGoals = await Promise.all(subGoalsPromises);
      res.json(tasksWithSubGoals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update task" });
      }
    }
  });

  app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const success = await storage.updateTaskStatus(req.params.id, status);
      if (!success) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update task status" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Recurring task routes
  app.get("/api/recurring-tasks/:sectionId", async (req, res) => {
    try {
      const tasks = await storage.getRecurringTasks(req.params.sectionId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring tasks" });
    }
  });

  app.post("/api/recurring-tasks", async (req, res) => {
    try {
      const taskData = insertRecurringTaskSchema.parse(req.body);
      const task = await storage.createRecurringTask(taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recurring task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create recurring task" });
      }
    }
  });

  app.patch("/api/recurring-tasks/:id", async (req, res) => {
    try {
      const updates = insertRecurringTaskSchema.partial().parse(req.body);
      const task = await storage.updateRecurringTask(req.params.id, updates);
      if (!task) {
        res.status(404).json({ error: "Recurring task not found" });
        return;
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recurring task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update recurring task" });
      }
    }
  });

  app.delete("/api/recurring-tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteRecurringTask(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Recurring task not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recurring task" });
    }
  });

  // Sub goal routes
  app.get("/api/sub-goals/:taskId", async (req, res) => {
    try {
      const subGoals = await storage.getSubGoals(req.params.taskId);
      res.json(subGoals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sub goals" });
    }
  });

  app.post("/api/sub-goals", async (req, res) => {
    try {
      const subGoalData = insertSubGoalSchema.parse(req.body);
      const subGoal = await storage.createSubGoal(subGoalData);
      res.json(subGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid sub goal data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create sub goal" });
      }
    }
  });

  app.patch("/api/sub-goals/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const success = await storage.updateSubGoalStatus(req.params.id, status);
      if (!success) {
        res.status(404).json({ error: "Sub goal not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update sub goal status" });
    }
  });

  app.delete("/api/sub-goals/:id", async (req, res) => {
    try {
      const success = await storage.deleteSubGoal(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Sub goal not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sub goal" });
    }
  });

  // Category routes
  app.get("/api/categories/:sectionId", async (req, res) => {
    try {
      const categories = await storage.getCategories(req.params.sectionId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.delete("/api/categories/:sectionId/:name", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.sectionId, req.params.name);
      if (!success) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Blog entry routes
  app.get("/api/blog-entries", async (req, res) => {
    try {
      const entries = await storage.getBlogEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog entries" });
    }
  });

  app.post("/api/blog-entries", async (req, res) => {
    try {
      const entryData = insertBlogEntrySchema.parse(req.body);
      const entry = await storage.createBlogEntry(entryData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid blog entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create blog entry" });
      }
    }
  });

  app.patch("/api/blog-entries/:id", async (req, res) => {
    try {
      const updates = insertBlogEntrySchema.partial().parse(req.body);
      const entry = await storage.updateBlogEntry(req.params.id, updates);
      if (!entry) {
        res.status(404).json({ error: "Blog entry not found" });
        return;
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid blog entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update blog entry" });
      }
    }
  });

  app.patch("/api/blog-entries/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const success = await storage.updateBlogEntryStatus(req.params.id, status);
      if (!success) {
        res.status(404).json({ error: "Blog entry not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update blog entry status" });
    }
  });

  app.delete("/api/blog-entries/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogEntry(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Blog entry not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog entry" });
    }
  });

  // Section data route (for getting all data for a section)
  app.get("/api/sections/:sectionId", async (req, res) => {
    try {
      const sectionId = req.params.sectionId;
      
      if (sectionId === 'blog') {
        const entries = await storage.getBlogEntries();
        const categories = await storage.getCategories(sectionId);
        res.json({
          id: sectionId,
          name: 'Blog & Learning',
          color: 'orange',
          entries,
          categories: categories.map(c => c.name),
        });
      } else {
        const tasks = await storage.getTasks(sectionId);
        const recurringTasks = await storage.getRecurringTasks(sectionId);
        const categories = await storage.getCategories(sectionId);
        
        // Add sub goals to tasks
        const tasksWithSubGoals = await Promise.all(
          tasks.map(async (task) => {
            const subGoals = await storage.getSubGoals(task.id);
            return { ...task, subGoals };
          })
        );

        const sectionNames = {
          household: 'Household Work',
          personal: 'Personal Development',
          official: 'Official Work',
        };

        const sectionColors = {
          household: 'green',
          personal: 'blue',
          official: 'purple',
        };

        res.json({
          id: sectionId,
          name: sectionNames[sectionId as keyof typeof sectionNames] || 'Unknown Section',
          color: sectionColors[sectionId as keyof typeof sectionColors] || 'gray',
          tasks: tasksWithSubGoals,
          recurringTasks,
          categories: categories.map(c => c.name),
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch section data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
