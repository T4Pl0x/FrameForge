import React, { useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';

export default function SandboxView() {
  const kernel = useKernel();
  const sandbox = useMemo(() => kernel?.extensions?.sandbox || null, [kernel]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onRun = async () => {
    if (!sandbox?.run) return;
    setBusy(true); setError('');
    try {
      const r = await sandbox.run();
      setResult(r);
    } catch (e) {
      setError(e?.message || String(e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Sandbox</strong>
        <button onClick={onRun} disabled={!sandbox || busy} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {busy ? 'Running…' : 'Run'}
        </button>
        {!sandbox && <span style={{ color: '#dc2626', fontSize: 12 }}>extension not registered</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
      </div>
      <div style={{ padding: 12, overflow: 'auto' }}>
        {!result && <div style={{ fontSize: 12, color: '#6b7280' }}>Run sandbox to produce normalized reports (tests, a11y, lint/build).</div>}
        {result && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 600 }}>Result</div>
            <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

