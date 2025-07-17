import React from 'react';
import { Home, Users, Briefcase, PenTool, BarChart3, Bell } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onNotificationSettings: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange, onNotificationSettings }) => {
  const sections = [
    { id: 'household', name: 'Household', icon: Home, color: 'bg-green-500' },
    { id: 'personal', name: 'Personal Dev', icon: Users, color: 'bg-blue-500' },
    { id: 'official', name: 'Official Work', icon: Briefcase, color: 'bg-purple-500' },
    { id: 'blog', name: 'Blog', icon: PenTool, color: 'bg-orange-500' },
  ];

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">TaskFlow Pro</h1>
        <p className="text-sm text-gray-600">Manage your life efficiently</p>
      </div>
      
      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-gray-100 border-l-4 border-blue-500 text-blue-600'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${section.color} bg-opacity-20`}>
                <Icon className={`w-5 h-5 ${activeSection === section.id ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <span className="font-medium">{section.name}</span>
            </button>
          );
        })}
        
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onSectionChange('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeSection === 'analytics'
                ? 'bg-gray-100 border-l-4 border-blue-500 text-blue-600'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-indigo-500 bg-opacity-20">
              <BarChart3 className={`w-5 h-5 ${activeSection === 'analytics' ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <span className="font-medium">Analytics</span>
          </button>
          
          <button
            onClick={onNotificationSettings}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50 text-gray-700 mt-2"
          >
            <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-20">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-medium">Notifications</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;