import React, { useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';

export default function CompilerView() {
  const kernel = useKernel();
  const compiler = useMemo(() => kernel?.extensions?.compiler || null, [kernel]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onGenerate = async () => {
    if (!compiler?.generate) return;
    setBusy(true); setError('');
    try {
      const r = await compiler.generate();
      setResult(r);
    } catch (e) {
      setError(e?.message || String(e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Compiler</strong>
        <button onClick={onGenerate} disabled={!compiler || busy} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {busy ? 'Running…' : 'Generate'}
        </button>
        {!compiler && <span style={{ color: '#dc2626', fontSize: 12 }}>extension not registered</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
      </div>
      <div style={{ padding: 12, overflow: 'auto' }}>
        {!result && <div style={{ fontSize: 12, color: '#6b7280' }}>Run “Generate” to propose initialization diffs and view open questions.</div>}
        {result && (
          <div style={{ display: 'grid', gap: 12 }}>
            {Array.isArray(result.openQuestions) && result.openQuestions.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Open Questions</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.openQuestions.map((q, i) => (<li key={i} style={{ fontSize: 13 }}>{q}</li>))}
                </ul>
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Sample Patch</div>
              <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(result.sample || [], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

