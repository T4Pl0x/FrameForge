/**
 * Workflow FlowCanvas Component
 * 
 * Minimal skeleton implementation for Slice 1.
 * Provides node palette, droppable canvas, and basic interaction.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Flow, Node, Edge, NodeType, WorkflowPanelProps } from './flowTypes';
import { useGridSnap } from '../../ui-creator/GridSnap';
import { useA11yLive } from '../../ui-creator/hooks/useA11yLive';

// Node palette configuration
const NODE_PALETTE: Array<{
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    type: 'Trigger',
    label: 'Trigger',
    icon: '🚀',
    color: '#10B981',
    description: 'Start workflow execution',
  },
  {
    type: 'PromptLab',
    label: 'Prompt Lab',
    icon: '🧪',
    color: '#3B82F6',
    description: 'Generate AI prompts',
  },
  {
    type: 'UIAgent',
    label: 'UI Agent',
    icon: '🤖',
    color: '#8B5CF6',
    description: 'Modify UI elements',
  },
  {
    type: 'Guardrail',
    label: 'Guardrail',
    icon: '🛡️',
    color: '#F59E0B',
    description: 'Validate and filter content',
  },
  {
    type: 'Tool',
    label: 'Tool',
    icon: '🔧',
    color: '#6B7280',
    description: 'External API calls',
  },
  {
    type: 'Compiler',
    label: 'Compiler',
    icon: '⚙️',
    color: '#EF4444',
    description: 'Build and compile',
  },
  {
    type: 'Sandbox',
    label: 'Sandbox',
    icon: '📦',
    color: '#06B6D4',
    description: 'Execute in isolation',
  },
  {
    type: 'Publisher',
    label: 'Publisher',
    icon: '📤',
    color: '#84CC16',
    description: 'Publish results',
  },
];

/**
 * WorkflowPanel Component
 */
export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  flow,
  onFlowChange,
  onNodeSelect,
  onEdgeSelect,
  selectedNodes,
  selectedEdges,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSnap = useGridSnap({ gridSize: 16, showGrid: true, snapToGrid: true });
  const { announce } = useA11yLive();

  // Handle drag start from palette
  const handlePaletteDragStart = useCallback((nodeType: NodeType) => {
    setDraggedNodeType(nodeType);
    setIsDragging(true);
    announce(`Started dragging ${nodeType} node`);
  }, [announce]);

  // Handle drag over canvas
  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

    // Snap to grid
    const snappedPos = gridSnap.snapPoint(x, y);

    // Create new node
    const newNode: Node = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: draggedNodeType,
      label: `${draggedNodeType} Node`,
      pos: snappedPos,
      data: {
        status: 'idle',
      },
    };

    // Update flow via proposal system
    const updatedFlow: Flow = {
      ...flow,
      nodes: [...flow.nodes, newNode],
      meta: {
        ...flow.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    onFlowChange(updatedFlow);
    announce(`Added ${draggedNodeType} node to canvas`);

    // Reset drag state
    setDraggedNodeType(null);
    setIsDragging(false);
  }, [draggedNodeType, flow, gridSnap, viewport, onFlowChange, announce]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Ignore typing in inputs
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedNodes.size > 0) {
            event.preventDefault();
            const updatedNodes = flow.nodes.filter(node => !selectedNodes.has(node.id));
            const updatedFlow: Flow = {
              ...flow,
              nodes: updatedNodes,
              meta: {
                ...flow.meta,
                updatedAt: new Date().toISOString(),
              },
            };
            onFlowChange(updatedFlow);
            announce(`Deleted ${selectedNodes.size} node(s)`);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onNodeSelect(null);
          onEdgeSelect(null);
          announce('Cleared selection');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flow, selectedNodes, onFlowChange, onNodeSelect, onEdgeSelect, announce]);

  return (
    <div className="workflow-panel">
      {/* Header */}
      <div className="workflow-panel__header">
        <h2 className="workflow-panel__title">{flow.name}</h2>
        <div className="workflow-panel__actions">
          <button
            type="button"
            className="workflow-panel__button"
            onClick={() => console.log('Compile workflow')}
            aria-label="Compile workflow"
          >
            🔨 Compile
          </button>
          <button
            type="button"
            className="workflow-panel__button"
            onClick={() => console.log('Debug workflow')}
            aria-label="Debug workflow"
          >
            🐛 Debug
          </button>
        </div>
      </div>

      <div className="workflow-panel__content">
        {/* Node Palette */}
        <div className="workflow-palette">
          <h3 className="workflow-palette__title">Nodes</h3>
          <div className="workflow-palette__nodes">
            {NODE_PALETTE.map((nodeType) => (
              <div
                key={nodeType.type}
                className="workflow-palette__node"
                draggable
                onDragStart={() => handlePaletteDragStart(nodeType.type)}
                role="button"
                tabIndex={0}
                aria-label={`Drag ${nodeType.label} node`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePaletteDragStart(nodeType.type);
                  }
                }}
              >
                <div
                  className="workflow-palette__node-icon"
                  style={{ backgroundColor: nodeType.color }}
                >
                  {nodeType.icon}
                </div>
                <div className="workflow-palette__node-info">
                  <div className="workflow-palette__node-label">{nodeType.label}</div>
                  <div className="workflow-palette__node-description">{nodeType.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="workflow-canvas"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
          role="application"
          aria-label="Workflow canvas"
        >
          {/* Grid background */}
          <div
            className="workflow-canvas__grid"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${gridSnap.options.gridSize}px ${gridSnap.options.gridSize}px`,
            }}
          />

          {/* Render existing nodes */}
          {flow.nodes.map((node) => (
            <div
              key={node.id}
              className={`workflow-node ${selectedNodes.has(node.id) ? 'selected' : ''}`}
              style={{
                left: node.pos.x,
                top: node.pos.y,
              }}
              onClick={() => onNodeSelect(node.id)}
              role="button"
              tabIndex={0}
              aria-label={`${node.label} node, type ${node.type}`}
            >
              <div className="workflow-node__header">
                <div className="workflow-node__icon">
                  {NODE_PALETTE.find(n => n.type === node.type)?.icon}
                </div>
                <div className="workflow-node__label">{node.label}</div>
              </div>
              <div className="workflow-node__ports">
                <div className="workflow-node__input-port" />
                <div className="workflow-node__output-port" />
              </div>
            </div>
          ))}

          {/* Drop indicator */}
          {isDragging && (
            <div className="workflow-canvas__drop-indicator">
              Drop node here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPanel;