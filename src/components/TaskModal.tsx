import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Task, PersonalDevelopmentTask, SubGoal } from '../types';
import { RecurringTask } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | PersonalDevelopmentTask | RecurringTask) => void;
  task?: Task | PersonalDevelopmentTask;
  sectionType: string;
  categories: string[];
  onAddCategory: (category: string) => void;
  taskType: 'general' | 'recurring';
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  sectionType, 
  categories,
  onAddCategory,
  taskType
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    dueDate: '',
    category: '',
    classStartDate: '',
    classFromTime: '',
    classToTime: '',
    startDate: '',
    endDate: '',
    recurrenceValue: 1,
    recurrenceUnit: 'days' as 'minutes' | 'hours' | 'days' | 'weeks' | 'months',
  });

  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [newSubGoal, setNewSubGoal] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: '',
  });
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        category: task.category,
        classStartDate: (task as PersonalDevelopmentTask).classStartDate || '',
        classFromTime: (task as PersonalDevelopmentTask).classFromTime || '',
        classToTime: (task as PersonalDevelopmentTask).classToTime || '',
        startDate: '',
        recurrenceValue: 1,
        recurrenceUnit: 'days',
      });
      setSubGoals((task as PersonalDevelopmentTask).subGoals || []);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        dueDate: '',
        category: '',
        classStartDate: '',
        classFromTime: '',
        classToTime: '',
        startDate: '',
        endDate: '',
        recurrenceValue: 1,
        recurrenceUnit: 'days',
      });
      setSubGoals([]);
    }
    setNewSubGoal({ title: '', description: '', dueDate: '', category: '' });
    setNewCategory('');
    setShowNewCategory(false);
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (taskType === 'recurring') {
      // Calculate next occurrence based on start date and recurrence
      const startDate = new Date(formData.startDate);
      const nextOccurrence = new Date(startDate);
      
      switch (formData.recurrenceUnit) {
        case 'minutes':
          nextOccurrence.setMinutes(nextOccurrence.getMinutes() + formData.recurrenceValue);
          break;
        case 'hours':
          nextOccurrence.setHours(nextOccurrence.getHours() + formData.recurrenceValue);
          break;
        case 'days':
          nextOccurrence.setDate(nextOccurrence.getDate() + formData.recurrenceValue);
          break;
        case 'weeks':
          nextOccurrence.setDate(nextOccurrence.getDate() + (formData.recurrenceValue * 7));
          break;
        case 'months':
          nextOccurrence.setMonth(nextOccurrence.getMonth() + formData.recurrenceValue);
          break;
      }
      
      const recurringTask = {
        id: task?.id || Date.now().toString(),
        title: formData.title,
        description: formData.description,
        status: formData.status,
        dueDate: formData.dueDate,
        category: formData.category,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        recurrenceValue: formData.recurrenceValue,
        recurrenceUnit: formData.recurrenceUnit,
        nextOccurrence: nextOccurrence.toISOString().split('T')[0],
      };
      
      // Note: You'll need to add a separate handler for recurring tasks
      // For now, we'll use the same handler but you should create onSaveRecurring
      onSave(recurringTask as RecurringTask);
    } else {
      const baseTask = {
        id: task?.id || Date.now().toString(),
        title: formData.title,
        description: formData.description,
        status: formData.status,
        dueDate: formData.dueDate,
        category: formData.category,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (sectionType === 'personal') {
        const personalTask: PersonalDevelopmentTask = {
          ...baseTask,
          ...(formData.category === 'class' && {
            classStartDate: formData.classStartDate,
            classFromTime: formData.classFromTime,
            classToTime: formData.classToTime,
          }),
          subGoals: subGoals.length > 0 ? subGoals : undefined,
          progress: subGoals.length > 0 ? Math.round((subGoals.filter(sg => sg.status === 'completed').length / subGoals.length) * 100) : undefined,
        };
        onSave(personalTask);
      } else {
        onSave(baseTask);
      }
    }
    
    onClose();
  };

  const addSubGoal = () => {
    if (newSubGoal.title.trim() && newSubGoal.description.trim() && newSubGoal.dueDate && newSubGoal.category) {
      setSubGoals([...subGoals, {
        id: Date.now().toString(),
        title: newSubGoal.title,
        description: newSubGoal.description,
        status: 'todo',
        dueDate: newSubGoal.dueDate,
        category: newSubGoal.category,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
      setNewSubGoal({ title: '', description: '', dueDate: '', category: '' });
    }
  };

  const removeSubGoal = (id: string) => {
    setSubGoals(subGoals.filter(sg => sg.id !== id));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setShowNewCategory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {task ? 'Edit Task' : taskType === 'recurring' ? 'Create New Recurring Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showNewCategory && (
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {taskType === 'recurring' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty for indefinite recurrence
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurring Interval
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrenceValue}
                    onChange={(e) => setFormData({ ...formData, recurrenceValue: parseInt(e.target.value) || 1 })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    required
                  />
                  <select
                    value={formData.recurrenceUnit}
                    onChange={(e) => setFormData({ ...formData, recurrenceUnit: e.target.value as 'minutes' | 'hours' | 'days' | 'weeks' | 'months' })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Repeat every {formData.recurrenceValue} {formData.recurrenceUnit}
                </p>
              </div>
            </>
          )}

          {sectionType === 'personal' && formData.category === 'class' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Start Date
                </label>
                <input
                  type="date"
                  value={formData.classStartDate}
                  onChange={(e) => setFormData({ ...formData, classStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Time
                  </label>
                  <input
                    type="time"
                    value={formData.classFromTime}
                    onChange={(e) => setFormData({ ...formData, classFromTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Time
                  </label>
                  <input
                    type="time"
                    value={formData.classToTime}
                    onChange={(e) => setFormData({ ...formData, classToTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {sectionType === 'personal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Goals
              </label>
              <div className="space-y-3">
                {subGoals.map((subGoal) => (
                  <div key={subGoal.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{subGoal.title}</h4>
                        <p className="text-sm text-gray-600">{subGoal.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>Due: {new Date(subGoal.dueDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Category: {subGoal.category}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded ${
                            subGoal.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : subGoal.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {subGoal.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubGoal(subGoal.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Add New Sub Goal</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newSubGoal.title}
                      onChange={(e) => setNewSubGoal({ ...newSubGoal, title: e.target.value })}
                      placeholder="Sub goal title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={newSubGoal.description}
                      onChange={(e) => setNewSubGoal({ ...newSubGoal, description: e.target.value })}
                      placeholder="Sub goal description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newSubGoal.dueDate}
                        onChange={(e) => setNewSubGoal({ ...newSubGoal, dueDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newSubGoal.category}
                        onChange={(e) => setNewSubGoal({ ...newSubGoal, category: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addSubGoal}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Sub Goal</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;