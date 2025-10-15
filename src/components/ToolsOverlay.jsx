import React, { useEffect, useState } from 'react';
import registry from '../../tools/registry.json';
import { call as toolCall } from '../tools/broker.js';

export default function ToolsOverlay({ onClose }) {
  const [tools, setTools] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const entries = registry.tools || [];
      const statuses = await Promise.all(entries.map(async (t) => {
        try {
          const res = await toolCall(t.name || t.id, (t.permissions?.[0] || 'status'), {});
          return { id: t.name || t.id, status: res.status || 'online' };
        } catch { return { id: t.name || t.id, status: 'offline' }; }
      }));
      if (mounted) setTools(statuses);
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}>
      <div style={{ position: 'absolute', left: 12, bottom: 52, width: 380, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Tools</strong>
          <button className="panel-icon-button" onClick={onClose} aria-label="Close">A-</button>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 8 }}>
          {tools.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: (t.status==='online'||t.status==='green') ? '#059669' : t.status==='offline' ? '#dc2626' : '#f59e0b', display: 'inline-block' }} />
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12 }}>{t.id}</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>({t.status})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
