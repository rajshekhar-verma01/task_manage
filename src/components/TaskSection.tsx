import React, { useState } from 'react';
import { Plus, Calendar, Repeat, Clock, Settings } from 'lucide-react';
import TaskCard from './TaskCard';
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
  onTaskStatusChange: (taskId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onSubGoalStatusChange: (taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => void;
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
  onTaskStatusChange,
  onSubGoalStatusChange,
  onAddCategory,
  onRemoveCategory,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | PersonalDevelopmentTask | undefined>();

  const handleEditTask = (task: Task | PersonalDevelopmentTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const upcoming: (Task | RecurringTask | SubGoal)[] = [];
    
    // Add upcoming general tasks
    const upcomingTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate > now && task.status !== 'completed';
    });
    upcoming.push(...upcomingTasks);
    
    // Add upcoming recurring tasks
    const upcomingRecurring = recurringTasks.filter(task => {
      const nextDate = new Date(task.nextOccurrence);
      return nextDate > now && task.status !== 'completed';
    });
    upcoming.push(...upcomingRecurring);
    
    // Add upcoming sub goals from personal development tasks
    if (sectionType === 'personal') {
      tasks.forEach(task => {
        const personalTask = task as PersonalDevelopmentTask;
        if (personalTask.subGoals) {
          personalTask.subGoals.forEach(subGoal => {
            const dueDate = new Date(subGoal.dueDate);
            if (dueDate > now && subGoal.status !== 'completed') {
              upcoming.push({
                ...subGoal,
                title: `${task.title} - ${subGoal.title}`,
                parentTaskId: task.id,
              } as SubGoal & { parentTaskId: string });
            }
          });
        }
      });
    }
    
    return upcoming.sort((a, b) => {
      const dateA = new Date(a.dueDate || (a as RecurringTask).nextOccurrence);
      const dateB = new Date(b.dueDate || (b as RecurringTask).nextOccurrence);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const tabs = [
    { id: 'general', name: 'General Tasks', icon: Calendar },
    { id: 'recurring', name: 'Recurring Tasks', icon: Repeat },
    { id: 'upcoming', name: 'Upcoming Tasks', icon: Clock },
  ];

  const renderUpcomingItem = (item: any) => {
    if (item.parentTaskId) {
      // This is a sub goal
      return (
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
      );
    } else {
      // This is a regular task
      return (
        <TaskCard
          key={item.id}
          task={item}
          onStatusChange={onTaskStatusChange}
          onSubGoalStatusChange={onSubGoalStatusChange}
          onEdit={handleEditTask}
          sectionType={sectionType}
        />
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{sectionName}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'general' && tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
            onSubGoalStatusChange={onSubGoalStatusChange}
            onEdit={handleEditTask}
            sectionType={sectionType}
          />
        ))}
        
        {activeTab === 'recurring' && recurringTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
            onSubGoalStatusChange={onSubGoalStatusChange}
            onEdit={handleEditTask}
            sectionType={sectionType}
          />
        ))}
        
        {activeTab === 'upcoming' && getUpcomingTasks().map((item) => renderUpcomingItem(item))}
      </div>

      {((activeTab === 'general' && tasks.length === 0) ||
        (activeTab === 'recurring' && recurringTasks.length === 0) ||
        (activeTab === 'upcoming' && getUpcomingTasks().length === 0)) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No tasks found</div>
          <p className="text-gray-500">Create your first task to get started!</p>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={onTaskUpdate}
        task={editingTask}
        sectionType={sectionType}
        categories={categories}
        onAddCategory={onAddCategory}
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