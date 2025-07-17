import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, X, ChevronDown, ChevronRight } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryNotificationConfig {
  enabled: boolean;
  interval: number;
  unit: 'minutes' | 'hours';
}

interface NotificationConfig {
  enabled: boolean;
  interval: number;
  unit: 'minutes' | 'hours';
  categories: { [categoryName: string]: CategoryNotificationConfig };
}

interface NotificationSettings {
  household: NotificationConfig;
  personal: NotificationConfig;
  official: NotificationConfig;
  blog: NotificationConfig;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    household: { 
      enabled: false, 
      interval: 30, 
      unit: 'minutes',
      categories: {}
    },
    personal: { 
      enabled: false, 
      interval: 30, 
      unit: 'minutes',
      categories: {}
    },
    official: { 
      enabled: false, 
      interval: 30, 
      unit: 'minutes',
      categories: {}
    },
    blog: { 
      enabled: false, 
      interval: 30, 
      unit: 'minutes',
      categories: {}
    },
  });

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{ [key: string]: string[] }>({
    household: ['Cleaning', 'Maintenance', 'Shopping', 'Cooking'],
    personal: ['Learning', 'Exercise', 'Reading', 'Class', 'Skill Building'],
    official: ['Meetings', 'Projects', 'Reports', 'Planning', 'Communication'],
    blog: ['Writing', 'Research', 'Editing', 'Publishing', 'Marketing'],
  });

  const sections = [
    { id: 'household', name: 'Household', color: 'bg-green-500' },
    { id: 'personal', name: 'Personal Development', color: 'bg-blue-500' },
    { id: 'official', name: 'Official Work', color: 'bg-purple-500' },
    { id: 'blog', name: 'Blog', color: 'bg-orange-500' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.loadNotificationSettings();
        if (savedSettings && Object.keys(savedSettings).length > 0) {
          // Migrate old settings format to new format
          const migratedSettings = { ...settings };
          Object.keys(savedSettings).forEach(sectionId => {
            const sectionSettings = savedSettings[sectionId];
            if (sectionSettings) {
              migratedSettings[sectionId as keyof NotificationSettings] = {
                enabled: sectionSettings.enabled || false,
                interval: sectionSettings.interval || 30,
                unit: sectionSettings.unit || 'minutes',
                categories: sectionSettings.categories || {}
              };
            }
          });
          setSettings(migratedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveNotificationSettings(settings);
        console.log('Notification settings saved successfully');
      } else {
        // Fallback for web version
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
      }
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSectionSetting = (sectionId: string, field: keyof NotificationConfig, value: boolean | number | string) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId as keyof NotificationSettings],
        [field]: value,
      },
    }));
  };

  const updateCategorySetting = (sectionId: string, categoryName: string, field: keyof CategoryNotificationConfig, value: boolean | number | string) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId as keyof NotificationSettings],
        categories: {
          ...prev[sectionId as keyof NotificationSettings].categories,
          [categoryName]: {
            ...prev[sectionId as keyof NotificationSettings].categories[categoryName] || { enabled: false, interval: 30, unit: 'minutes' },
            [field]: value,
          }
        }
      },
    }));
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getIntervalInMinutes = (interval: number, unit: 'minutes' | 'hours') => {
    return unit === 'hours' ? interval * 60 : interval;
  };

  const formatInterval = (interval: number, unit: 'minutes' | 'hours') => {
    return `${interval} ${unit}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Desktop Notifications</h3>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            Get notified about due tasks at regular intervals. Notifications will appear even when the app is minimized.
          </p>
          <p className="text-sm text-blue-600">
            <strong>Priority:</strong> Category-level settings override section-level settings. If no category setting is configured, the section setting will be used.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionSettings = settings[section.id as keyof NotificationSettings];
            const isExpanded = expandedSections[section.id];
            const categories = availableCategories[section.id] || [];
            
            return (
              <div key={section.id} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${section.color}`}></div>
                      <h3 className="font-semibold text-gray-800">{section.name}</h3>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sectionSettings.enabled}
                        onChange={(e) => updateSectionSetting(section.id, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Enable notifications</span>
                    </label>
                  </div>

                  {sectionSettings.enabled && (
                    <div className="ml-7 mb-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <label className="text-sm text-gray-700">Section-level interval:</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={sectionSettings.interval}
                            onChange={(e) => updateSectionSetting(section.id, 'interval', parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <select
                            value={sectionSettings.unit}
                            onChange={(e) => updateSectionSetting(section.id, 'unit', e.target.value as 'minutes' | 'hours')}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        Default notification every {formatInterval(sectionSettings.interval, sectionSettings.unit)} for this section
                      </p>
                    </div>
                  )}

                  {sectionSettings.enabled && categories.length > 0 && (
                    <div className="ml-7">
                      <button
                        onClick={() => toggleSectionExpansion(section.id)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Category-specific settings ({categories.length} categories)</span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-3 ml-6 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-3">
                            Configure different notification intervals for specific categories. Leave unchecked to use section-level settings.
                          </p>
                          {categories.map((categoryName) => {
                            const categorySettings = sectionSettings.categories[categoryName] || { 
                              enabled: false, 
                              interval: 30, 
                              unit: 'minutes' as const 
                            };
                            
                            return (
                              <div key={categoryName} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-700">{categoryName}</span>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={categorySettings.enabled}
                                      onChange={(e) => updateCategorySetting(section.id, categoryName, 'enabled', e.target.checked)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Custom interval</span>
                                  </label>
                                </div>

                                {categorySettings.enabled && (
                                  <div className="ml-4">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={categorySettings.interval}
                                        onChange={(e) => updateCategorySetting(section.id, categoryName, 'interval', parseInt(e.target.value) || 1)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                      />
                                      <select
                                        value={categorySettings.unit}
                                        onChange={(e) => updateCategorySetting(section.id, categoryName, 'unit', e.target.value as 'minutes' | 'hours')}
                                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                      >
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                      </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Notify every {formatInterval(categorySettings.interval, categorySettings.unit)} for {categoryName} tasks
                                    </p>
                                  </div>
                                )}

                                {!categorySettings.enabled && (
                                  <p className="text-xs text-gray-500 ml-4">
                                    Using section default: {formatInterval(sectionSettings.interval, sectionSettings.unit)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Startup Popup</h4>
          <p className="text-sm text-yellow-700">
            When you start the application, you'll automatically see a popup with all tasks due today that haven't been completed yet.
          </p>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;