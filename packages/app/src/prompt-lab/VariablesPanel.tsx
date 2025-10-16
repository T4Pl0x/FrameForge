import React, { useState } from 'react';

export function VariablesPanel({ onChange }:{ onChange: (vars: Record<string,string>, ctx:{rag:boolean;tools:boolean;memory:boolean}) => void }){
  const [vars, setVars] = useState<Record<string,string>>({});
  const [ctx, setCtx] = useState({ rag:false, tools:false, memory:false });
  function setVar(k:string, v:string){ const next = { ...vars, [k]: v }; setVars(next); onChange(next, ctx); }
  function setCtxField(k:'rag'|'tools'|'memory', v:boolean){ const next = { ...ctx, [k]: v }; setCtx(next); onChange(vars, next); }
  return (
    <div>
      <div className="widget-title">Variables & Context</div>
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <label><input type="checkbox" checked={ctx.rag} onChange={e=>setCtxField('rag', e.target.checked)} /> RAG</label>
        <label><input type="checkbox" checked={ctx.tools} onChange={e=>setCtxField('tools', e.target.checked)} /> Tools</label>
        <label><input type="checkbox" checked={ctx.memory} onChange={e=>setCtxField('memory', e.target.checked)} /> Memory</label>
      </div>
      <div>
        <div className="muted" style={{marginBottom:6}}>Slots</div>
        <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:8}}>
          {Object.entries(vars).map(([k,v]) => (
            <React.Fragment key={k}>
              <input placeholder="name" value={k} disabled />
              <input placeholder="example/default" value={v} onChange={e=>setVar(k, e.target.value)} />
            </React.Fragment>
          ))}
          <React.Fragment>
            <input placeholder="name" onBlur={e=> { const k=e.target.value.trim(); if(k) setVar(k, ''); e.currentTarget.value=''; }} />
            <div className="muted">Add a name, then fill default.</div>
          </React.Fragment>
        </div>
      </div>
    </div>
  );
}

