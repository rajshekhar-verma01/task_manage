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

export interface RecurringTask extends Task {
  startDate: string;
  recurrenceDays: number;
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

export interface Analytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  categoryBreakdown: { [key: string]: number };
  monthlyProgress: { month: string; completed: number; total: number }[];
}