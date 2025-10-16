import React, { useMemo, useState } from 'react';
import type { PromptDraft } from '@frameforge/shared';
import { TOKENS, expandTokens } from './Tokens';
import { VariablesPanel } from './VariablesPanel';
import { Scorecard } from './Scorecard';
import { kernel } from '../kernel';

export function Composer(){
  const [id, setId] = useState('draft-1');
  const [parts, setParts] = useState({ goal:'', constraints:'', style:'', steps:'', critique:'', schema:'' });
  const [tokens, setTokens] = useState<string[]>([]);
  const [vars, setVars] = useState<Record<string,string>>({});
  const [ctx, setCtx] = useState({ rag:false, tools:false, memory:false });

  const preview = useMemo(() => {
    const t = expandTokens(tokens);
    return [parts.goal, parts.constraints, t, parts.style, parts.steps, parts.critique].filter(Boolean).join('\n\n');
  }, [parts, tokens]);

  function onSave(){
    const draft: PromptDraft = { id, version:'v1', parts, variables:{ slots: vars, context: ctx }, tokens };
    const file = `spec/prompts/${id}.json`;
    const diffs = [ { op:'add', path: `/__file/${file}`, value: draft } ];
    const ticket = kernel.host.proposals.submit({
      title: `Save prompt ${id}`,
      rationale: 'User save from Prompt Lab',
      labels: ['prompts', `file:${file}`],
      scope: ['overlays'],
      sourceExtension: '@frameforge/app/prompt-lab',
      diffs
    });
    // no auto-apply; Approvals UI should show this ticket
    console.log('Proposal created', ticket.id);
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
      <section className="widget">
        <div className="widget-title">Composer</div>
        <div style={{display:'grid', gap:8}}>
          <input placeholder="prompt id" value={id} onChange={e=>setId(e.target.value)} />
          <textarea placeholder="Goal" value={parts.goal} onChange={e=>setParts({...parts, goal:e.target.value})} rows={3} />
          <textarea placeholder="Constraints" value={parts.constraints} onChange={e=>setParts({...parts, constraints:e.target.value})} rows={3} />
          <textarea placeholder="Style" value={parts.style} onChange={e=>setParts({...parts, style:e.target.value})} rows={2} />
          <textarea placeholder="Steps" value={parts.steps} onChange={e=>setParts({...parts, steps:e.target.value})} rows={3} />
          <textarea placeholder="Critique" value={parts.critique} onChange={e=>setParts({...parts, critique:e.target.value})} rows={2} />
          <textarea placeholder="Schema (JSON)" value={parts.schema} onChange={e=>setParts({...parts, schema:e.target.value})} rows={3} />
          <div>
            <div className="muted" style={{marginBottom:6}}>Tokens</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {TOKENS.map(t => (
                <label key={t.id} className="pill">
                  <input type="checkbox" checked={tokens.includes(t.id)} onChange={e => {
                    const checked = e.target.checked; setTokens(curr => checked ? [...new Set([...curr, t.id])] : curr.filter(x=>x!==t.id));
                  }} /> {t.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={onSave}>Save (proposal)</button>
            <button className="btn" onClick={()=>alert('Dry run (stub)')}>Dry Run</button>
          </div>
        </div>
      </section>

      <section className="widget">
        <div className="widget-title">Preview</div>
        <pre style={{whiteSpace:'pre-wrap'}}>{preview || '—'}</pre>
        <div style={{marginTop:12}}>
          <VariablesPanel onChange={(v,c)=>{ setVars(v); setCtx(c); }} />
        </div>
        <div style={{marginTop:12}}>
          <Scorecard />
        </div>
      </section>
    </div>
  );
}

