import React, { useState } from 'react';
import { Plus, Calendar, Repeat, Clock, Settings, Filter, Grid, List } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskList from './TaskList';
import TaskModal from './TaskModal';
import CategoryModal from './CategoryModal';
import { Task, PersonalDevelopmentTask, RecurringTask, SubGoal } from '../types';

interface TaskSectionProps {
  sectionName: string;
  sectionType: string;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  categories: string[];
  onTaskUpdate: (task: Task | PersonalDevelopmentTask) => void;
  onRecurringTaskUpdate: (task: RecurringTask) => void;
  onTaskStatusChange: (taskId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onSubGoalStatusChange: (taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteRecurringTask: (taskId: string) => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  sectionName,
  sectionType,
  tasks,
  recurringTasks,
  categories,
  onTaskUpdate,
  onRecurringTaskUpdate,
  onTaskStatusChange,
  onSubGoalStatusChange,
  onDeleteTask,
  onDeleteRecurringTask,
  onAddCategory,
  onRemoveCategory,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dueDateRange: 'all',
  });
  const [editingTask, setEditingTask] = useState<Task | PersonalDevelopmentTask | undefined>();
  const [editingRecurringTask, setEditingRecurringTask] = useState<RecurringTask | undefined>();
  const [taskType, setTaskType] = useState<'general' | 'recurring'>('general');

  const handleEditTask = (task: Task | PersonalDevelopmentTask) => {
    setEditingTask(task);
    setEditingRecurringTask(undefined);
    setTaskType('general');
    setIsModalOpen(true);
  };

  const handleEditRecurringTask = (task: RecurringTask) => {
    setEditingRecurringTask(task);
    setEditingTask(undefined);
    setTaskType('recurring');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
    setEditingRecurringTask(undefined);
    setTaskType('general');
  };

  const applyFilters = (taskList: (Task | RecurringTask)[]) => {
    return taskList.filter(task => {
      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Due date filter
      if (filters.dueDateRange !== 'all') {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        switch (filters.dueDateRange) {
          case 'overdue':
            if (dueDate >= today) return false;
            break;
          case 'today':
            if (dueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            if (dueDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'this-week':
            if (dueDate < today || dueDate > nextWeek) return false;
            break;
          case 'this-month':
            if (dueDate < today || dueDate > nextMonth) return false;
            break;
        }
      }

      return true;
    });
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const upcomingGeneral: (Task | SubGoal)[] = [];
    let upcomingRecurring: RecurringTask[] = [];
    
    // Add upcoming general tasks
    const upcomingTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate > now && task.status !== 'completed';
    });
    upcomingGeneral.push(...upcomingTasks);
    
    // Add upcoming recurring tasks
    upcomingRecurring = recurringTasks.filter(task => {
      const nextDate = new Date(task.nextOccurrence);
      const endDate = task.endDate ? new Date(task.endDate) : null;
      return nextDate > now && task.status !== 'completed' && (!endDate || nextDate <= endDate);
    });
    
    // Add upcoming sub goals from personal development tasks
    if (sectionType === 'personal') {
      tasks.forEach(task => {
        const personalTask = task as PersonalDevelopmentTask;
        if (personalTask.subGoals) {
          personalTask.subGoals.forEach(subGoal => {
            const dueDate = new Date(subGoal.dueDate);
            if (dueDate > now && subGoal.status !== 'completed') {
              upcomingGeneral.push({
                ...subGoal,
                title: `${task.title} - ${subGoal.title}`,
                parentTaskId: task.id,
              } as SubGoal & { parentTaskId: string });
            }
          });
        }
      });
    }
    
    // Sort both arrays
    upcomingGeneral.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    upcomingRecurring.sort((a, b) => {
      const dateA = new Date(a.nextOccurrence);
      const dateB = new Date(b.nextOccurrence);
      return dateA.getTime() - dateB.getTime();
    });
    
    return { general: upcomingGeneral, recurring: upcomingRecurring };
  };

