import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

// Map app graph -> React Flow nodes/edges
const toFlow = (graph) => {
  const nodes = (graph.nodes || []).map((n, idx) => ({
    id: n.id,
    position: n.position || { x: 120 + (idx * 40), y: 80 + (idx * 20) },
    data: { label: n.name || n.type || n.id },
    type: 'default',
  }));
  const edges = (graph.edges || []).map((e) => ({
    id: e.id,
    source: e.source || e.from,
    target: e.target || e.to,
    label: e.kind,
    animated: e.kind === 'event',
  }));
  return { nodes, edges };
};

// Map React Flow -> app graph
const fromFlow = (nodes, edges, prev) => ({
  nodes: nodes.map((n) => ({
    id: n.id,
    type: prev.nodes?.find(p => p.id === n.id)?.type || 'service',
    name: n.data?.label || prev.nodes?.find(p => p.id === n.id)?.name || n.id,
    position: n.position,
    props: prev.nodes?.find(p => p.id === n.id)?.props || {},
  })),
  edges: edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    kind: typeof e.label === 'string' ? e.label : (prev.edges?.find(p => p.id === e.id)?.kind || 'request'),
    metadata: prev.edges?.find(p => p.id === e.id)?.metadata || {},
  })),
});

export default function WorkflowEditor({ backendGraph, onChange }) {
  const initial = useMemo(() => toFlow(backendGraph || { nodes: [], edges: [] }), [backendGraph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    // When backendGraph changes outside, reset flow (basic sync)
    const next = toFlow(backendGraph || { nodes: [], edges: [] });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [backendGraph, setNodes, setEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params }, eds)), [setEdges]);

  // Persist back to app graph (debounced by ReactFlow’s internal batching)
  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(fromFlow(nodes, edges, backendGraph || { nodes: [], edges: [] }));
    }
  }, [nodes, edges]);

  const addNode = (type) => {
    const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    setNodes((nds) => ([...nds, {
      id,
      position: { x: 120 + (nds.length * 20), y: 120 + (nds.length * 10) },
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
      type: 'default',
    }]));
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ width: 160, borderRight: '1px solid var(--panel-border)', background: 'var(--panel-bg)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <strong style={{ fontSize: 12 }}>Nodes</strong>
        {['api', 'service', 'db', 'queue', 'fn'].map((t) => (
          <button key={t} className="panel-icon-button" style={{ justifyContent: 'flex-start' }} onClick={() => addNode(t)}>
            + {t.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

WorkflowEditor.propTypes = {
  backendGraph: PropTypes.shape({ nodes: PropTypes.array, edges: PropTypes.array }),
  onChange: PropTypes.func,
};
