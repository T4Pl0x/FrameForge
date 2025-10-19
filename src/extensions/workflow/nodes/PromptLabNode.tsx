/**
 * PromptLab Node Component (Placeholder)
 * 
 * Placeholder implementation for Slice 1.
 * Integrates with Prompt Lab scaffold to generate prompt packs.
 */

import React, { useState, useCallback } from 'react';
import type { Node, PromptLabNodeConfig } from '../flowTypes';

interface PromptLabNodeProps {
  node: Node;
  onUpdate: (updates: Partial<Node>) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

export const PromptLabNode: React.FC<PromptLabNodeProps> = ({
  node,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<PromptLabNodeConfig>(
    (() => {
      const nodeConfig = node.config as unknown;
      if (nodeConfig && typeof nodeConfig === 'object' && 'promptType' in nodeConfig) {
        return nodeConfig as PromptLabNodeConfig;
      }
      return {
        promptType: 'generation',
        maxLength: 1200,
      };
    })()
  );

  const handleConfigChange = useCallback((updates: Partial<PromptLabNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdate({ config: newConfig as Record<string, unknown> });
  }, [config, onUpdate]);

  const handleLabelChange = useCallback((newLabel: string) => {
    onUpdate({ label: newLabel });
  }, [onUpdate]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this PromptLab node?')) {
      onDelete();
    }
  }, [onDelete]);

  const promptTypes = [
    { value: 'analysis', label: 'Analysis', description: 'Analyze existing content' },
    { value: 'generation', label: 'Generation', description: 'Generate new content' },
    { value: 'refinement', label: 'Refinement', description: 'Refine existing content' },
  ];

  return (
    <div
      className={`workflow-node workflow-node--promptlab ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`PromptLab node: ${node.label}`}
    >
      {/* Node Header */}
      <div className="workflow-node__header">
        <div className="workflow-node__icon">🧪</div>
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
            {node.label || 'Prompt Lab'}
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
            <label htmlFor={`prompt-type-${node.id}`}>Prompt Type:</label>
            <select
              id={`prompt-type-${node.id}`}
              value={config.promptType}
              onChange={(e) => handleConfigChange({ promptType: e.target.value as any })}
              className="workflow-node__select"
              aria-label="Prompt type"
            >
              {promptTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow-node__field">
            <label htmlFor={`max-length-${node.id}`}>Max Length:</label>
            <input
              id={`max-length-${node.id}`}
              type="number"
              value={config.maxLength || 1200}
              onChange={(e) => handleConfigChange({ maxLength: parseInt(e.target.value, 10) })}
              min="1"
              max="5000"
              className="workflow-node__input"
              aria-label="Maximum prompt length"
            />
          </div>

          <div className="workflow-node__field">
            <label htmlFor={`template-${node.id}`}>Template:</label>
            <textarea
              id={`template-${node.id}`}
              value={config.template || ''}
              onChange={(e) => handleConfigChange({ template: e.target.value })}
              placeholder="Enter prompt template..."
              rows={3}
              className="workflow-node__textarea"
              aria-label="Prompt template"
            />
          </div>

          <div className="workflow-node__placeholder">
            <div className="workflow-node__placeholder-title">🚧 Under Construction</div>
            <div className="workflow-node__placeholder-description">
              This node will integrate with the Prompt Lab to generate AI prompts.
              Full implementation coming in the next slice.
            </div>
          </div>
        </div>
      </div>

      {/* Node Ports */}
      <div className="workflow-node__ports">
        <div className="workflow-node__input-port" title="Input data" />
        <div className="workflow-node__output-port" title="Generated prompts" />
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

export default PromptLabNode;