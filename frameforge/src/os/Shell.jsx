import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getViews } from './registry/viewRegistry';
import AgentsEntry from '../components/AgentsEntry.jsx';
import ProposalsEntry from '../components/ProposalsEntry.jsx';
import RunHistoryPanel from '../components/RunHistoryPanel.jsx';
import Toasts from '../components/Toasts.jsx';
import GhostLayer from '../components/GhostLayer.jsx';
import ToolsOverlay from '../components/ToolsOverlay.jsx';
import GatesBadges from '../components/GatesBadges.jsx';
import PrStatusPill from '../components/PrStatusPill.jsx';
import { startGatesTap, subscribeGates, getGatesInfo } from '../state/gates.js';
import LargeGraphSandbox from '../sandbox/LargeGraphSandbox.jsx';
import { persistGraphThrottled } from '../editor/persistence.js';

function Dock({ active, onSelect }) {
  const [st, setSt] = useState(() => getGatesInfo());
  useEffect(() => { startGatesTap(); const off = subscribeGates(setSt); return () => off?.(); }, []);
  const items = [
    { key: 'ui', label: 'UI' },
    { key: 'promptlab', label: 'Prompt Lab' },
    { key: 'compiler', label: 'Compiler' },
    { key: 'sandbox', label: 'Sandbox' },
    { key: 'publish', label: 'Publish' },
  ];
  return (
    <div style={{ width: 72, borderRight: '1px solid #e5e7eb', display: 'grid', gap: 6, padding: 6 }}>
      {items.map((it) => (
        <button key={it.key} onClick={() => onSelect(it.key)}
          title={it.label}
          style={{ padding: '8px 6px', borderRadius: 8, border: '1px solid #e5e7eb', background: active === it.key ? '#EEF2FF' : '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span>{it.label}</span>
          {it.key === 'publish' && (() => {
            const url = st?.info?.prUrl;
            let num = '';
            if (url) {
              try {
                const u = new URL(url);
                const parts = u.pathname.split('/');
                const idx = parts.indexOf('pull');
                num = (idx >= 0 && parts[idx+1] && /^\d+$/.test(parts[idx+1])) ? parts[idx+1] : '';
              } catch {}
            }
            const dot = <span style={{ width: 8, height: 8, borderRadius: 9999, background: (st?.info?.status === 'green') ? '#059669' : (st?.info?.status === 'red') ? '#dc2626' : '#9CA3AF' }} />;
            const title = (st?.info?.firstHint ? `Hint: ${st.info.firstHint}` : undefined) || (num ? `PR #${num}` : 'Publish checks');
            return url ? (
              <a href={url} target="_blank" rel="noreferrer" title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                {dot}
                {num && <span style={{ fontSize: 10, color: '#6B7280' }}>#{num}</span>}
              </a>
            ) : (
              <span title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {dot}
              </span>
            );
          })()}
        </button>
      ))}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ position: 'fixed', left: 72, right: 0, bottom: 0, height: 36, borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Gates:</span>
        <GatesBadges />
      </div>
      <div style={{ marginLeft: 8 }}>
        <PrStatusPill />
      </div>
      <button onClick={() => window.dispatchEvent(new CustomEvent('ff:agents:toggle'))} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Agents</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('ff:tools:toggle'))} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Tools</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('ff:proposals:toggle'))} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Proposals</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('ff:history:toggle'))} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, marginLeft: 'auto' }}>Logs</button>
    </div>
  );
}

export default function Shell() {
  const [active, setActive] = useState('ui');
  const [toolsOpen, setToolsOpen] = useState(false);
  const dev = useMemo(() => import.meta.env?.VITE_EXPOSE_DEV === '1', []);
  const [hash, setHash] = useState(() => window.location.hash || '');
  const [editorDirty, setEditorDirty] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && ['1','2','3','4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        setActive(['ui','promptlab','compiler','sandbox','publish'][idx] || 'ui');
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'p')) window.dispatchEvent(new CustomEvent('ff:proposals:toggle'));
      if (e.altKey && (e.key.toLowerCase() === 'j')) window.dispatchEvent(new CustomEvent('ff:agents:toggle'));
      if (e.altKey && (e.key.toLowerCase() === 't')) window.dispatchEvent(new CustomEvent('ff:tools:toggle'));
    };
    const onToolsToggle = () => setToolsOpen((v) => !v);
    const onHash = () => setHash(window.location.hash || '');
    window.addEventListener('keydown', onKey);
    window.addEventListener('ff:tools:toggle', onToolsToggle);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('ff:tools:toggle', onToolsToggle); window.removeEventListener('hashchange', onHash); };
  }, []);

  // Track editor dirty state and provide guarded navigation
  useEffect(() => {
    const onDirty = (e) => { try { setEditorDirty(Boolean(e?.detail?.dirty)); } catch {} };
    const onStatus = (e) => { try { setEditorDirty(Boolean(e?.detail?.dirty)); } catch {} };
    window.addEventListener('ff:editor:dirty', onDirty);
    window.addEventListener('ff:editor:status', onStatus);
    try { window.dispatchEvent(new CustomEvent('ff:editor:request', { detail: { action: 'status' } })); } catch {}
    return () => { window.removeEventListener('ff:editor:dirty', onDirty); window.removeEventListener('ff:editor:status', onStatus); };
  }, []);

  const attemptSetActive = useCallback((next) => {
    if (!editorDirty) { setActive(next); return; }
    setPendingView(next); setGuardOpen(true);
  }, [editorDirty]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '72px 1fr', gridTemplateRows: '1fr 36px', background: '#fff' }}>
      <Dock active={active} onSelect={attemptSetActive} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {dev && hash === '#sandbox-large-graph' ? (
          <LargeGraphSandbox simulatePersistence={(snap) => { try { persistGraphThrottled(snap); } catch {} }} />
        ) : (
          <div style={{ padding: 12, fontSize: 12, color: '#6b7280' }}>
            Developer sandbox not active. Append <code>#sandbox-large-graph</code> to URL.
          </div>
        )}
        {dev && (
          <a href="/#sandbox-large-graph" title="Open Large Graph Sandbox"
             style={{ position: 'fixed', right: 12, bottom: 48, fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.05)', color: '#111827', textDecoration: 'none', zIndex: 10000 }}>
            Sandbox
          </a>
        )}
        {guardOpen && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, width: 320, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Unsaved changes</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>You have edits that haven’t been saved.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { try { window.dispatchEvent(new CustomEvent('ff:editor:request', { detail: { action: 'discard' } })); } catch {}; setGuardOpen(false); if (pendingView) setActive(pendingView); setPendingView(null); }} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Discard</button>
                <button onClick={() => { setGuardOpen(false); setPendingView(null); }} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>Cancel</button>
                <button onClick={() => {
                  const onSaved = () => { window.removeEventListener('ff:editor:saved', onSaved); try { setGuardOpen(false); if (pendingView) setActive(pendingView); setPendingView(null); } catch {} };
                  window.addEventListener('ff:editor:saved', onSaved);
                  try { window.dispatchEvent(new CustomEvent('ff:editor:request', { detail: { action: 'save' } })); } catch {}
                }} style={{ padding: '6px 10px', border: '1px solid #3b82f6', background: '#3b82f6', color: 'white', borderRadius: 6 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ gridColumn: '1 / span 2' }}><StatusBar /></div>
      {/* Overlays */}
      <AgentsEntry />
      <ProposalsEntry />
      <RunHistoryPanel />
      <Toasts />
      <GhostLayer />
      {toolsOpen && <ToolsOverlay onClose={() => setToolsOpen(false)} />}
    </div>
  );
}
