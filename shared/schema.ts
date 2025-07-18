import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tasks table
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["todo", "in-progress", "completed"] }).notNull(),
  dueDate: text("due_date").notNull(),
  category: text("category").notNull(),
  sectionId: text("section_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  classStartDate: text("class_start_date"),
  classFromTime: text("class_from_time"),
  classToTime: text("class_to_time"),
  progress: integer("progress").default(0),
});

// Recurring tasks table
export const recurringTasks = pgTable("recurring_tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["todo", "in-progress", "completed"] }).notNull(),
  category: text("category").notNull(),
  sectionId: text("section_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  startDate: text("start_date").notNull(),
  recurrenceValue: integer("recurrence_value").notNull(),
  recurrenceUnit: text("recurrence_unit", { enum: ["minutes", "hours", "days", "weeks", "months"] }).notNull(),
  endDate: text("end_date"),
  nextOccurrence: text("next_occurrence").notNull(),
});

// Sub goals table
export const subGoals = pgTable("sub_goals", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["todo", "in-progress", "completed"] }).notNull(),
  dueDate: text("due_date").notNull(),
  category: text("category").notNull(),
  completed: boolean("completed").default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sectionId: text("section_id").notNull(),
});

// Blog entries table
export const blogEntries = pgTable("blog_entries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["to-read", "reading", "practiced", "expert"] }).notNull(),
  category: text("category").notNull(),
  dueDate: text("due_date").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Schema validations
export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  createdAt: true,
  updatedAt: true 
});

export const insertRecurringTaskSchema = createInsertSchema(recurringTasks).omit({ 
  createdAt: true,
  updatedAt: true 
});

export const insertSubGoalSchema = createInsertSchema(subGoals).omit({ 
  createdAt: true,
  updatedAt: true 
});

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true 
});

export const insertBlogEntrySchema = createInsertSchema(blogEntries).omit({ 
  createdAt: true,
  updatedAt: true 
});

// Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type RecurringTask = typeof recurringTasks.$inferSelect;
export type InsertRecurringTask = z.infer<typeof insertRecurringTaskSchema>;

export type SubGoal = typeof subGoals.$inferSelect;
export type InsertSubGoal = z.infer<typeof insertSubGoalSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type BlogEntry = typeof blogEntries.$inferSelect;
export type InsertBlogEntry = z.infer<typeof insertBlogEntrySchema>;
