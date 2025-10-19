/**
 * Edge Layer Component
 * 
 * Renders workflow edges and handles mouse-based edge creation.
 * Provides visual feedback and coordinates with the edge store.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Edge, Node, Flow } from '../flowTypes';
import { edgeStore, type EdgeValidationResult } from './edgeStore';
import { useA11yLive } from '../../ui-creator/hooks/useA11yLive';

interface EdgeLayerProps {
  flow: Flow;
  onFlowChange: (flow: Flow) => void;
  selectedEdges: Set<string>;
  onEdgeSelect: (edgeId: string | null) => void;
  nodes: Node[];
}

interface DragState {
  isDragging: boolean;
  startNodeId?: string;
  startPortType?: 'input' | 'output';
  currentPosition?: { x: number; y: number };
  targetNodeId?: string;
  targetPortType?: 'input' | 'output';
}

interface PortElement {
  nodeId: string;
  portType: 'input' | 'output';
  element: Element;
  rect: DOMRect;
}

/**
 * EdgeLayer Component
 */
export const EdgeLayer: React.FC<EdgeLayerProps> = ({
  flow,
  onFlowChange,
  selectedEdges,
  onEdgeSelect,
  nodes,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false });
  const [hoveredPort, setHoveredPort] = useState<PortElement | null>(null);
  const [ports, setPorts] = useState<Map<string, PortElement>>(new Map());
  const { announce } = useA11yLive();

  // Update ports when nodes change
  useEffect(() => {
    const portMap = new Map<string, PortElement>();

    nodes.forEach(node => {
      // Find output ports
      const outputPorts = document.querySelectorAll(
        `[data-node-id="${node.id}"] .workflow-node__output-port`
      );
      outputPorts.forEach((port, index) => {
        const rect = port.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          portMap.set(`${node.id}-output-${index}`, {
            nodeId: node.id,
            portType: 'output',
            element: port,
            rect: {
              ...rect,
              x: rect.left - svgRect.left,
              y: rect.top - svgRect.top,
            } as DOMRect,
          });
        }
      });

      // Find input ports
      const inputPorts = document.querySelectorAll(
        `[data-node-id="${node.id}"] .workflow-node__input-port`
      );
      inputPorts.forEach((port, index) => {
        const rect = port.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          portMap.set(`${node.id}-input-${index}`, {
            nodeId: node.id,
            portType: 'input',
            element: port,
            rect: {
              ...rect,
              x: rect.left - svgRect.left,
              y: rect.top - svgRect.top,
            } as DOMRect,
          });
        }
      });
    });

    setPorts(portMap);
  }, [nodes]);

  // Handle mouse down on port
  const handlePortMouseDown = useCallback((
    nodeId: string,
    portType: 'input' | 'output',
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const startPosition = {
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top,
    };

    setDragState({
      isDragging: true,
      startNodeId: nodeId,
      startPortType: portType,
      currentPosition: startPosition,
    });

    announce(`Started connection from ${portType} port of ${getNodeLabel(nodeId)}`);
  }, [announce]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const currentPosition = {
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top,
    };

    setDragState(prev => ({
      ...prev,
      currentPosition,
    }));

    // Check if hovering over a port
    let foundPort: PortElement | null = null;
    for (const [portId, port] of ports) {
      if (
        port.nodeId !== dragState.startNodeId &&
        port.portType !== dragState.startPortType &&
        currentPosition.x >= port.rect.left &&
        currentPosition.x <= port.rect.right &&
        currentPosition.y >= port.rect.top &&
        currentPosition.y <= port.rect.bottom
      ) {
        foundPort = port;
        break;
      }
    }

    setHoveredPort(foundPort);
  }, [dragState.isDragging, dragState.startNodeId, dragState.startPortType, ports]);

  // Handle mouse up to complete connection
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.startNodeId || !dragState.startPortType) {
      setDragState({ isDragging: false });
      setHoveredPort(null);
      return;
    }

    if (hoveredPort && hoveredPort.nodeId !== dragState.startNodeId) {
      // Validate connection direction (output to input)
      const fromNodeId = dragState.startPortType === 'output' ? dragState.startNodeId : hoveredPort.nodeId;
      const toNodeId = dragState.startPortType === 'output' ? hoveredPort.nodeId : dragState.startNodeId;

      if (dragState.startPortType === 'output' && hoveredPort.portType === 'input') {
        // Valid connection
        createEdge(fromNodeId, toNodeId);
      } else {
        announce('Invalid connection: must connect output port to input port');
      }
    }

    // Reset drag state
    setDragState({ isDragging: false });
    setHoveredPort(null);
  }, [dragState, hoveredPort, announce]);

  // Create edge
  const createEdge = useCallback((fromNodeId: string, toNodeId: string) => {
    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newEdge: Edge = {
      id: edgeId,
      from: fromNodeId,
      to: toNodeId,
    };

    // Validate with edge store
    const validation = edgeStore.wouldCreateCycle(fromNodeId, toNodeId, nodes)
      ? { isValid: false, error: 'Connection would create a cycle' }
      : edgeStore.addEdge(newEdge);

    if (validation.isValid) {
      // Add edge to flow
      const updatedFlow: Flow = {
        ...flow,
        edges: [...flow.edges, newEdge],
        meta: {
          ...flow.meta,
          updatedAt: new Date().toISOString(),
        },
      };

      onFlowChange(updatedFlow);
      announce(`Connected ${getNodeLabel(fromNodeId)} to ${getNodeLabel(toNodeId)}`);
    } else {
      announce(`Connection failed: ${validation.error}`);
    }
  }, [flow, nodes, onFlowChange, announce]);

  // Get node label for announcements
  const getNodeLabel = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.label || node?.type || 'Unknown Node';
  };

  // Calculate edge path
  const calculateEdgePath = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
      // Short distance - straight line
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    } else {
      // Longer distance - curved path
      const controlPoint1 = {
        x: from.x + dx * 0.25,
        y: from.y + dy * 0.1,
      };
      const controlPoint2 = {
        x: from.x + dx * 0.75,
        y: from.y + dy * 0.9,
      };
      return `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;
    }
  }, []);

  // Get port position
  const getPortPosition = useCallback((portId: string): { x: number; y: number } | null => {
    const port = ports.get(portId);
    if (!port) return null;

    return {
      x: port.rect.left + port.rect.width / 2,
      y: port.rect.top + port.rect.height / 2,
    };
  }, [ports]);

  // Set up global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Handle edge selection
  const handleEdgeClick = useCallback((edgeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onEdgeSelect(edgeId);
  }, [onEdgeSelect]);

  // Handle edge deletion
  const handleEdgeDelete = useCallback((edgeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const updatedFlow: Flow = {
      ...flow,
      edges: flow.edges.filter(edge => edge.id !== edgeId),
      meta: {
        ...flow.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    onFlowChange(updatedFlow);
    edgeStore.removeEdge(edgeId);
    announce('Edge deleted');
  }, [flow, onFlowChange, announce]);

  return (
    <svg
      ref={svgRef}
      className="workflow-edge-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      role="presentation"
      aria-label="Workflow connections"
    >
      {/* Render existing edges */}
      {flow.edges.map(edge => {
        const fromPortId = `${edge.from}-output-0`;
        const toPortId = `${edge.to}-input-0`;
        const fromPos = getPortPosition(fromPortId);
        const toPos = getPortPosition(toPortId);

        if (!fromPos || !toPos) return null;

        const path = calculateEdgePath(fromPos, toPos);
        const isSelected = selectedEdges.has(edge.id);

        return (
          <g key={edge.id}>
            <path
              d={path}
              fill="none"
              stroke={isSelected ? '#3B82F6' : '#6B7280'}
              strokeWidth={isSelected ? 3 : 2}
              style={{ pointerEvents: 'stroke' }}
              onClick={(e) => handleEdgeClick(edge.id, e)}
              className="workflow-edge"
              role="button"
              tabIndex={0}
              aria-label={`Connection from ${getNodeLabel(edge.from)} to ${getNodeLabel(edge.to)}`}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  handleEdgeDelete(edge.id, e as any);
                }
              }}
            />
            {isSelected && (
              <circle
                cx={fromPos.x}
                cy={fromPos.y}
                r="4"
                fill="#3B82F6"
                style={{ pointerEvents: 'none' }}
              />
            )}
            {isSelected && (
              <circle
                cx={toPos.x}
                cy={toPos.y}
                r="4"
                fill="#3B82F6"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        );
      })}

      {/* Render drag line */}
      {dragState.isDragging && dragState.startNodeId && dragState.currentPosition && (
        <path
          d={calculateEdgePath(
            getPortPosition(`${dragState.startNodeId}-${dragState.startPortType}-0`) || { x: 0, y: 0 },
            dragState.currentPosition
          )}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeDasharray="5,5"
          style={{ pointerEvents: 'none' }}
          className="workflow-edge--dragging"
        />
      )}

      {/* Highlight hovered port */}
      {hoveredPort && (
        <circle
          cx={hoveredPort.rect.left + hoveredPort.rect.width / 2}
          cy={hoveredPort.rect.top + hoveredPort.rect.height / 2}
          r="8"
          fill="#3B82F6"
          fillOpacity="0.3"
          stroke="#3B82F6"
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Port click handlers (invisible overlays) */}
      {Array.from(ports.entries()).map(([portId, port]) => (
        <rect
          key={portId}
          x={port.rect.left - 5}
          y={port.rect.top - 5}
          width={port.rect.width + 10}
          height={port.rect.height + 10}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
          onMouseDown={(e) => handlePortMouseDown(port.nodeId, port.portType, e)}
          className="workflow-port-hitbox"
          role="button"
          tabIndex={0}
          aria-label={`${port.portType} port of ${getNodeLabel(port.nodeId)}`}
        />
      ))}
    </svg>
  );
};

export default EdgeLayer;