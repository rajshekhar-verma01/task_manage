import React from 'react';
import { Clock, Calendar, Tag, CheckCircle, Play, Circle, ArrowRight, User } from 'lucide-react';
import { Task, PersonalDevelopmentTask, RecurringTask, SubGoal } from '../types';

interface TaskListProps {
  tasks: (Task | PersonalDevelopmentTask | RecurringTask | SubGoal | any)[];
  onStatusChange: (taskId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onSubGoalStatusChange?: (taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onEdit: (task: Task | PersonalDevelopmentTask) => void;
  sectionType: string;
  isUpcoming?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onStatusChange, 
  onSubGoalStatusChange, 
  onEdit, 
  sectionType,
  isUpcoming = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'todo':
        return 'in-progress';
      case 'in-progress':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'todo':
        return 'Start';
      case 'in-progress':
        return 'Complete';
      default:
        return 'Completed';
    }
  };

  const handleStatusChange = (task: any) => {
    const nextStatus = getNextStatus(task.status);
    if (nextStatus) {
      if (task.parentTaskId && onSubGoalStatusChange) {
        onSubGoalStatusChange(task.parentTaskId, task.id, nextStatus);
      } else {
        onStatusChange(task.id, nextStatus);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return `Overdue (${date.toLocaleDateString()})`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date < today) {
      return 'text-red-600 font-medium'; // Overdue
    } else if (date.toDateString() === today.toDateString()) {
      return 'text-orange-600 font-medium'; // Today
    } else {
      return 'text-gray-600'; // Future
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              {sectionType === 'personal' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr 
                key={task.parentTaskId ? `${task.parentTaskId}-${task.id}` : task.id}
                className={`hover:bg-gray-50 transition-colors ${getStatusColor(task.status)}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-medium text-gray-900 ${
                          task.status === 'completed' ? 'line-through' : ''
                        }`}>
                          {task.title}
                        </h3>
                        {task.parentTaskId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <User className="w-3 h-3 mr-1" />
                            Sub Goal
                          </span>
                        )}
                        {isUpcoming && !task.parentTaskId && 'nextOccurrence' in task && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : task.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{task.category}</span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${getDueDateColor(task.dueDate || task.nextOccurrence)}`}>
                      {formatDate('nextOccurrence' in task ? task.nextOccurrence : task.dueDate)}
                    </span>
                  </div>
                </td>
                
                {sectionType === 'personal' && (
                  <td className="px-6 py-4">
                    {(task as PersonalDevelopmentTask).progress !== undefined ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(task as PersonalDevelopmentTask).progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {(task as PersonalDevelopmentTask).progress}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                )}
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(task)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        <span>{getStatusButtonText(task.status)}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {!task.parentTaskId && !isUpcoming && (
                      <button
                        onClick={() => onEdit(task)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">No tasks to display</div>
          <p className="text-gray-500">Tasks will appear here when available</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;