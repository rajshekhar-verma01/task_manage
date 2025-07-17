import React from 'react';
import { Calendar, Tag, BookOpen, Eye, Target, Award, ArrowRight, Trash2 } from 'lucide-react';
import { BlogEntry } from '../types';

interface BlogEntryCardProps {
  entry: BlogEntry;
  onStatusChange: (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => void;
  onEdit: (entry: BlogEntry) => void;
  onDelete: (entryId: string) => void;
}

const BlogEntryCard: React.FC<BlogEntryCardProps> = ({ 
  entry, 
  onStatusChange, 
  onEdit, 
  onDelete 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expert':
        return <Award className="w-5 h-5 text-green-500" />;
      case 'practiced':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'reading':
        return <Eye className="w-5 h-5 text-yellow-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expert':
        return 'border-green-200 bg-green-50';
      case 'practiced':
        return 'border-blue-200 bg-blue-50';
      case 'reading':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'to-read':
        return 'reading';
      case 'reading':
        return 'practiced';
      case 'practiced':
        return 'expert';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'to-read':
        return 'Start Reading';
      case 'reading':
        return 'Mark Practiced';
      case 'practiced':
        return 'Mark Expert';
      default:
        return 'Expert Level';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'practiced':
        return 'Practiced';
      case 'expert':
        return 'Expert';
      default:
        return status;
    }
  };

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(entry.status);
    if (nextStatus) {
      onStatusChange(entry.id, nextStatus as 'to-read' | 'reading' | 'practiced' | 'expert');
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getStatusColor(entry.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(entry.status)}
          <h3 className="font-semibold text-gray-800">{entry.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            entry.status === 'expert' 
              ? 'bg-green-100 text-green-800' 
              : entry.status === 'practiced'
              ? 'bg-blue-100 text-blue-800'
              : entry.status === 'reading'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {getStatusDisplayText(entry.status)}
          </span>
          {entry.status !== 'expert' && (
            <button
              onClick={handleStatusChange}
              className="flex items-center space-x-1 px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
            >
              <span>{getStatusButtonText(entry.status)}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{entry.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Target: {new Date(entry.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Tag className="w-4 h-4" />
          <span>{entry.category}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onEdit(entry)}
          className="text-sm text-orange-600 hover:text-orange-800 font-medium"
        >
          Edit Entry
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default BlogEntryCard;