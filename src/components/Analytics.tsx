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
    { key: 'blog', name: 'Blog & Learning', color: 'bg-orange-500' },
  ];

  const totalOverall = Object.entries(analytics).reduce((sum, [key, section]) => {
    return sum + (key === 'blog' ? (section as BlogAnalytics).totalEntries : (section as AnalyticsType).totalTasks);
  }, 0);
  const completedOverall = Object.entries(analytics).reduce((sum, [key, section]) => {
    return sum + (key === 'blog' ? (section as BlogAnalytics).expertEntries : (section as AnalyticsType).completedTasks);
  }, 0);
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
              <p className="text-sm text-gray-600">Total Items</p>
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
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.entries(analytics).reduce((sum, [key, section]) => {
                  return sum + (key === 'blog' ? (section as BlogAnalytics).readingEntries + (section as BlogAnalytics).practicedEntries : (section as AnalyticsType).inProgressTasks);
                }, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">{overallCompletionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const data = analytics[section.key as keyof typeof analytics] as AnalyticsType | BlogAnalytics;
          const isBlog = section.key === 'blog';
          const blogData = isBlog ? data as BlogAnalytics : null;
          return (
            <div key={section.key} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-4 h-4 rounded ${section.color}`}></div>
                <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{isBlog ? 'Total Entries' : 'Total Tasks'}</span>
                  <span className="font-medium">{isBlog ? blogData!.totalEntries : (data as AnalyticsType).totalTasks}</span>
                </div>
                
                {isBlog ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">To Read</span>
                      <span className="font-medium text-gray-600">{blogData!.toReadEntries}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reading</span>
                      <span className="font-medium text-yellow-600">{blogData!.readingEntries}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Practiced</span>
                      <span className="font-medium text-blue-600">{blogData!.practicedEntries}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expert</span>
                      <span className="font-medium text-green-600">{blogData!.expertEntries}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="font-medium text-green-600">{(data as AnalyticsType).completedTasks}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <span className="font-medium text-blue-600">{(data as AnalyticsType).inProgressTasks}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Todo</span>
                      <span className="font-medium text-orange-600">{(data as AnalyticsType).todoTasks}</span>
                    </div>
                  </>
                )}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{isBlog ? 'Expertise Rate' : 'Completion Rate'}</span>
                    <span className="font-medium text-purple-600">{isBlog ? blogData!.completionRate : (data as AnalyticsType).completionRate}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${section.color}`}
                      style={{ width: `${isBlog ? blogData!.completionRate : (data as AnalyticsType).completionRate}%` }}
                    ></div>
                  </div>
                </div>
                
                {Object.keys(isBlog ? blogData!.categoryBreakdown : (data as AnalyticsType).categoryBreakdown).length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Category Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(isBlog ? blogData!.categoryBreakdown : (data as AnalyticsType).categoryBreakdown).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isBlog && Object.keys(blogData!.statusBreakdown).length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(blogData!.statusBreakdown).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{status.replace('-', ' ')}</span>
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