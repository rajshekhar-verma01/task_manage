import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, X } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationConfig {
  enabled: boolean;
  interval: number; // in minutes
}

interface NotificationSettings {
  household: NotificationConfig;
  personal: NotificationConfig;
  official: NotificationConfig;
  blog: NotificationConfig;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    household: { enabled: false, interval: 30 },
    personal: { enabled: false, interval: 30 },
    official: { enabled: false, interval: 30 },
    blog: { enabled: false, interval: 30 },
  });

  const [isLoading, setIsLoading] = useState(false);

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
          setSettings(savedSettings);
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

  const updateSectionSetting = (sectionId: string, field: keyof NotificationConfig, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId as keyof NotificationSettings],
        [field]: value,
      },
    }));
  };

  const intervalOptions = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
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
          <p className="text-sm text-blue-700">
            Get notified about due tasks at regular intervals. Notifications will appear even when the app is minimized.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionSettings = settings[section.id as keyof NotificationSettings];
            return (
              <div key={section.id} className="border rounded-lg p-4">
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
                  <div className="ml-7">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <label className="text-sm text-gray-700">Notification interval:</label>
                      <select
                        value={sectionSettings.interval}
                        onChange={(e) => updateSectionSetting(section.id, 'interval', parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {intervalOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-7">
                      You'll be notified every {sectionSettings.interval} minutes about due tasks in this section
                    </p>
                  </div>
                )}
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