import React from 'react';
import ReactFlow, { Background, MiniMap, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

function genGraph(cols, rows, connectRight = true, connectDown = true) {
  const nodes = [];
  const edges = [];
  const gap = 120;
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nid = `n-${id++}`;
      nodes.push({
        id: nid,
        position: { x: c * gap, y: r * gap },
        data: { label: nid },
        style: { width: 96, height: 40 },
      });
      if (connectRight && c < cols - 1) {
        edges.push({ id: `e-${nid}-r`, source: nid, target: `n-${id}`, animated: false });
      }
    }
  }
  if (connectDown) {
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols; c++) {
        const a = r * cols + c;
        const b = (r + 1) * cols + c;
        edges.push({ id: `e-${a}-${b}`, source: `n-${a}`, target: `n-${b}`, animated: false });
      }
    }
  }
  return { nodes, edges };
}

function usePerf() {
  const [stats, setStats] = React.useState({ fps: 0, min: 999, max: 0, ms: 0, heap: null });
  const ema = React.useRef(0);
  const last = React.useRef(performance.now());
  React.useEffect(() => {
    let rafId;
    const tick = () => {
      const now = performance.now();
      const dt = now - last.current;
      last.current = now;
      const instFps = 1000 / dt;
      ema.current = ema.current ? ema.current * 0.9 + instFps * 0.1 : instFps;
      const heap = performance.memory
        ? {
            usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(1),
            totalMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(1),
          }
        : null;
      setStats((s) => ({
        fps: Math.round(ema.current),
        min: Math.min(s.min, instFps),
        max: Math.max(s.max, instFps),
        ms: Math.round(dt),
        heap,
      }));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return stats;
}

export default function LargeGraphSandbox({ simulatePersistence }) {
  const [cols, setCols] = React.useState(20); // 20x15 ≈ 300 nodes
  const [rows, setRows] = React.useState(15);
  const [right, setRight] = React.useState(true);
  const [down, setDown] = React.useState(true);
  const [throttleMs, setThrottleMs] = React.useState(16); // simulate onChange throttle
  const [useRealPersist, setUseRealPersist] = React.useState(true);
  const [batchMs, setBatchMs] = React.useState(() => {
    try { return Number(localStorage.getItem('wf_batch_ms') || '16'); } catch { return 16; }
  });
  const [moveMs, setMoveMs] = React.useState(() => {
    try { return Number(localStorage.getItem('wf_move_ms') || '24'); } catch { return 24; }
  });
  const graph = React.useMemo(() => genGraph(cols, rows, right, down), [cols, rows, right, down]);
  const perf = usePerf();
  // Live graph refs for snapshotting without re-renders
  const nodesRef = React.useRef([]);
  const edgesRef = React.useRef([]);
  const [selectionCount, setSelectionCount] = React.useState(0);
  const [persistStats, setPersistStats] = React.useState({ drag: 0, 'drag:end': 0, 'bulk-move': 0, startedAt: performance.now() });
  const [heavyCompute, setHeavyCompute] = React.useState(false);
  React.useEffect(() => { nodesRef.current = graph.nodes; }, [graph.nodes]);
  React.useEffect(() => { edgesRef.current = graph.edges; }, [graph.edges]);

  // Simulated throttled onChange to mirror editor behavior
  const rafGate = React.useRef(0);
  const callPersist = React.useCallback((reason) => {
    if (!(useRealPersist && typeof simulatePersistence === 'function')) return;
    const snapshot = { nodes: nodesRef.current, edges: edgesRef.current, meta: { reason, throttleMs, selectionCount, heavyCompute } };
    // Optional heavier compute to simulate validation/adjacency cost
    if (heavyCompute) {
      try {
        // Build adjacency and run a tiny reachability from the first node
        const adj = new Map();
        for (const n of snapshot.nodes) adj.set(n.id, []);
        for (const e of snapshot.edges) {
          if (adj.has(e.source)) adj.get(e.source).push(e.target);
        }
        const start = snapshot.nodes[0]?.id;
        if (start) {
          const seen = new Set([start]);
          const stack = [start];
          while (stack.length) {
            const cur = stack.pop();
            const outs = adj.get(cur) || [];
            for (const nxt of outs) if (!seen.has(nxt)) { seen.add(nxt); stack.push(nxt); }
          }
        }
      } catch {}
    }
    const bump = (r) => setPersistStats((s) => {
      const now = performance.now();
      const elapsed = (now - (s.startedAt || now)) / 1000;
      if (elapsed > 60) return { drag: 0, 'drag:end': 0, 'bulk-move': 0, startedAt: now };
      return { ...s, [r]: (s[r] || 0) + 1 };
    });
    try { simulatePersistence(snapshot); } finally { bump(reason); }
  }, [useRealPersist, simulatePersistence, throttleMs, selectionCount, heavyCompute]);
  const onNodesChange = React.useCallback(() => {
    const now = performance.now();
    if (now - rafGate.current >= throttleMs) {
      rafGate.current = now;
      // optional A/B: call real editor persistence throttle path
      callPersist('change');
    }
  }, [throttleMs, useRealPersist, simulatePersistence, graph.nodes, graph.edges]);
  // Movement hooks to exercise persist during drags
  const dragGate = React.useRef(0);
  const endGate = React.useRef(0);
  const onMove = React.useCallback(() => {
    const now = performance.now();
    if (now - dragGate.current >= throttleMs) {
      dragGate.current = now;
      callPersist('drag');
    }
  }, [throttleMs, callPersist]);
  const onMoveEnd = React.useCallback(() => {
    const now = performance.now();
    if (now - endGate.current >= 8) {
      endGate.current = now;
      callPersist('drag:end');
    }
  }, [callPersist]);

  // Selection tracking (A/B note only)
  const onSelectionChange = React.useCallback(({ nodes, edges }) => {
    setSelectionCount((nodes?.length || 0) + (edges?.length || 0));
  }, []);

  const totalNodes = graph.nodes.length;
  const totalEdges = graph.edges.length;

  // One-shot 10s metrics capture
  const [recording, setRecording] = React.useState(false);
  const [recordMsg, setRecordMsg] = React.useState('');
  const [lastMetrics, setLastMetrics] = React.useState(null);
  const record10s = React.useCallback(async () => {
    if (recording) return;
    setRecording(true);
    setRecordMsg('');
    const samples = [];
    let rafId = 0;
    let last = performance.now();
    const endAt = last + 10000;
    await new Promise((resolve) => {
      const loop = () => {
        const now = performance.now();
        const dt = now - last;
        last = now;
        if (dt > 0 && dt < 1000) samples.push(dt);
        if (now >= endAt) { resolve(); return; }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }).finally(() => { if (rafId) cancelAnimationFrame(rafId); });
    // compute avg FPS and p95 frame time
    const avgDt = samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);
    const avgFps = 1000 / avgDt;
    const sorted = samples.slice().sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length));
    const p95 = sorted[idx] || 0;
    const line = `LargeGraphSandbox: ${cols}x${rows} nodes=${totalNodes} edges=${totalEdges} throttle=${throttleMs}ms batch=${batchMs}ms move=${moveMs}ms avgFPS=${avgFps.toFixed(1)} p95=${p95.toFixed(1)}ms`;
    const metrics = {
      cols, rows, nodes: totalNodes, edges: totalEdges,
      throttleMs, batchMs, moveMs, heavyCompute,
      avgFPS: Number(avgFps.toFixed(1)), p95Ms: Number(p95.toFixed(1)),
      minFPS: Math.round(perf.min), maxFPS: Math.round(perf.max)
    };
    setLastMetrics(metrics);
    try { window.__SANDBOX_LAST_METRICS = metrics; } catch {}
    try { console.log(line); } catch {}
    try { await navigator.clipboard.writeText(line); setRecordMsg('Copied metrics to clipboard'); } catch { setRecordMsg('Metrics ready (clipboard copy failed)'); }
    setRecording(false);
  }, [cols, rows, totalNodes, totalEdges, throttleMs, recording]);
  React.useEffect(() => { try { window.__SANDBOX_TRIGGER_RECORD = () => record10s(); } catch {} }, [record10s]);
  // One-frame bulk move stress against persistence path
  const bulkMove = React.useCallback(() => {
    const nudged = (nodesRef.current || []).map((n, i) => (i % 3 === 0)
      ? { ...n, position: { x: (n.position?.x || 0) + 10, y: (n.position?.y || 0) + 4 } }
      : n
    );
    nodesRef.current = nudged;
    callPersist('bulk-move');
  }, [callPersist]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 9999 }}>
      <div className="sandbox-hud" style={{ position: 'absolute', top: 8, left: 8, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: 12, display: 'grid', gap: 8, zIndex: 10000 }}>
        <div style={{ fontWeight: 600 }}>Large Graph Sandbox</div>
        <div>
          Nodes: <b>{totalNodes}</b> • Edges: <b>{totalEdges}</b>
        </div>
        <div>
          FPS: <b>{perf.fps}</b> (min {Math.round(perf.min)} / max {Math.round(perf.max)}), frame {perf.ms}ms
        </div>
        <div>
          persist/min (since last reset): drag <b>{persistStats.drag}</b> • end <b>{persistStats['drag:end']}</b> • bulk <b>{persistStats['bulk-move']}</b>
        </div>
        {perf.heap && (
          <div>Heap: {perf.heap.usedMB} / {perf.heap.totalMB} MB</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            Cols
            <input type="number" min="1" max="80" value={cols} onChange={(e) => setCols(+e.target.value || 1)} style={{ marginLeft: 4, width: 56, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }} />
          </label>
          <label>
            Rows
            <input type="number" min="1" max="80" value={rows} onChange={(e) => setRows(+e.target.value || 1)} style={{ marginLeft: 4, width: 56, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={right} onChange={(e) => setRight(e.target.checked)} /> right edges
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={down} onChange={(e) => setDown(e.target.checked)} /> down edges
          </label>
          <label>
            Throttle
            <input type="number" min="0" max="100" value={throttleMs} onChange={(e) => setThrottleMs(+e.target.value || 0)} style={{ marginLeft: 4, width: 56, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }} />
            ms
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={useRealPersist} onChange={(e) => setUseRealPersist(e.target.checked)} /> use real persist()
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={heavyCompute} onChange={(e) => setHeavyCompute(e.target.checked)} /> heavier compute
          </label>
          <label>
            BATCH_MS
            <input type="number" min="8" max="60" value={batchMs}
              onChange={(e) => { const v = Math.max(8, +e.target.value || 16); setBatchMs(v); try { window.__WF_TUNE?.setBatch?.(v); } catch {} }}
              style={{ marginLeft: 4, width: 64, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }} />
            ms
          </label>
          <label>
            MOVE_MS
            <input type="number" min="8" max="80" value={moveMs}
              onChange={(e) => { const v = Math.max(8, +e.target.value || 24); setMoveMs(v); try { window.__WF_TUNE?.setMove?.(v); } catch {} }}
              style={{ marginLeft: 4, width: 64, padding: '2px 4px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }} />
            ms
          </label>
          <button onClick={bulkMove} style={{ padding: '4px 8px', borderRadius: 6, background: '#fff', color: '#111827', border: '1px solid #e5e7eb' }}>
            Bulk move (1 frame)
          </button>
          <button onClick={record10s} disabled={recording} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #93C5FD', background: 'rgba(147,197,253,0.12)', color: '#DBEAFE' }}>
            {recording ? 'Recording…' : 'Record 10s'}
          </button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(lastMetrics || {}, null, 2)); } catch {} }} disabled={!lastMetrics} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #10B981', background: 'rgba(16,185,129,0.12)', color: '#A7F3D0' }}>
            Copy metrics JSON
          </button>
          {recordMsg && <span style={{ color: '#93C5FD' }}>{recordMsg}</span>}
          <a href="/#" style={{ marginLeft: 8, color: '#93C5FD', textDecoration: 'underline' }}>Close</a>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          onNodesChange={onNodesChange}
          onSelectionChange={onSelectionChange}
          onMove={onMove}
          onMoveEnd={onMoveEnd}
          fitView
          proOptions={{ hideAttribution: true }}
          panOnScroll
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
