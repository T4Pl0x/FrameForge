import React, { useEffect, useMemo, useState } from 'react';
import { listIndices, search } from './adapters';
import { createBrokerContext } from '../broker/index';

export function RagPanel() {
  const [indices, setIndices] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => { (async () => setIndices(await listIndices()))(); }, []);

  async function onSearch(){
    setError(''); setHits([]);
    try {
      // Use broker with minimal permission set for MCP calls
      const broker = createBrokerContext(new Set(['broker:mcp']));
      // In a real impl, target a specific tool id; here we mock via mcp/search_docs
      await broker.call({ type: 'mcp/search_docs', payload: { q } });
      setHits(await search(q));
    } catch (e: any) {
      setError(e?.message || 'search failed');
    }
  }

  const healthSummary = useMemo(() => {
    const total = indices.length;
    const online = indices.filter(i => i.health === '🟢').length;
    const red = indices.filter(i => i.health === '🔴').length;
    return `${online}/${total} healthy${red ? `, ${red} down` : ''}`;
  }, [indices]);

  return (
    <div className="text-sm">
      <div className="widget-title">RAG Indices</div>
      <div className="muted" style={{marginBottom:8}}>{healthSummary || 'No indices'}</div>
      <ul style={{display:'grid', gap:6, paddingLeft:16}}>
        {indices.map(i => (
          <li key={i.id}>{i.id} — {i.health}</li>
        ))}
      </ul>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <input placeholder="search docs" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={onSearch}>Search</button>
      </div>
      {error && <div className="muted" style={{color:'#ef4444', marginTop:6}}>{error}</div>}
      <ul style={{marginTop:8, display:'grid', gap:6}}>
        {hits.map((h, i) => (<li key={i}>{h.title}</li>))}
      </ul>
    </div>
  );
}
