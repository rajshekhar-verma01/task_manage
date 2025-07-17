import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { BlogEntry } from '../types';

interface BlogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: BlogEntry) => void;
  entry?: BlogEntry;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const BlogEntryModal: React.FC<BlogEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  entry, 
  categories,
  onAddCategory
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: '',
  });

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        description: entry.description,
        dueDate: entry.dueDate,
        category: entry.category,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        category: '',
      });
    }
    setNewCategory('');
    setShowNewCategory(false);
  }, [entry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const blogEntry: BlogEntry = {
      id: entry?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      status: entry?.status || 'to-read', // Always start with 'to-read' for new entries
      dueDate: formData.dueDate,
      category: formData.category,
      createdAt: entry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(blogEntry);
    onClose();
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
            {entry ? 'Edit Blog Entry' : 'Add New Blog Entry'}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Learn React Hooks, Master TypeScript, etc."
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Describe what you want to learn or practice..."
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              Target Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {entry && (
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Current Status</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entry.status === 'expert' 
                    ? 'bg-green-100 text-green-800' 
                    : entry.status === 'practiced'
                    ? 'bg-blue-100 text-blue-800'
                    : entry.status === 'reading'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {entry.status === 'to-read' ? 'To Read' : 
                   entry.status === 'reading' ? 'Reading' :
                   entry.status === 'practiced' ? 'Practiced' : 'Expert'}
                </span>
              </div>
              <p className="text-sm text-orange-700 mt-2">
                Use the status buttons in the main view to progress through: To Read → Reading → Practiced → Expert
              </p>
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
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              {entry ? 'Update Entry' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogEntryModal;