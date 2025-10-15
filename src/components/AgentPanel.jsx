import React, { useMemo } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';

export default function AgentPanel({ open, onClose }) {
  const kernel = useKernel();
  const policies = useMemo(() => kernel.store.get('logic')?.policies || { requireApproval: true }, [kernel]);

  const proposeToggle = (key, value) => {
    const patch = [{ op: 'replace', path: `/logic/policies/${key}`, value }];
    try {
      kernel.proposals.preflight(
        kernel.proposals.propose({ target: 'logic.json', patch, rationale: `Toggle policy ${key} -> ${String(value)}` })
      );
      // Do not auto-approve/apply in MVP
    } catch {}
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}>
      <div style={{ position: 'absolute', right: 12, bottom: 52, width: 420, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Agent Panel</strong>
          <button className="panel-icon-button" onClick={onClose} aria-label="Close">A-</button>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Policies (proposals only — approval required)</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!policies.requireApproval} onChange={(e) => proposeToggle('requireApproval', e.target.checked)} />
            <span>Require approval for changes</span>
          </label>
        </div>
      </div>
    </div>
  );
}

