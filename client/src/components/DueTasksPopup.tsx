import React from 'react';
import { Calendar, Clock, AlertCircle, X, CheckCircle } from 'lucide-react';
import { Task, PersonalDevelopmentTask } from '../types';

interface DueTasksPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dueTasks: (Task | PersonalDevelopmentTask)[];
  onTaskStatusChange: (sectionId: string, taskId: string, status: 'in-progress' | 'completed') => void;
}

const DueTasksPopup: React.FC<DueTasksPopupProps> = ({
  isOpen,
  onClose,
  dueTasks,
  onTaskStatusChange,
}) => {
  const getSectionColor = (sectionId: string) => {
    const colors = {
      household: 'bg-green-100 text-green-800 border-green-200',
      personal: 'bg-blue-100 text-blue-800 border-blue-200',
      official: 'bg-purple-100 text-purple-800 border-purple-200',
      blog: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[sectionId as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSectionName = (sectionId: string) => {
    const names = {
      household: 'Household',
      personal: 'Personal Dev',
      official: 'Official Work',
      blog: 'Blog',
    };
    return names[sectionId as keyof typeof names] || sectionId;
  };

  const groupedTasks = dueTasks.reduce((acc, task) => {
    const sectionId = (task as any).sectionId || 'general';
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(task);
    return acc;
  }, {} as Record<string, (Task | PersonalDevelopmentTask)[]>);

  if (!isOpen || dueTasks.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Tasks Due Today</h2>
              <p className="text-sm text-gray-600">
                {dueTasks.length} task{dueTasks.length > 1 ? 's' : ''} need{dueTasks.length === 1 ? 's' : ''} your attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([sectionId, tasks]) => (
            <div key={sectionId} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSectionColor(sectionId)}`}>
                  {getSectionName(sectionId)}
                </span>
                <span className="text-sm text-gray-500">
                  {tasks.length} task{tasks.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Status: {task.status.replace('-', ' ')}</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {task.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        {task.status === 'todo' && (
                          <button
                            onClick={() => onTaskStatusChange(sectionId, task.id, 'in-progress')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button
                            onClick={() => onTaskStatusChange(sectionId, task.id, 'completed')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DueTasksPopup;