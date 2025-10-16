import React, { useEffect, useState } from 'react';
import { listIndices, search } from './adapters';

export default function RagPanel(){
  const [indices, setIndices] = useState<any[]>([]);
  const [hits, setHits] = useState<any[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { (async () => setIndices(await listIndices()))(); }, []);
  return (
    <div>
      <h3>RAG Indices</h3>
      <ul>
        {indices.map(i => (<li key={i.id}>{i.id} — {i.health}</li>))}
      </ul>
      <div>
        <input placeholder="search" value={q} onChange={e => setQ(e.target.value)} />
        <button onClick={async () => setHits(await search(q))}>Search</button>
      </div>
      <ul>
        {hits.map((h, i) => (<li key={i}>{h.title}</li>))}
      </ul>
    </div>
  );
}

