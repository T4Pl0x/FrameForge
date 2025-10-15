import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';
import { createKernelApi } from '../../packages/kernel/src/api.js';
import OverrideForm from './OverrideForm.jsx';
import { toastOK, toastKernelError } from '../ui/toast.js';

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
  const api = useMemo(() => createKernelApi(kernel), [kernel]);
  const auto = useMemo(() => {
    try {
      const envFlag = (import.meta && import.meta.env && import.meta.env.VITE_FF_DEV_AUTO_APPROVE) || '';
      const lc = (typeof localStorage !== 'undefined' && localStorage.getItem('FF_DEV_AUTO_APPROVE')) || '';
      return String(envFlag || lc).toLowerCase() === 'true';
    } catch { return false; }
  }, []);

  const reload = () => {
    try { setItems(api.listProposals() || []); }
    catch (e) { setError(e?.message || String(e)); }
  };

  useEffect(() => {
    reload();
    const off = api.events.subscribe('proposal.*', reload);
    return () => { try { off(); } catch {} };
  }, [kernel]);

  const currentUser = useMemo(() => {
    try {
      const id = localStorage.getItem('frameforge-user-id') || 'u_owner';
      const role = localStorage.getItem('frameforge-user-role') || 'owner';
      return { id, roles: [role] };
    } catch { return { id: 'u_owner', roles: ['owner'] }; }
  }, []);

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
                {p?.provenance?.model?.id && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, background: '#EEF2FF', color: '#3730A3', padding: '2px 6px', borderRadius: 9999 }}>AI: {p.provenance.model.id}</span>
                    {p?.provenance?.inputs_sha256 && (
                      <button type="button" title="Copy inputs hash" style={{ fontSize: 11 }} onClick={() => { try { navigator.clipboard?.writeText(p.provenance.inputs_sha256); } catch {} }}>copy hash</button>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{s.reason}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>proposed by {s.actor}</div>
                {currentUser.roles.includes('owner') && (
                  <div style={{ marginTop: 8, background: '#FFFBEB', border: '1px solid #FDE68A', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#92400E', marginBottom: 6 }}>Blocked by gates? As owner, you can apply a scoped override.</div>
                    <OverrideForm
                      defaultScope={{ file: (p?.target?.file) || 'spec/ui.json', path: p?.target?.path || '/' }}
                      onSubmit={async (bundle) => {
                        try { await api.approve(p.id, currentUser.id); toastOK('Approved.'); }
                        catch (e) { toastKernelError(e); }
                        try { await api.apply(p.id, { override: { scope: bundle.scope, reason: bundle.reason, approved_by: currentUser.id, expires_at: bundle.expires_at }, user: currentUser }); toastOK('Applied with override.'); reload(); }
                        catch (e) { toastKernelError(e); }
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { try { kernel.proposals.reject(p.id, { reason: 'dismissed' }); } catch (e) { setError(e?.message || String(e)); } }}>
                    Dismiss
                  </button>
                  <button type="button" onClick={() => { try { api.approve(p.id, currentUser.id); toastOK('Approved.'); } catch (e) { toastKernelError(e); } }} disabled={p.status !== 'ready' && p.status !== 'submitted'}>
                    Approve
                  </button>
                  <button type="button" onClick={() => { try { api.apply(p.id, { user: currentUser }); toastOK('Applied.'); } catch (e) { toastKernelError(e); } }} disabled={p.status !== 'approved'}>
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
