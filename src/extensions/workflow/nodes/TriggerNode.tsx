/**
 * Trigger Node Component
 * 
 * Starting point for workflow execution.
 * Supports manual, webhook, schedule, and event-based triggers.
 */

import React, { useState, useCallback } from 'react';
import type { Node, TriggerNodeConfig } from '../flowTypes';

interface TriggerNodeProps {
  node: Node;
  onUpdate: (updates: Partial<Node>) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

export const TriggerNode: React.FC<TriggerNodeProps> = ({
  node,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<TriggerNodeConfig>(
    (node.config as TriggerNodeConfig) || {
      triggerType: 'manual',
    }
  );

  const handleConfigChange = useCallback((updates: Partial<TriggerNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  }, [config, onUpdate]);

  const handleLabelChange = useCallback((newLabel: string) => {
    onUpdate({ label: newLabel });
  }, [onUpdate]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this trigger node?')) {
      onDelete();
    }
  }, [onDelete]);

  const triggerTypes = [
    { value: 'manual', label: 'Manual', description: 'Triggered manually by user' },
    { value: 'webhook', label: 'Webhook', description: 'Triggered by HTTP request' },
    { value: 'schedule', label: 'Schedule', description: 'Triggered on a schedule' },
    { value: 'event', label: 'Event', description: 'Triggered by system events' },
  ];

  return (
    <div
      className={`workflow-node workflow-node--trigger ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Trigger node: ${node.label}`}
    >
      {/* Node Header */}
      <div className="workflow-node__header">
        <div className="workflow-node__icon">🚀</div>
        {isEditing ? (
          <input
            type="text"
            value={node.label || ''}
            onChange={(e) => handleLabelChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            className="workflow-node__label-input"
            autoFocus
            aria-label="Node label"
          />
        ) : (
          <div
            className="workflow-node__label"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {node.label || 'Trigger'}
          </div>
        )}
        <button
          type="button"
          className="workflow-node__delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          aria-label="Delete node"
        >
          🗑️
        </button>
      </div>

      {/* Node Body */}
      <div className="workflow-node__body">
        <div className="workflow-node__config">
          <div className="workflow-node__field">
            <label htmlFor={`trigger-type-${node.id}`}>Trigger Type:</label>
            <select
              id={`trigger-type-${node.id}`}
              value={config.triggerType}
              onChange={(e) => handleConfigChange({ triggerType: e.target.value as any })}
              className="workflow-node__select"
              aria-label="Trigger type"
            >
              {triggerTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {config.triggerType === 'webhook' && (
            <div className="workflow-node__field">
              <label htmlFor={`webhook-url-${node.id}`}>Webhook URL:</label>
              <input
                id={`webhook-url-${node.id}`}
                type="url"
                value={config.webhookUrl || ''}
                onChange={(e) => handleConfigChange({ webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
                className="workflow-node__input"
                aria-label="Webhook URL"
              />
            </div>
          )}

          {config.triggerType === 'schedule' && (
            <div className="workflow-node__field">
              <label htmlFor={`schedule-${node.id}`}>Schedule:</label>
              <input
                id={`schedule-${node.id}`}
                type="text"
                value={config.schedule || ''}
                onChange={(e) => handleConfigChange({ schedule: e.target.value })}
                placeholder="0 0 * * *"
                className="workflow-node__input"
                aria-label="Schedule (cron expression)"
              />
              <div className="workflow-node__help">
                Cron expression: minute hour day month weekday
              </div>
            </div>
          )}

          {config.triggerType === 'event' && (
            <div className="workflow-node__field">
              <label htmlFor={`event-type-${node.id}`}>Event Type:</label>
              <input
                id={`event-type-${node.id}`}
                type="text"
                value={config.eventType || ''}
                onChange={(e) => handleConfigChange({ eventType: e.target.value })}
                placeholder="user.created"
                className="workflow-node__input"
                aria-label="Event type"
              />
            </div>
          )}
        </div>
      </div>

      {/* Node Ports */}
      <div className="workflow-node__ports">
        <div className="workflow-node__output-port" title="Trigger output" />
      </div>

      {/* Status Indicator */}
      {node.data?.status && (
        <div className={`workflow-node__status workflow-node__status--${node.data.status}`}>
          {node.data.status}
        </div>
      )}
    </div>
  );
};

export default TriggerNode;