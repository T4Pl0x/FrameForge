import React, { useEffect, useMemo, useState } from 'react';
import { getRunHistory, subscribe, startRunHistoryTap, getSamplingOn, subscribeSampling } from '../state/runHistory.js';
import { getFilter, setFilter, onFilterChange, matchFilter } from '../state/runHistoryFilter.js';

export default function RunHistoryPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(getRunHistory());
  const [flt, setFlt] = useState(getFilter());
  const [sampling, setSampling] = useState(getSamplingOn());
  useEffect(() => {
    startRunHistoryTap();
    const off = subscribe(() => setItems(getRunHistory()));
    const offF = onFilterChange(() => setFlt(getFilter()));
    const offS = subscribeSampling(() => setSampling(getSamplingOn()));
    const onKey = (e) => { if (e.altKey && (e.key === 'h' || e.key === 'H')) setOpen((v) => !v); };
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener('keydown', onKey);
    window.addEventListener('ff:history:toggle', onToggle);
    return () => { off?.(); offF?.(); offS?.(); window.removeEventListener('keydown', onKey); window.removeEventListener('ff:history:toggle', onToggle); };
  }, []);
  const filtered = useMemo(() => items.filter((e) => matchFilter(e, flt)), [items, flt]);
  const counts = useMemo(() => {
    const all = items.length;
    const p = items.filter((e) => e.type?.startsWith('proposal:')).length;
    const a = items.filter((e) => e.type?.startsWith('apply.')).length;
    const g = items.filter((e) => e.type?.startsWith('gate.')).length;
    return { all, p, a, g };
  }, [items]);
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>
        {open ? 'Hide' : 'Show'} Run History ({items.length}) {sampling ? '(sampling)' : ''}
      </button>
      {open && (
        <div style={{ width: 380, maxHeight: '50vh', overflow: 'auto', marginTop: 8, padding: 8, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, boxShadow: '0 10px 20px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            <button onClick={()=>setFilter('all')} style={{ padding:'2px 6px', borderRadius:6, border:'1px solid #ddd', background: flt==='all' ? '#EEF2FF' : '#fff' }}>All ({counts.all})</button>
            <button onClick={()=>setFilter('proposal')} style={{ padding:'2px 6px', borderRadius:6, border:'1px solid #ddd', background: flt==='proposal' ? '#EEF2FF' : '#fff' }}>Proposals ({counts.p})</button>
            <button onClick={()=>setFilter('apply')} style={{ padding:'2px 6px', borderRadius:6, border:'1px solid #ddd', background: flt==='apply' ? '#EEF2FF' : '#fff' }}>Apply ({counts.a})</button>
            <button onClick={()=>setFilter('gate')} style={{ padding:'2px 6px', borderRadius:6, border:'1px solid #ddd', background: flt==='gate' ? '#EEF2FF' : '#fff' }}>Gates ({counts.g})</button>
          </div>
          {filtered.length === 0 ? (
            <div style={{ fontSize: 12, opacity: .7, padding: 8 }}>No recent events.</div>
          ) : filtered.map((e, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: 12 }}>{e.type}</code>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {e.details?.publishInfo?.reportsUrl && (
                    <a href={e.details.publishInfo.reportsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, textDecoration: 'underline' }}>Reports</a>
                  )}
                  <span style={{ fontSize: 11, opacity: .7 }}>{new Date(e.ts).toLocaleTimeString()}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {e.status && <div>status: <code>{e.status}</code></div>}
                {e.trace_id && <div>trace: <code>{e.trace_id}</code></div>}
                {e.proposal_id && <div>proposal: <code>{e.proposal_id}</code></div>}
                {e.target?.file && <div>file: <code>{e.target.file}{e.target.path ? e.target.path : ''}</code></div>}
              </div>
            </div>
          ))}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { try { navigator.clipboard.writeText(JSON.stringify({ filter: flt, items: filtered }, null, 2)); } catch {} }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' }}>Copy JSON</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
