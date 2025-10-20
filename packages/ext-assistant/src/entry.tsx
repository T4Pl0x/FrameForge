import React, { useMemo, useState } from 'react';

type Ctx = { openWindow: (opts: { title: string; component: React.ComponentType }) => void };

function useAiConfig(){
  return useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ff.settings.ai') || '{}'); } catch { return {}; }
  }, []);
}

const Composer: React.FC = () => {
  const ai = useAiConfig();
  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const run = async () => {
    // Placeholder: wire actual provider client here
    setOut(`Would call ${ai.provider || 'openrouter'}:${ai.model || ''} (base:${ai.baseUrl||''}) with ${text.length} chars`);
  };
  return (
    <div style={{ padding: 12, display:'grid', gap:8 }}>
      <div style={{opacity:.7,fontSize:12}}>Provider: <code>{ai.provider||'n/a'}</code> · Model: <code>{ai.model||'n/a'}</code></div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={6} placeholder="Type a prompt" />
      <div style={{display:'flex', gap:8}}>
        <button onClick={run}>Run</button>
        {out && <span className="muted">{out}</span>}
      </div>
    </div>
  );
};

export function entry(ctx: Ctx){
  ctx.openWindow({ title: 'Assistant', component: Composer });
}

