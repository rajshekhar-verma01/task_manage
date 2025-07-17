import React from 'react';
import { Clock, Calendar, Tag, CheckCircle, Play, Circle, ArrowRight } from 'lucide-react';
import { Task, PersonalDevelopmentTask, SubGoal } from '../types';

interface TaskCardProps {
  task: Task | PersonalDevelopmentTask;
  onStatusChange: (taskId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onSubGoalStatusChange?: (taskId: string, subGoalId: string, status: 'todo' | 'in-progress' | 'completed') => void;
  onEdit: (task: Task | PersonalDevelopmentTask) => void;
  sectionType: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  onSubGoalStatusChange, 
  onEdit, 
  sectionType 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Play className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
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

  const isPersonalDev = sectionType === 'personal';
  const personalTask = isPersonalDev ? task as PersonalDevelopmentTask : null;

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(task.status);
    if (nextStatus) {
      onStatusChange(task.id, nextStatus);
    }
  };

  const handleSubGoalStatusChange = (subGoal: SubGoal) => {
    const nextStatus = getNextStatus(subGoal.status);
    if (nextStatus && onSubGoalStatusChange) {
      onSubGoalStatusChange(task.id, subGoal.id, nextStatus);
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getStatusColor(task.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(task.status)}
          <h3 className="font-semibold text-gray-800">{task.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            task.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : task.status === 'in-progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {task.status.replace('-', ' ')}
          </span>
          {task.status !== 'completed' && (
            <button
              onClick={handleStatusChange}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
            >
              <span>{getStatusButtonText(task.status)}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            {'nextOccurrence' in task 
              ? `Next: ${new Date((task as any).nextOccurrence).toLocaleDateString()}`
              : new Date(task.dueDate).toLocaleDateString()
            }
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Tag className="w-4 h-4" />
          <span>{task.category}</span>
        </div>
      </div>

      {personalTask && personalTask.classStartDate && (
        <div className="flex items-center space-x-2 text-xs text-blue-600 mb-2">
          <Clock className="w-4 h-4" />
          <span>Class: {personalTask.classStartDate} | {personalTask.classFromTime} - {personalTask.classToTime}</span>
        </div>
      )}

      {personalTask && personalTask.subGoals && personalTask.subGoals.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Sub Goals</span>
            <span className="text-sm text-blue-600">{personalTask.progress || 0}%</span>
          </div>
          <div className="space-y-2">
            {personalTask.subGoals.map((subGoal) => (
              <div key={subGoal.id} className="p-2 bg-white rounded border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(subGoal.status)}
                    <span className={`text-sm font-medium ${
                      subGoal.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'
                    }`}>
                      {subGoal.title}
                    </span>
                  </div>
                  {subGoal.status !== 'completed' && (
                    <button
                      onClick={() => handleSubGoalStatusChange(subGoal)}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      <span>{getStatusButtonText(subGoal.status)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1">{subGoal.description}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(subGoal.dueDate).toLocaleDateString()}</span>
                  <Tag className="w-3 h-3" />
                  <span>{subGoal.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={() => onEdit(task)}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Edit Task
      </button>
    </div>
  );
};

export default TaskCard;