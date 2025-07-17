import React, { useState } from 'react';
import TaskDashboard from './components/TaskDashboard';
import { useTaskManager } from './hooks/useTaskManager';

function App() {
  const { 
    tasks, 
    updateTask, 
    updateTaskStatus, 
    updateSubGoalStatus,
    addCategory,
    removeCategory,
    getAnalytics 
  } = useTaskManager();

  return (
    <div className="min-h-screen bg-gray-50">
      <TaskDashboard
        tasks={tasks}
        onTaskUpdate={updateTask}
        onTaskStatusChange={updateTaskStatus}
        onSubGoalStatusChange={updateSubGoalStatus}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
        analytics={getAnalytics()}
      />
    </div>
  );
}

export default App;