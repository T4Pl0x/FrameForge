import React from 'react';

export default function ModelPicker({
  models,
  value,
  onChange,
  isLoading,
  onRefresh,
  error,
  updatedAt,
  recommendedModel,
}) {
  return (
    <div className="chat-settings__model-row">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || models.length === 0}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="panel-icon-button"
        onClick={onRefresh}
        disabled={isLoading}
        title={updatedAt ? `Last updated: ${updatedAt.toLocaleTimeString()}` : 'Refresh models'}
      >
        {isLoading ? '...' : '↻'}
      </button>
    </div>
  );
}
