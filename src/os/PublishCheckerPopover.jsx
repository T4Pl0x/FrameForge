import React, { useMemo } from 'react';
import { toastOK } from '../ui/toast.js';

function maskSecret(s) {
  if (!s) return undefined;
  const tail = String(s).slice(-4);
  const len = Math.max(8, Math.max(0, String(s).length - 4));
  return '•'.repeat(len) + tail;
}

export default function PublishCheckerPopover({ open, onClose, result, onRefresh, onOpenSettings, onOpenRegistry, onOpenReports, onRetryHealth }) {
  if (!open) return null;
  const details = result?.details || {};
  const reasons = result?.reasons || [];
  const grouped = useMemo(() => ({
    blocking: reasons.filter(r => r.kind === 'blocking'),
    warnings: reasons.filter(r => r.kind === 'warning')
      .reduce((acc, r) => { (acc[r.category] ||= []).push(r); return acc; }, {})
  }), [reasons]);
  const sharePayload = useMemo(() => ({
    ready: result?.ready,
    blocking: result?.blocking || [],
    warnings: result?.warnings || [],
    reasons: reasons.map(r => ({ ...r, action: r.action?.actionId })),
    details,
    timestampISO: new Date().toISOString(),
  }), [result, reasons, details]);

  const onReasonAction = (action) => {
    const id = action?.actionId;
    if (!id) return;
    switch (id) {
      case 'open_settings':
        onOpenSettings?.();
        break;
      case 'open_registry':
        onOpenRegistry?.();
        break;
      case 'retry_health':
        onRetryHealth?.();
        break;
      case 'open_reports':
        onOpenReports?.();
        break;
      default:
        break;
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1400 }}>
      <div style={{ position: 'absolute', right: 16, top: 56, width: 520, maxHeight: '70vh', overflow: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', paddingBottom: 8 }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Publish Checker Details</strong>
          <button className="panel-icon-button" aria-label="Close" onClick={onClose}>A-</button>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 10 }}>
          {grouped.blocking.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', padding: 8, borderRadius: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Blocking</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{grouped.blocking.map((r,i) => (<li key={i}><code style={{ marginRight: 6 }}>{r.key}</code>{r.message}</li>))}</ul>
            </div>
          )}
          {Object.keys(grouped.warnings).length > 0 && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: 8, borderRadius: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Warnings</div>
              {Object.entries(grouped.warnings).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{cat}</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {items.map((r,i) => (
                      <li key={r.key + ':' + i}>
                        <code style={{ marginRight: 6 }}>{r.key}</code>{r.message}
                        {r.action && (
                          <>
                            {' · '}<button type="button" onClick={() => onReasonAction(r.action)} style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}>{r.action.label}</button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Env (sanitized)</div>
            <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(details.env, null, 2)}</pre>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Registry</div>
            <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(details.registry, null, 2)}</pre>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Health</div>
            <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(details.health, null, 2)}</pre>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Artifacts</div>
            <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(details.artifacts, null, 2)}</pre>
          </div>
          {details.ci && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>CI-only</div>
              <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(details.ci, null, 2)}</pre>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onRefresh} className="panel-secondary">Refresh checks</button>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(sharePayload, null, 2)); toastOK('Checker snapshot copied to clipboard'); } catch {} }} className="panel-secondary">Copy JSON</button>
            <button type="button" onClick={onOpenSettings} className="panel-secondary">Open settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
