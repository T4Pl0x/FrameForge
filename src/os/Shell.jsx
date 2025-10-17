import React, { useEffect, useMemo, useState } from 'react';
import App from '../App-Refactored.jsx';
import AgentsEntry from '../components/AgentsEntry.jsx';
import ProposalsEntry from '../components/ProposalsEntry.jsx';
import RunHistoryPanel from '../components/RunHistoryPanel.jsx';
import Toasts from '../components/Toasts.jsx';
import GhostLayer from '../components/GhostLayer.jsx';
import ToolsOverlay from '../components/ToolsOverlay.jsx';
import CompilerView from './CompilerView.jsx';
import SandboxView from './SandboxView.jsx';
import PublishView from './PublishView.jsx';
import PromptLabView from './PromptLabView.jsx';
import GatesBadges from '../components/GatesBadges.jsx';
import PrStatusPill from '../components/PrStatusPill.jsx';
import { startGatesTap, subscribeGates, getGatesInfo } from '../state/gates.js';

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
    window.addEventListener('keydown', onKey);
    window.addEventListener('ff:tools:toggle', onToolsToggle);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('ff:tools:toggle', onToolsToggle); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '72px 1fr', gridTemplateRows: '1fr 36px', background: '#fff' }}>
      <Dock active={active} onSelect={setActive} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {active === 'ui' && <App />}
        {active === 'promptlab' && <PromptLabView />}
        {active === 'compiler' && <CompilerView />}
        {active === 'sandbox' && <SandboxView />}
        {active === 'publish' && <PublishView />}
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
