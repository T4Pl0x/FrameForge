import React from 'react';

const TaskList = ({
  tasks,
  taskInput,
  setTaskInput,
  handleAddTask,
  handleToggleTask,
  handleDeleteTask,
}) => {
  return (
    <>
      <div className="task-create">
        <input
          type="text"
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          placeholder="Capture a new to-do"
        />
        <button type="button" onClick={handleAddTask} disabled={!taskInput.trim()}>
          Add
        </button>
      </div>
      <div className="task-list">
        {tasks.length === 0 && (
          <div className="task-empty">No tasks yet. Ask the chat for suggestions or add one manually.</div>
        )}
        {tasks.map(task => (
          <div key={task.id} className={`task-item task-item--${task.status}`}>
            <label>
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() => handleToggleTask(task.id)}
              />
              <div>
                <span className="task-title">{task.title}</span>
                <span className="task-meta">{task.category || 'General'} · {task.status.replace('-', ' ')}</span>
              </div>
            </label>
            <div className="task-actions">
              <button type="button" onClick={() => handleToggleTask(task.id)} title="Advance status">
                ↻
              </button>
              <button type="button" onClick={() => handleDeleteTask(task.id)} title="Remove task">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TaskList;
