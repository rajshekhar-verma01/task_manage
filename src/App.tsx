import React, { useState } from 'react';
import Navigation from './components/Navigation';
import TaskSection from './components/TaskSection';
import Analytics from './components/Analytics';
import { useTaskManager } from './hooks/useTaskManager';

function App() {
  const [activeSection, setActiveSection] = useState('household');
  const { 
    tasks, 
    updateTask, 
    updateRecurringTask,
    updateTaskStatus, 
    updateSubGoalStatus,
    addCategory,
    removeCategory,
    getAnalytics 
  } = useTaskManager();

  const renderContent = () => {
    if (activeSection === 'analytics') {
      return <Analytics analytics={getAnalytics()} />;
    }

    const sectionData = tasks[activeSection as keyof typeof tasks];
    if (!sectionData) return null;

    return (
      <TaskSection
        sectionName={sectionData.name}
        sectionType={activeSection}
        tasks={sectionData.tasks}
        recurringTasks={sectionData.recurringTasks}
        categories={sectionData.categories}
        onTaskUpdate={(task) => updateTask(activeSection, task)}
        onRecurringTaskUpdate={(task) => updateRecurringTask(activeSection, task)}
        onTaskStatusChange={(taskId, status) => updateTaskStatus(activeSection, taskId, status)}
        onSubGoalStatusChange={(taskId, subGoalId, status) => updateSubGoalStatus(activeSection, taskId, subGoalId, status)}
        onAddCategory={(category) => addCategory(activeSection, category)}
        onRemoveCategory={(category) => removeCategory(activeSection, category)}
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;