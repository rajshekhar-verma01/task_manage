import React, { useState } from 'react';
import { Plus, Settings, Filter, Grid, List } from 'lucide-react';
import BlogEntryCard from './BlogEntryCard';
import BlogEntryModal from './BlogEntryModal';
import CategoryModal from './CategoryModal';
import { BlogEntry } from '../types';

interface BlogSectionProps {
  entries: BlogEntry[];
  categories: string[];
  onEntryUpdate: (entry: BlogEntry) => void;
  onEntryStatusChange: (entryId: string, status: 'to-read' | 'reading' | 'practiced' | 'expert') => void;
  onDeleteEntry: (entryId: string) => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

const BlogSection: React.FC<BlogSectionProps> = ({
  entries,
  categories,
  onEntryUpdate,
  onEntryStatusChange,
  onDeleteEntry,
  onAddCategory,
  onRemoveCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dueDateRange: 'all',
  });
  const [editingEntry, setEditingEntry] = useState<BlogEntry | undefined>();

  const handleEditEntry = (entry: BlogEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEntry(undefined);
  };

  const applyFilters = (entryList: BlogEntry[]) => {
    if (!entryList || !Array.isArray(entryList)) {
      return [];
    }
    
    return entryList.filter(entry => {
      // Status filter
      if (filters.status !== 'all' && entry.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && entry.category !== filters.category) {
        return false;
      }

      // Due date filter
      if (filters.dueDateRange !== 'all') {
        const dueDate = new Date(entry.dueDate);
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

  const filteredEntries = applyFilters(entries);

  // Group entries by status for better organization
  const groupedEntries = {
    'to-read': filteredEntries.filter(e => e.status === 'to-read'),
    'reading': filteredEntries.filter(e => e.status === 'reading'),
    'practiced': filteredEntries.filter(e => e.status === 'practiced'),
    'expert': filteredEntries.filter(e => e.status === 'expert'),
  };

  const statusConfig = {
    'to-read': { name: 'To Read', color: 'bg-gray-100 text-gray-800', icon: '📚' },
    'reading': { name: 'Reading', color: 'bg-yellow-100 text-yellow-800', icon: '👁️' },
    'practiced': { name: 'Practiced', color: 'bg-blue-100 text-blue-800', icon: '🎯' },
    'expert': { name: 'Expert', color: 'bg-green-100 text-green-800', icon: '🏆' },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blog & Learning</h1>
          <p className="text-gray-600">Track your learning journey from reading to expertise</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-orange-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="practiced">Practiced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
              <select
                value={filters.dueDateRange}
                onChange={(e) => setFilters({ ...filters, dueDateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{config.name}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {groupedEntries[status as keyof typeof groupedEntries].length}
                </p>
              </div>
              <span className="text-2xl">{config.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Entries Display */}
      {viewMode === 'card' ? (
        <div className="space-y-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusEntries = groupedEntries[status as keyof typeof groupedEntries];
            if (statusEntries.length === 0) return null;

            return (
              <div key={status}>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xl">{config.icon}</span>
                  <h2 className="text-lg font-semibold text-gray-800">{config.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {statusEntries.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusEntries.map((entry) => (
                    <BlogEntryCard
                      key={entry.id}
                      entry={entry}
                      onStatusChange={onEntryStatusChange}
                      onEdit={handleEditEntry}
                      onDelete={onDeleteEntry}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(entry.status)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{entry.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'expert' 
                          ? 'bg-green-100 text-green-800' 
                          : entry.status === 'practiced'
                          ? 'bg-blue-100 text-blue-800'
                          : entry.status === 'reading'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusConfig[entry.status].name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>{entry.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(entry.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {entry.status !== 'expert' && (
                          <button
                            onClick={() => {
                              const nextStatus = getNextStatus(entry.status);
                              if (nextStatus) {
                                onEntryStatusChange(entry.id, nextStatus as 'to-read' | 'reading' | 'practiced' | 'expert');
                              }
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                          >
                            <span>{getStatusButtonText(entry.status)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {(filters.status !== 'all' || filters.category !== 'all' || filters.dueDateRange !== 'all') 
              ? 'No entries match the current filters' 
              : 'No blog entries found'
            }
          </div>
          <p className="text-gray-500">
            {(filters.status !== 'all' || filters.category !== 'all' || filters.dueDateRange !== 'all') 
              ? 'Try adjusting your filters or create a new entry' 
              : 'Add your first learning entry to get started!'
            }
          </p>
        </div>
      )}

      <BlogEntryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={onEntryUpdate}
        entry={editingEntry}
        categories={categories}
        onAddCategory={onAddCategory}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={onAddCategory}
        onRemoveCategory={onRemoveCategory}
        sectionName="Blog & Learning"
      />
    </div>
  );
};

// Helper functions for list view
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'expert':
      return <Award className="w-4 h-4 text-green-500" />;
    case 'practiced':
      return <Target className="w-4 h-4 text-blue-500" />;
    case 'reading':
      return <Eye className="w-4 h-4 text-yellow-500" />;
    default:
      return <BookOpen className="w-4 h-4 text-gray-400" />;
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

export default BlogSection;