  const applyFiltersToUpcoming = (upcomingData: { general: (Task | SubGoal)[], recurring: RecurringTask[] }) => {
    const filterTasks = (taskList: any[]) => {
      return taskList.filter(task => {
        // Status filter
        if (filters.status !== 'all' && task.status !== filters.status) {
          return false;
        }

        // Category filter
        if (filters.category !== 'all' && task.category !== filters.category) {
          return false;
        }

        // Due date filter for upcoming tasks
        if (filters.dueDateRange !== 'all') {
          const taskDate = new Date(task.dueDate || task.nextOccurrence);
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
    
          switch (filters.dueDateRange) {
            case 'today':
              if (taskDate.toDateString() !== today.toDateString()) return false;
              break;
            case 'tomorrow':
              if (taskDate.toDateString() !== tomorrow.toDateString()) return false;
              break;
            case 'this-week':
              if (taskDate < today || taskDate > nextWeek) return false;
              break;
            case 'this-month':
              if (taskDate < today || taskDate > nextMonth) return false;
              break;
          }
        }

        return true;
      });
    };
    
    return {
      general: filterTasks(upcomingData.general),
      recurring: filterTasks(upcomingData.recurring)
    };
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'general':
        return applyFilters(tasks);
      case 'recurring':
        return applyFilters(recurringTasks);
      case 'upcoming':
        return applyFiltersToUpcoming(getUpcomingTasks());
      default:
        return [];
    }
  };

  const tabs = [
    { id: 'general', name: 'General Tasks', icon: Calendar },
    { id: 'recurring', name: 'Recurring Tasks', icon: Repeat },
    { id: 'upcoming', name: 'Upcoming Tasks', icon: Clock },
  ];

  const renderUpcomingContent = () => {
    const upcomingData = getUpcomingTasks();
    
    return (
      <div className="space-y-8">
        {/* General Tasks Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Upcoming General Tasks ({upcomingData.general.length})
          </h3>
          {upcomingData.general.length > 0 ? (
            viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingData.general.map((item) => (
                  item.parentTaskId ? (
                    <div key={`${item.parentTaskId}-${item.id}`} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">SUB GOAL</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  ) : (
                    <TaskCard
                      key={item.id}
                      task={item}
                      onStatusChange={onTaskStatusChange}
                      onSubGoalStatusChange={onSubGoalStatusChange}
                      onEdit={handleEditTask}
                      onDelete={onDeleteTask}
                      sectionType={sectionType}
                    />
                  )
                ))}
              </div>
            ) : (
              <TaskList
                tasks={upcomingData.general}
                onStatusChange={onTaskStatusChange}
                onSubGoalStatusChange={onSubGoalStatusChange}
                onEdit={handleEditTask}
                onDelete={onDeleteTask}
                sectionType={sectionType}
                isUpcoming={true}
              />
            )
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-sm">No upcoming general tasks</div>
            </div>
          )}
        </div>

        {/* Recurring Tasks Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Repeat className="w-5 h-5 mr-2 text-purple-500" />
            Upcoming Recurring Tasks ({upcomingData.recurring.length})
          </h3>
          {upcomingData.recurring.length > 0 ? (
            viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingData.recurring.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onTaskStatusChange}
                    onSubGoalStatusChange={onSubGoalStatusChange}
                    onEdit={handleEditRecurringTask}
                    onDelete={onDeleteRecurringTask}
                    sectionType={sectionType}
                  />
                ))}
              </div>
            ) : (
              <TaskList
                tasks={upcomingData.recurring}
                onStatusChange={onTaskStatusChange}
                onSubGoalStatusChange={onSubGoalStatusChange}
                onEdit={handleEditRecurringTask}
                onDelete={onDeleteRecurringTask}
                sectionType={sectionType}
                isUpcoming={true}
              />
            )
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-sm">No upcoming recurring tasks</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{sectionName}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-sm">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">List</span>
            </button>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Categories</span>
          </button>
          {activeTab === 'general' && (
            <button
              onClick={() => {
                setTaskType('general');
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          )}
          {activeTab === 'recurring' && (
            <button
              onClick={() => {
                setTaskType('recurring');
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recurring Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <select
                value={filters.dueDateRange}
                onChange={(e) => setFilters({ ...filters, dueDateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ status: 'all', category: 'all', dueDateRange: 'all' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tasks Display */}
      {activeTab === 'upcoming' ? (
        renderUpcomingContent()
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredTasks().map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onTaskStatusChange}
              onSubGoalStatusChange={onSubGoalStatusChange}
              onEdit={activeTab === 'recurring' ? handleEditRecurringTask : handleEditTask}
              onDelete={activeTab === 'recurring' ? onDeleteRecurringTask : onDeleteTask}
              sectionType={sectionType}
            />
          ))}
        </div>
      ) : (
        <TaskList
          tasks={getFilteredTasks()}
          onStatusChange={onTaskStatusChange}
          onSubGoalStatusChange={onSubGoalStatusChange}
          onEdit={activeTab === 'recurring' ? handleEditRecurringTask : handleEditTask}
          onDelete={activeTab === 'recurring' ? onDeleteRecurringTask : onDeleteTask}
          sectionType={sectionType}
        />
      )}

      {activeTab !== 'upcoming' && getFilteredTasks().length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {(filters.status !== 'all' || filters.category !== 'all' || filters.dueDateRange !== 'all') 
              ? 'No tasks match the current filters' 
              : 'No tasks found'
            }
          </div>
          <p className="text-gray-500">
            {(filters.status !== 'all' || filters.category !== 'all' || filters.dueDateRange !== 'all') 
              ? 'Try adjusting your filters or create a new task' 
              : 'Create your first task to get started!'
            }
          </p>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={taskType === 'recurring' ? onRecurringTaskUpdate : onTaskUpdate}
        task={editingTask || editingRecurringTask}
        sectionType={sectionType}
        categories={categories}
        onAddCategory={onAddCategory}
        taskType={taskType}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={onAddCategory}
        onRemoveCategory={onRemoveCategory}
        sectionName={sectionName}
      />
    </div>
  );
};

export default TaskSection;