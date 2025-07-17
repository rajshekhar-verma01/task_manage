export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogEntry {
  id: string;
  title: string;
  description: string;
  status: 'to-read' | 'reading' | 'practiced' | 'expert';
  dueDate: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTask extends Omit<Task, 'dueDate'> {
  startDate: string;
  endDate?: string;
  recurrenceValue: number;
  recurrenceUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  nextOccurrence: string;
}

export interface SubGoal {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: string;
  category: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalDevelopmentTask extends Task {
  classStartDate?: string;
  classFromTime?: string;
  classToTime?: string;
  subGoals?: SubGoal[];
  progress?: number;
}

export interface TaskSection {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  categories: string[];
}

export interface BlogSection {
  id: string;
  name: string;
  color: string;
  entries: BlogEntry[];
  categories: string[];
}

export interface Analytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  categoryBreakdown: { [key: string]: number };
  monthlyProgress: { month: string; completed: number; total: number }[];
}
export interface BlogAnalytics {
  totalEntries: number;
  toReadEntries: number;
  readingEntries: number;
  practicedEntries: number;
  expertEntries: number;
  completionRate: number;
  categoryBreakdown: { [key: string]: number };
  statusBreakdown: { [key: string]: number };
  monthlyProgress: { month: string; completed: number; total: number }[];
}