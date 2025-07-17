import React, { useState } from 'react';
import { Home, RotateCcw, Calendar, Bell, Filter, Plus, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Task, PersonalDevelopmentTask, Analytics } from '../types';
import TaskModal from './TaskModal';

interface TaskDashboardProps {
  tasks: any;
  onTaskUpdate: (sectionId: string, task: Task | PersonalDevelopmentTask) => void;
  onTaskStatusChange: (sectionId: string, taskId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onSubGoalStatusChange: (sectionId: string, taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onAddCategory: (sectionId: string, category: string) => void;
  onRemoveCategory: (sectionId: string, category: string) => void;
  analytics: any;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskStatusChange,
  onSubGoalStatusChange,
  onAddCategory,
  onRemoveCategory,
  analytics
}) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [activeSection, setActiveSection] = useState('household');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | PersonalDevelopmentTask | undefined>();

  const currentSection = tasks[activeSection];
  const currentAnalytics = analytics[activeSection];

  const tabs = [
    { id: 'tasks', name: 'Tasks', icon: Home, subtitle: 'View scheduled tasks', active: true },
    { id: 'recurring', name: 'Recurring', icon: RotateCcw, subtitle: 'Set up recurring tasks', active: false },
    { id: 'upcoming', name: 'Upcoming', icon: Calendar, subtitle: 'View scheduled tasks', active: false },
    { id: 'notifications', name: 'Notifications', icon: Bell, subtitle: 'Desktop reminders', active: false },
  ];

  const sections = [
    { id: 'household', name: 'Household', color: 'bg-green-500' },
    { id: 'personal', name: 'Personal', color: 'bg-blue-500' },
    { id: 'official', name: 'Official', color: 'bg-purple-500' },
    { id: 'blog', name: 'Blog', color: 'bg-orange-500' },
  ];

  const getFilteredTasks = () => {
    let filteredTasks = [...currentSection.tasks];

    if (hideCompleted) {
      filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
    }

    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }

    return filteredTasks;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[category.length % colors.length];
  };

  const handleEditTask = (task: Task | PersonalDevelopmentTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleTaskSave = (task: Task | PersonalDevelopmentTask) => {
    onTaskUpdate(activeSection, task);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className={`text-xs ${activeTab === tab.id ? 'text-green-100' : 'text-gray-500'}`}>
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Section Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? `${section.color} text-white`
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Tasks</div>
                <div className="text-2xl font-bold text-blue-900">{currentAnalytics.totalTasks}</div>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Completed</div>
                <div className="text-2xl font-bold text-green-900">{currentAnalytics.completedTasks}</div>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-600 font-medium">Pending</div>
                <div className="text-2xl font-bold text-orange-900">{currentAnalytics.todoTasks + currentAnalytics.inProgressTasks}</div>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {currentSection.categories.map((category: string) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                hideCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hide Completed
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {getFilteredTasks().map((task: Task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center">
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'completed' ? 'Completed' : task.status === 'in-progress' ? 'Todo' : 'Todo'}
                        </span>

                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor('Medium')}`}>
                          Medium
                        </span>

                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>

                        {task.description && (
                          <span className="text-sm text-gray-600">{task.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>5m</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {task.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => onTaskStatusChange(activeSection, task.id, task.status === 'todo' ? 'in-progress' : 'completed')}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          {task.status === 'todo' ? 'Start' : 'Complete'}
                        </button>
                        {task.status === 'in-progress' && (
                          <button
                            onClick={() => onTaskStatusChange(activeSection, task.id, 'completed')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredTasks().length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-lg font-medium mb-2">No tasks found</div>
              <p>Create your first task to get started!</p>
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleTaskSave}
        task={editingTask}
        sectionType={activeSection}
        categories={currentSection.categories}
        onAddCategory={(category) => onAddCategory(activeSection, category)}
      />
    </div>
  );
};

export default TaskDashboard;