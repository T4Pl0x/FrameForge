import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';

function summarize(p) {
  const file = p?.target?.file || 'ui.json';
  const path = Array.isArray(p.patch) && p.patch[0] ? p.patch[0].path : '/';
  const actor = p?.metadata?.sourceExtension || p?.provenance?.actor?.name || 'unknown';
  const reason = p?.rationale || '';
  const when = new Date(p?.created_at || Date.now()).toLocaleTimeString();
  return { file, path, actor, reason, when };
}

export default function ProposalsDrawer({ open, onClose }) {
  const kernel = useKernel();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const auto = useMemo(() => {
    try {
      const envFlag = (import.meta && import.meta.env && import.meta.env.VITE_FF_DEV_AUTO_APPROVE) || '';
      const lc = (typeof localStorage !== 'undefined' && localStorage.getItem('FF_DEV_AUTO_APPROVE')) || '';
      return String(envFlag || lc).toLowerCase() === 'true';
    } catch { return false; }
  }, []);

  const reload = () => {
    try {
      const all = kernel.proposals.list ? kernel.proposals.list() : (kernel.host.listProposals ? kernel.host.listProposals() : []);
      setItems(all);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  useEffect(() => {
    reload();
    const unsub1 = kernel.bus.on('proposal:submitted', reload);
    const unsub2 = kernel.bus.on('proposal:approved', reload);
    const unsub3 = kernel.bus.on('proposal:applied', reload);
    const unsub4 = kernel.bus.on('proposal:rejected', reload);
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
  }, [kernel]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}>
      <div style={{ position: 'absolute', right: 12, bottom: 12, width: 420, maxHeight: '70vh', overflow: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Proposals</strong>
          <button className="panel-icon-button" onClick={onClose} aria-label="Close">A-</button>
        </div>
        {auto && (
          <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: 8, fontSize: 12, borderBottom: '1px solid #DBEAFE' }}>
            Dev Auto-Approve is ENABLED for this session.
          </div>
        )}
        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: 8, fontSize: 12 }}>{error}</div>
        )}
        <div style={{ padding: 8 }}>
          {items.length === 0 && (
            <div style={{ fontSize: 12, color: '#6b7280', padding: 12 }}>No pending changes. Changes you make will appear here for approval.</div>
          )}
          {items.map((p) => {
            const s = summarize(p);
            return (
              <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12 }}>
                    <strong>{p.status}</strong> — {s.file}:{s.path}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{s.when}</div>
                </div>
                <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{s.reason}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>proposed by {s.actor}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { try { kernel.proposals.reject(p.id, { reason: 'dismissed' }); } catch (e) { setError(e?.message || String(e)); } }}>
                    Dismiss
                  </button>
                  <button type="button" onClick={() => { try { kernel.proposals.approve(p.id, { by: 'user' }); } catch (e) { setError(e?.message || String(e)); } }} disabled={p.status !== 'ready' && p.status !== 'submitted'}>
                    Approve
                  </button>
                  <button type="button" onClick={() => { try { kernel.proposals.apply(p.id, {}); } catch (e) { setError(e?.message || String(e)); } }} disabled={p.status !== 'approved'}>
                    Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

