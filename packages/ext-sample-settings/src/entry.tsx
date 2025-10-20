import React, { useMemo } from 'react';

type Ctx = { openWindow: (opts: { title: string; component: React.ComponentType }) => void };

function useLocalSettings(){
  const ai = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ff.settings.ai') || '{}'); } catch { return {}; }
  }, []);
  const pol = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ff.settings.policies') || '{}'); } catch { return {}; }
  }, []);
  return { ai, pol } as const;
}

const Panel: React.FC = () => {
  const { ai, pol } = useLocalSettings();
  const mask = (s?: string) => s ? (s.slice(0, 4) + '…' + s.slice(-4)) : '';
  return (
    <div style={{ padding: 12, fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Settings (read-only)</div>
      <div style={{ display:'grid', gap:6 }}>
        <div>Provider: <code>{ai.provider || 'n/a'}</code></div>
        <div>Model: <code>{ai.model || 'n/a'}</code></div>
        <div>Base URL: <code>{ai.baseUrl || 'n/a'}</code></div>
        <div>API Key: <code>{mask(ai.apiKey) || 'n/a'}</code></div>
        <div>Rules: <pre style={{ whiteSpace:'pre-wrap' }}>{pol.rules || ''}</pre></div>
        <div>Workflow: <pre style={{ whiteSpace:'pre-wrap' }}>{pol.workflow || ''}</pre></div>
      </div>
    </div>
  );
};

export function entry(ctx: Ctx){
  ctx.openWindow({ title: 'Sample Settings', component: Panel });
}

