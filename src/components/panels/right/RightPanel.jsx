import React from 'react';
import TaskList from './TaskList';
import TaskAutomation from './TaskAutomation';

const RightPanel = (props) => {
  const {
    tasksHeaderRef,
    completedTasks,
    totalTasks,
    inProgressTasks,
    handleAnalyzeDesign,
  } = props;

  return (
    <div className="panel right">
      <div className="panel-header" ref={tasksHeaderRef}>
        <div>
          <h4>Task List</h4>
          <p className="panel-subtitle">{completedTasks}/{totalTasks} done · {inProgressTasks} in progress</p>
        </div>
        <button type="button" className="panel-secondary" onClick={handleAnalyzeDesign}>
          Sync
        </button>
      </div>
      <div className="task-panel">
        <TaskAutomation {...props} />
        <TaskList {...props} />
      </div>
    </div>
  );
};

export default RightPanel;
