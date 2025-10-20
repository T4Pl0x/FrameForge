import React, { useEffect, useMemo, useState } from 'react';

type Tool = { id: string; kind: string; endpoint?: string|null; status?: string; lastPingISO?: string|null; permissions?: any };

async function readRegistry(): Promise<Tool[]>{
  try {
    const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
    if (!base) return [];
    const mod: any = await import(`/@fs/${base}/tools/registry.json?${Date.now()}`);
    const json = mod?.default || mod;
    return (json.tools || json.extensions || []).map((t: any) => ({...t}));
  } catch { return []; }
}

function dot(status?: string){
  switch (status) { case 'online': return '🟢'; case 'offline': return '🔴'; default: return '🟡'; }
}

export function ToolHub() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => { (async () => setTools(await readRegistry()))(); }, [refresh]);
  useEffect(() => { const t = setInterval(()=>setRefresh(x=>x+1), 10000); return () => clearInterval(t); }, []);

  const rows = useMemo(() => tools.map(t => ({
    ...t,
    heartbeat: t.lastPingISO ? Math.round(((Date.now() - Date.parse(t.lastPingISO))/1000)) + 's ago' : '—',
    perms: t.permissions?.callableBy ? (t.permissions.callableBy as string[]).join(', ') : '—'
  })), [tools]);

  return (
    <div className="text-sm">
      <div className="widget-title">Tool Registry</div>
      <div className="muted" style={{marginBottom:8}}>Live-ish status from registry.json; auto-refreshes.</div>
      <ul style={{display:'grid', gap:8, paddingLeft:0, listStyle:'none'}}>
        {rows.map(r => (
          <li key={r.id} style={{border:'1px solid var(--border)', borderRadius:8, padding:8}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:600}}>{r.id} {dot(r.status)}</div>
                <div className="muted" style={{fontSize:12}}>{r.kind} {r.endpoint ? `• ${r.endpoint}` : ''}</div>
              </div>
              <div className="muted" style={{fontSize:12}}>last ping: {r.heartbeat}</div>
            </div>
            <div style={{marginTop:6}}>
              <div className="muted" style={{fontSize:12}}>callableBy: {r.perms}</div>
            </div>
          </li>
        ))}
      </ul>
      <div style={{marginTop:8}}>
        <button className="btn" onClick={()=>setRefresh(x=>x+1)} style={{marginRight:8}}>Refresh</button>
        <button className="btn" onClick={()=>setShowSettings(s=>!s)}>{showSettings ? 'Hide' : 'Show'} Settings</button>
      </div>
      {showSettings && (
        <div style={{marginTop:12, border:'1px solid var(--border)', borderRadius:8, padding:8}}>
          <div style={{fontWeight:600, marginBottom:6}}>Tool Settings (read-only)</div>
          <ul style={{listStyle:'none', paddingLeft:0, display:'grid', gap:6}}>
            {tools.map(t => (
              <li key={t.id}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <div><code>{t.id}</code> <span className="muted" style={{fontSize:12}}>{t.kind}</span></div>
                  <div className="muted" style={{fontSize:12}}>{t.endpoint || 'n/a'}</div>
                </div>
                <div className="muted" style={{fontSize:12}}>callableBy: {t.permissions?.callableBy ? (t.permissions.callableBy as string[]).join(', ') : 'n/a'}</div>
                {t['rateLimit'] && (
                  <div className="muted" style={{fontSize:12}}>rateLimit: {t['rateLimit'].rpm} rpm / burst {t['rateLimit'].burst}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
