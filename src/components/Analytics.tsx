import React from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Analytics as AnalyticsType } from '../types';

interface AnalyticsProps {
  analytics: {
    household: AnalyticsType;
    personal: AnalyticsType;
    official: AnalyticsType;
    blog: AnalyticsType;
  };
}

const Analytics: React.FC<AnalyticsProps> = ({ analytics }) => {
  const sections = [
    { key: 'household', name: 'Household', color: 'bg-green-500' },
    { key: 'personal', name: 'Personal Development', color: 'bg-blue-500' },
    { key: 'official', name: 'Official Work', color: 'bg-purple-500' },
    { key: 'blog', name: 'Blog', color: 'bg-orange-500' },
  ];

  const totalOverall = Object.values(analytics).reduce((sum, section) => sum + section.totalTasks, 0);
  const completedOverall = Object.values(analytics).reduce((sum, section) => sum + section.completedTasks, 0);
  const overallCompletionRate = totalOverall > 0 ? Math.round((completedOverall / totalOverall) * 100) : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your productivity across all sections</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{totalOverall}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedOverall}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(analytics).reduce((sum, section) => sum + section.inProgressTasks, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{overallCompletionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const data = analytics[section.key as keyof typeof analytics];
          return (
            <div key={section.key} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-4 h-4 rounded ${section.color}`}></div>
                <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-medium">{data.totalTasks}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{data.completedTasks}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-medium text-blue-600">{data.inProgressTasks}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Todo</span>
                  <span className="font-medium text-orange-600">{data.todoTasks}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium text-purple-600">{data.completionRate}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${section.color}`}
                      style={{ width: `${data.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                
                {Object.keys(data.categoryBreakdown).length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Category Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(data.categoryBreakdown).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Analytics;