import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  // Flow state
  const initial = useMemo(() => toFlow(backendGraph || { nodes: [], edges: [] }), [backendGraph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  // Symmetric gating for changes and camera movement
  const rafGate = useRef(0);
  const moveGate = useRef(0);
  const batchMsRef = useRef(16); // ~60fps
  const moveMsRef = useRef(24);  // slightly looser for panning
  const idleHandle = useRef(null);
  const heavyRef = useRef((import.meta?.env?.VITE_EXPOSE_DEV === '1') && (typeof localStorage !== 'undefined' ? localStorage.getItem('wf_heavy') === '1' : false));
  const runHeavy = useCallback((fn) => {
    if (typeof fn !== 'function') return;
    try {
      const hv = localStorage.getItem('wf_heavy');
      if (hv !== null) heavyRef.current = (hv === '1');
    } catch {}
    if (!heavyRef.current) { try { fn(); } catch {} return; }
    if (idleHandle.current) return;
    const ric = (typeof window !== 'undefined' && (window.requestIdleCallback || null));
    const cancelRic = (typeof window !== 'undefined' && (window.cancelIdleCallback || null));
    const shim = (cb, opts) => setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 50 }), opts?.timeout || 48);
    const cb = (deadline) => {
      idleHandle.current = null;
      try {
        if (deadline && !deadline.didTimeout && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 8) {
          idleHandle.current = (ric || shim)(cb, { timeout: 48 });
          return;
        }
        fn();
      } catch {}
    };
    idleHandle.current = (ric || shim)(cb, { timeout: 48 });
    // Best-effort cleanup on unmount
    return () => { try { (cancelRic ? cancelRic(idleHandle.current) : clearTimeout(idleHandle.current)); } catch {} idleHandle.current = null; };
  }, []);

  // Selection + inspector
  const [selectedId, setSelectedId] = useState(null);
  const nameInputRef = useRef(null);

  // Dirty/save tracking
  const lastSavedGraphRef = useRef(backendGraph || { nodes: [], edges: [] });
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Simple validation state for inspector fields
  const [errors, setErrors] = useState({ name: null });
  const validateTimer = useRef(0);

  // Sync from backend when it changes externally
  useEffect(() => {
    const next = toFlow(backendGraph || { nodes: [], edges: [] });
    setNodes(next.nodes);
    setEdges(next.edges);
    lastSavedGraphRef.current = backendGraph || { nodes: [], edges: [] };
    setDirty(false);
  }, [backendGraph, setNodes, setEdges]);

  // Throttled persist back to app graph
  const schedulePersistRef = useRef(0);
  useEffect(() => {
    if (typeof onChange !== 'function') return;
    const curr = fromFlow(nodes, edges, backendGraph || { nodes: [], edges: [] });
    const prev = lastSavedGraphRef.current || { nodes: [], edges: [] };
    const isDirty = (curr.nodes.length !== prev.nodes?.length) || (curr.edges.length !== prev.edges?.length) ||
      curr.nodes.some((n) => {
        const p = prev.nodes?.find((x) => x.id === n.id);
        return !p || p.name !== n.name || p.position?.x !== n.position?.x || p.position?.y !== n.position?.y;
      }) || curr.edges.some((e) => {
        const p = prev.edges?.find((x) => x.id === e.id);
        return !p || p.source !== e.source || p.target !== e.target || p.kind !== e.kind;
      });
    setDirty(isDirty);

    if (schedulePersistRef.current) cancelAnimationFrame(schedulePersistRef.current);
    schedulePersistRef.current = requestAnimationFrame(() => {
      try { onChange(curr); } catch {}
    });
  }, [nodes, edges]);

  // Build a fast edge index for validation
  const { edgeSet, adjacency } = useMemo(() => {
    const set = new Set();
    const adj = new Map();
    for (const e of edges) {
      const key = `${e.source}->${e.target}`;
      set.add(key);
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      adj.get(e.source).add(e.target);
    }
    return { edgeSet: set, adjacency: adj };
  }, [edges]);

  const [portHint, setPortHint] = useState(null); // { x, y, message, ts }
  const showPortHint = useCallback((nodeId, _handleId, message) => {
    try {
      const el = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
      const rect = el?.getBoundingClientRect();
      if (rect) {
        const ts = Date.now();
        setPortHint({ x: rect.right + 8, y: rect.top + rect.height / 2, message, ts });
        setTimeout(() => setPortHint((h) => (h && h.ts === ts ? null : h)), 2500);
      }
    } catch {}
  }, []);

  // Hover/focus port-level hints (lighter style)
  const [portHoverHint, setPortHoverHint] = useState(null); // { x, y, message, id }
  const getHandleHint = useCallback((nodeId, handleType) => {
    // Direction-aware copy first, concise rules second
    const rules = 'Rules: no self-loops, no duplicates, no cycles.';
    if (handleType === 'source') return `Connect this Output → Input. ${rules}`;
    if (handleType === 'target') return `Connect an Output → this Input. ${rules}`;
    if (handleType === 'both') return `Connect Output ↔ Input. ${rules}`;
    // Fallback
    return 'No self-loops • No duplicates • No cycles';
  }, []);
  const hintId = 'wf-handle-hint';
  const showHandleHintFromEl = useCallback((el) => {
    if (!el) return;
    try {
      const nodeEl = el.closest('.react-flow__node');
      const nodeId = nodeEl?.getAttribute('data-id');
      if (!nodeId) return;
      const rect = el.getBoundingClientRect();
      const isSource = el.classList.contains('source');
      const isTarget = el.classList.contains('target');
      const handleType = (isSource && isTarget) ? 'both' : (isSource ? 'source' : (isTarget ? 'target' : 'unknown'));
      const message = getHandleHint(nodeId, handleType);
      setPortHoverHint({ x: rect.right + 8, y: rect.top + rect.height / 2, message, id: hintId });
      el.setAttribute('aria-describedby', hintId);
    } catch {}
  }, [getHandleHint]);
  const clearHandleHintFromEl = useCallback((el) => {
    try { setPortHoverHint(null); el?.removeAttribute('aria-describedby'); } catch {}
  }, []);
  const onContainerMouseOver = useCallback((e) => {
    const handle = e.target && e.target.closest ? e.target.closest('.react-flow__handle') : null;
    if (!handle) return;
    showHandleHintFromEl(handle);
  }, [showHandleHintFromEl]);
  const onContainerMouseOut = useCallback((e) => {
    const handle = e.target && e.target.closest ? e.target.closest('.react-flow__handle') : null;
    if (!handle) return;
    const next = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.react-flow__handle') : null;
    if (next !== handle) clearHandleHintFromEl(handle);
  }, [clearHandleHintFromEl]);
  const onContainerFocus = useCallback((e) => {
    const handle = e.target && e.target.closest ? e.target.closest('.react-flow__handle') : null;
    if (!handle) return;
    showHandleHintFromEl(handle);
  }, [showHandleHintFromEl]);
  const onContainerBlur = useCallback((e) => {
    const handle = e.target && e.target.closest ? e.target.closest('.react-flow__handle') : null;
    if (!handle) return;
    clearHandleHintFromEl(handle);
  }, [clearHandleHintFromEl]);

  const wouldCycle = useCallback((source, target) => {
    if (!source || !target) return false;
    if (source === target) return true;
    const seen = new Set([target]);
    const stack = [target];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === source) return true;
      const outs = adjacency.get(cur);
      if (outs) for (const nxt of outs) if (!seen.has(nxt)) { seen.add(nxt); stack.push(nxt); }
    }
    return false;
  }, [adjacency]);

  const onConnect = useCallback(({ source, target, sourceHandle, targetHandle }) => {
    if (!source || !target) return;
    if (source === target) { showPortHint(target, targetHandle, 'Cannot connect a node to itself'); return; }
    const key = `${source}->${target}`;
    if (edgeSet.has(key)) { showPortHint(target, targetHandle, 'Duplicate connection'); return; }
    if (wouldCycle(source, target)) { showPortHint(target, targetHandle, 'Connection would create a cycle'); return; }
    setEdges((eds) => addEdge({ source, target, sourceHandle, targetHandle }, eds));
  }, [setEdges, edgeSet, wouldCycle, showPortHint]);

  // Symmetric gating for node/edge change streams from React Flow
  const _onNodesChange = onNodesChange; // rename for clarity in wrapper
  const gatedOnNodesChange = useCallback((changes) => {
    try {
      const ls = localStorage.getItem('wf_batch_ms');
      if (ls) batchMsRef.current = Math.max(8, Number(ls) || batchMsRef.current);
    } catch {}
    const now = performance.now();
    if (now - rafGate.current < batchMsRef.current) return;
    rafGate.current = now;
    try { _onNodesChange(changes); } catch {}
    // Defer heavier recomputes (if any) to idle time
    runHeavy(() => { /* placeholder for index rebuilds if needed */ });
  }, [_onNodesChange, runHeavy]);

  const _onEdgesChange = onEdgesChange; // rename for clarity in wrapper
  const gatedOnEdgesChange = useCallback((changes) => {
    try {
      const ls = localStorage.getItem('wf_batch_ms');
      if (ls) batchMsRef.current = Math.max(8, Number(ls) || batchMsRef.current);
    } catch {}
    const now = performance.now();
    if (now - rafGate.current < batchMsRef.current) return;
    rafGate.current = now;
    try { _onEdgesChange(changes); } catch {}
    runHeavy(() => { /* placeholder for index rebuilds if needed */ });
  }, [_onEdgesChange, runHeavy]);

  const addNode = (type) => {
    const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    setNodes((nds) => ([...nds, {
      id,
      position: { x: 120 + (nds.length * 20), y: 120 + (nds.length * 10) },
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
      type: 'default',
    }]));
  };

  // Selection changes from canvas
  const onSelectionChange = useCallback(({ nodes: nds }) => {
    const first = (nds && nds[0]) ? nds[0] : null;
    setSelectedId(first?.id || null);
  }, []);

  // Keyboard navigation within canvas
  const canvasRef = useRef(null);
  const onKeyDown = useCallback((e) => {
    if (!nodes.length) return;
    const idx = Math.max(0, nodes.findIndex((n) => n.id === selectedId));
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const next = nodes[(idx + 1) % nodes.length];
      setSelectedId(next.id);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === next.id })));
      return;
    }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const next = nodes[(idx - 1 + nodes.length) % nodes.length];
      setSelectedId(next.id);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === next.id })));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      try { nameInputRef.current?.focus(); } catch {}
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedId(null);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      return;
    }
  }, [nodes, selectedId, setNodes]);

  // Inspector editing: name field
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);
  const onNameChange = useCallback((val) => {
    if (validateTimer.current) clearTimeout(validateTimer.current);
    validateTimer.current = setTimeout(() => {
      let err = null;
      if (!val || !val.trim()) err = 'Required';
      else if (val.length > 50) err = 'Max 50 characters';
      setErrors((e) => ({ ...e, name: err }));
    }, 250);
    setNodes((nds) => nds.map((n) => n.id === selectedId ? { ...n, data: { ...n.data, label: val } } : n));
  }, [selectedId, setNodes]);

  // Save/discard
  const doSave = useCallback(() => {
    const curr = fromFlow(nodes, edges, backendGraph || { nodes: [], edges: [] });
    if (errors.name) {
      try { window.dispatchEvent(new CustomEvent('ff:toast', { detail: { kind: 'error', msg: `Cannot save: ${errors.name}`, actionLabel: 'Fix', onClick: () => { try { nameInputRef.current?.focus(); } catch {} } } })); } catch {}
      return;
    }
    try { onChange?.(curr); } catch {}
    lastSavedGraphRef.current = curr;
    setDirty(false);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setSavedAt(`${hh}:${mm}`);
  }, [nodes, edges, backendGraph, onChange, errors.name]);

  const doDiscard = useCallback(() => {
    const saved = lastSavedGraphRef.current || { nodes: [], edges: [] };
    const next = toFlow(saved);
    setNodes(next.nodes);
    setEdges(next.edges);
    setDirty(false);
  }, [setNodes, setEdges]);

  // beforeunload guard
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Expose dirty/save/discard to Shell via events
  useEffect(() => {
    try { window.ffEditorDirty = dirty; } catch {}
    try { window.dispatchEvent(new CustomEvent('ff:editor:dirty', { detail: { dirty } })); } catch {}
  }, [dirty]);
  useEffect(() => {
    const onReq = (e) => {
      const action = e?.detail?.action;
      if (action === 'status') {
        try { window.dispatchEvent(new CustomEvent('ff:editor:status', { detail: { dirty } })); } catch {}
      } else if (action === 'save') {
        try { doSave(); } finally { try { window.dispatchEvent(new CustomEvent('ff:editor:saved')); } catch {} }
      } else if (action === 'discard') {
        try { doDiscard(); } finally { try { window.dispatchEvent(new CustomEvent('ff:editor:discarded')); } catch {} }
      }
    };
    window.addEventListener('ff:editor:request', onReq);
    return () => window.removeEventListener('ff:editor:request', onReq);
  }, [dirty, doSave, doDiscard]);

  const hasNodes = nodes.length > 0;
  const hasEdges = edges.length > 0;

  return (
    <div className="wf-editor" style={{ flex: 1, display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Left palette */}
      <div className="wf-sidepanel" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <strong style={{ fontSize: 12 }}>Nodes</strong>
        {['api', 'service', 'db', 'queue', 'fn'].map((t) => (
          <button key={t} className="panel-icon-button" style={{ justifyContent: 'flex-start' }} onClick={() => addNode(t)}>
            + {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        style={{ position: 'relative', flex: 1 }}
        onKeyDown={onKeyDown}
        tabIndex={0}
        ref={canvasRef}
        onMouseMove={() => { if (portHint) setPortHint(null); }}
        onMouseOver={onContainerMouseOver}
        onMouseOut={onContainerMouseOut}
        onFocusCapture={onContainerFocus}
        onBlurCapture={onContainerBlur}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={gatedOnNodesChange}
          onEdgesChange={gatedOnEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onMove={() => {
            try {
              const ls = localStorage.getItem('wf_move_ms');
              if (ls) moveMsRef.current = Math.max(8, Number(ls) || moveMsRef.current);
            } catch {}
            const now = performance.now();
            if (now - moveGate.current < moveMsRef.current) return;
            moveGate.current = now;
          }}
          onMoveEnd={() => { runHeavy(() => { /* flush any viewbox metrics if tracked */ }); }}
          fitView
          panOnScroll
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
        {portHint && (
          <div style={{ position: 'fixed', left: Math.round(portHint.x), top: Math.round(portHint.y), transform: 'translateY(-50%)', pointerEvents: 'none', background: 'rgba(17,24,39,0.9)', color: 'white', fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)' }}>
            {portHint.message}
          </div>
        )}
        {!portHint && portHoverHint && (
          <div id={hintId} role="status" aria-live="polite" style={{ position: 'fixed', left: Math.round(portHoverHint.x), top: Math.round(portHoverHint.y), transform: 'translateY(-50%)', pointerEvents: 'none', background: 'rgba(17,24,39,0.75)', color: 'white', fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)' }}>
            {portHoverHint.message}
          </div>
        )}
        {/* Empty states overlay */}
        {!hasNodes && (
          <div className="wf-empty-overlay">
            <div className="wf-empty-card">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No nodes yet</div>
              <div className="wf-hint">Use the left panel to add your first node.</div>
            </div>
          </div>
        )}
        {hasNodes && !selectedId && (
          <div className="wf-empty-overlay" style={{ alignItems: 'flex-start', paddingTop: 12 }}>
            <div className="wf-empty-card">
              <div className="wf-hint">Tip: Select a node (or use arrow keys) to edit.</div>
            </div>
          </div>
        )}
        {hasNodes && !hasEdges && (
          <div className="wf-empty-overlay" style={{ alignItems: 'flex-end', paddingBottom: 12 }}>
            <div className="wf-empty-card">
              <div className="wf-hint">No connections yet — drag from a node handle to connect.</div>
            </div>
          </div>
        )}
      </div>

      {/* Right inspector */}
      <div className="wf-inspector" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 12 }}>Inspector</strong>
          <div className="wf-hint">{dirty ? 'Unsaved changes' : (savedAt ? `Saved at ${savedAt}` : 'Saved')}</div>
        </div>
        {!selectedNode && (
          <div className="wf-hint">Select a node to edit its details.</div>
        )}
        {selectedNode && (
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span className="wf-hint">Name</span>
              <input
                ref={nameInputRef}
                value={selectedNode?.data?.label || ''}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={(e) => onNameChange(e.target.value)}
                placeholder="Node name"
              />
              {errors.name && (
                <div style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.name}</div>
              )}
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={doSave} disabled={!dirty} className="panel-icon-button">Save</button>
          <button type="button" onClick={doDiscard} disabled={!dirty} className="panel-icon-button">Discard</button>
        </div>
      </div>
    </div>
  );
}

WorkflowEditor.propTypes = {
  backendGraph: PropTypes.shape({ nodes: PropTypes.array, edges: PropTypes.array }),
  onChange: PropTypes.func,
};

// Dev-only live tuning controls for gating/idle batching
// Access via DevTools: __WF_TUNE.get(), __WF_TUNE.setBatch(20), __WF_TUNE.setMove(28), __WF_TUNE.heavy(true)
const __WF_DEV = Boolean(import.meta?.env?.DEV) && (import.meta?.env?.VITE_EXPOSE_DEV === '1');
if (__WF_DEV) {
  try {
    // Store simple setters on window; component instances use refs for live values
    // These are no-ops until a WorkflowEditor is mounted; values are read on each gate
    // @ts-ignore
    window.__WF_TUNE = window.__WF_TUNE || {};
    // We cannot directly reference component-scoped refs here, so we expose global pref storage
    // and have the component read from localStorage on mount and updates through these setters.
    window.__WF_TUNE.get = () => ({
      BATCH_MS: Number(localStorage.getItem('wf_batch_ms') || '16'),
      MOVE_MS: Number(localStorage.getItem('wf_move_ms') || '24'),
      heavy: localStorage.getItem('wf_heavy') === '1',
    });
    window.__WF_TUNE.setBatch = (ms) => {
      const v = Math.max(8, Number(ms) || 16);
      localStorage.setItem('wf_batch_ms', String(v));
      console.info('[WF] BATCH_MS=', v);
    };
    window.__WF_TUNE.setMove = (ms) => {
      const v = Math.max(8, Number(ms) || 24);
      localStorage.setItem('wf_move_ms', String(v));
      console.info('[WF] MOVE_MS=', v);
    };
    window.__WF_TUNE.heavy = (on) => {
      const v = !!on;
      localStorage.setItem('wf_heavy', v ? '1' : '0');
      console.info('[WF] heavyCompute=', v);
    };
  } catch {}
}
