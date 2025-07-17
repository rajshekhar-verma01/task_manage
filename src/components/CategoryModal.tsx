import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  sectionName: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRemoveCategory,
  sectionName,
}) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Manage Categories - {sectionName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleAddCategory} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories created yet</p>
          ) : (
            categories.map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-800">{category}</span>
                <button
                  onClick={() => onRemoveCategory(category)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
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

export default CategoryModal;