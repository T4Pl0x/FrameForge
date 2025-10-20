import React, { useEffect, useState } from 'react';
import { useAgentHealth } from './useAgentHealth';
import { toProposal } from './policies';
import { FLAGS } from '../flags';
// import { AgentPrompts } from './AgentPrompts';
import { useAgents } from '../kernel/useAgents';
import { useToast } from '../ui/toast/ToastProvider';
import { validateId } from '../lib/validation';

export default function AgentPanel(){
  const health = useAgentHealth();
  const [tab, setTab] = useState<'overview'|'policies'|'tools'>('overview');
  const [ragStatus, setRagStatus] = useState<'online'|'offline'|'unknown'>('unknown');
  const [searchStatus, setSearchStatus] = useState<'online'|'offline'|'unknown'>('unknown');
  const [searchOut, setSearchOut] = useState<string>('');
  const { agents, loading: loadingAgents } = useAgents();
  const defaultAgent = agents.includes('ui_agent') ? 'ui_agent' : (agents[0] || '');
  const [agentId, setAgentId] = useState<string>(defaultAgent);
  const [indexId, setIndexId] = useState<string>('docs');
  const [ingestText, setIngestText] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const { push } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
        if (!base) return;
        const mod: any = await import(`/@fs/${base}/tools/registry.json?${Date.now()}`);
        const json = mod?.default || mod;
        const tools = Array.isArray(json?.tools) ? json.tools : [];
        const r1 = tools.find((t: any) => t.id === 'rag_indexer');
        const r2 = tools.find((t: any) => t.id === 'search_docs');
        setRagStatus(r1?.status || 'unknown');
        setSearchStatus(r2?.status || 'unknown');
      } catch {}
    })();
  }, [tab]);
  useEffect(() => { /* mount stub */ }, []);
  useEffect(() => { if (!agentId && defaultAgent) setAgentId(defaultAgent); }, [defaultAgent]);

  return (
    <div className="text-sm">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <button className="btn" onClick={()=>setTab('overview')}>Overview</button>
        <button className="btn" onClick={()=>setTab('policies')}>Policies</button>
        <button className="btn" onClick={()=>setTab('tools')}>Tools</button>
      </div>
      {tab === 'overview' && (
        <div>
          {health.map(h => (
            <div key={h.id} style={{marginBottom:8}}>
              <span style={{marginRight:6}}>{h.name}</span> <span>{h.status}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'policies' && (
        <div style={{display:'grid', gap:12}}>
          <div>
            <div style={{fontWeight:600, marginBottom:6}}>Global Policies</div>
            <label style={{display:'flex', alignItems:'center', gap:6}}>
              <input type="checkbox" onChange={(e)=>toProposal({ path: `/policies/askWhenUncertain`, value: e.target.checked, title: 'Toggle askWhenUncertain', labels:['agents','policies'] })} /> askWhenUncertain
            </label>
            <div style={{display:'flex', gap:8, alignItems:'center', marginTop:6}}>
              <span>Max risk:</span>
              {(['low','medium','high'] as const).map(r => (
                <label key={r} style={{marginRight:8}}>
                  <input name="maxRisk" type="radio" onChange={()=>toProposal({ path:`/policies/maxRisk`, value: r, title:`Set maxRisk=${r}`, labels:['agents','policies'] })} /> {r}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'tools' && (
        <div style={{display:'grid', gap:12}}>
          <div>
            <div style={{fontWeight:600, marginBottom:6}}>RAG</div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span className="muted">Indexer:</span>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: ragStatus==='online' ? '#059669' : ragStatus==='offline' ? '#dc2626' : '#9CA3AF', display: 'inline-block' }} />
              <span className="muted" style={{fontSize:12}}>{ragStatus}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
              <span className="muted">Search:</span>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: searchStatus==='online' ? '#059669' : searchStatus==='offline' ? '#dc2626' : '#9CA3AF', display: 'inline-block' }} />
              <span className="muted" style={{fontSize:12}}>{searchStatus}</span>
              <button className="btn" disabled={searchStatus!=='online'} onClick={async ()=>{
                try {
                  const r = await fetch('/api/tools/rag/search', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ indexId, query: 'agent policies', topK: 5 }) });
                  const j = await r.json();
                  const res = Array.isArray(j?.hits) ? j.hits : [];
                  setSearchOut(JSON.stringify(res, null, 2));
                } catch (e:any) { setSearchOut(`error: ${e?.message||e}`); }
              }}>Test Search</button>
            </div>
            {!!searchOut && (
              <pre style={{marginTop:8, fontSize:12}}>{searchOut}</pre>
            )}
            <div style={{display:'grid', gap:8, marginTop:12}}>
              <div style={{display:'flex', gap:8}}>
                <label style={{display:'grid', gap:4}}>
                  <span className="muted" style={{fontSize:12}}>Agent</span>
                  {loadingAgents ? (
                    <div>Loading agents…</div>
                  ) : agents.length ? (
                    <select value={agentId} onChange={e=>setAgentId(e.target.value)}>
                      {agents.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                  ) : (
                    <input value={agentId} onChange={e=>setAgentId(e.target.value)} placeholder="e.g. ui_agent" pattern="^[a-zA-Z0-9_\-:.]+$" title="Letters, numbers, _ - : ." />
                  )}
                </label>
                {(!loadingAgents && agents.length===0) && (
                  <div className="ff-help">
                    No agents in <code>logic.json</code> — using your input. On attach, a RAG config will be created under:
                    <div><code>/logic/agents/{agentId || '<your-id>'}/rag/indices</code></div>
                  </div>
                )}
                <label style={{display:'grid', gap:4}}>
                  <span className="muted" style={{fontSize:12}}>Index ID</span>
                  <input value={indexId} onChange={e=>setIndexId(e.target.value)} placeholder="docs" aria-invalid={!!validateId(indexId,'Index ID')} pattern="^[A-Za-z0-9._:-]{1,64}$" />
                  {validateId(indexId,'Index ID') && <div className="ff-help ff-help-error">{validateId(indexId,'Index ID')}</div>}
                </label>
              </div>
              <div>
                <button className="btn" disabled={busy || ragStatus!=='online' || !agentId || !indexId || !!validateId(indexId,'Index ID')} title={ragStatus!=='online' ? 'Indexer offline' : undefined} onClick={async () => {
                  if (validateId(indexId,'Index ID')) return;
                  setBusy(true);
                  try {
                    const idem = (crypto as any)?.randomUUID?.() || Math.random().toString(36);
                    await toProposal({ path: `/logic/agents/${agentId}/rag/indices/-`, value: { id: indexId, provider: 'fs.local', topK: 5 }, title: `Attach index ${indexId} to ${agentId}`, labels: ['agents','rag'] });
                    push({ kind:'success', text: `Attached index '${indexId}' to ${agentId} • ${String(idem).slice(-6)}` });
                  } catch (e:any) { push({ kind:'error', text: e?.message || String(e) }); } finally { setBusy(false); }
                }}>Attach Index</button>
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontWeight:600, marginBottom:6}}>Build Index</div>
                <textarea rows={4} placeholder="Paste small text to index (MVP)" value={ingestText} onChange={e=>setIngestText(e.target.value)} />
                <div style={{marginTop:6}}>
                  <button className="btn" disabled={busy || !indexId || !ingestText || !!validateId(indexId,'Index ID')} onClick={async ()=>{
                    setBusy(true);
                    try {
                      const docId = `doc_${Date.now()}`;
                      const r = await fetch('/api/tools/rag/index', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ indexId, docs:[{ id: docId, text: ingestText }] }) });
                      if (r.status === 429) { const ra = r.headers.get('Retry-After'); push({ kind:'warn', text: `Slow down—try again${ra ? ` in ~${ra}s` : ' shortly'}.` }); return; }
                      const j = await r.json().catch(()=>({}));
                      if (j?.ok) push({ kind:'success', text: `Indexed ${j.indexed} doc(s) to ${j.indexId}` }); else push({ kind:'error', text: `Ingest failed: ${j?.error || r.statusText}` });
                    } catch (e:any) { push({ kind:'error', text: e?.message || String(e) }); } finally { setBusy(false); }
                  }}>Build Index</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
