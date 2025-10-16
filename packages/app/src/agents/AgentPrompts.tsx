import React, { useMemo, useState } from 'react';
import { usePublishedPrompts } from './usePublishedPrompts';
import { EPG } from '@frameforge/shared/src/agent.epg';
import type { PromptDraft } from '@frameforge/shared/src/prompt.types';
import { expandTokens } from '../prompt-lab/Tokens';
import { kernel } from '../kernel';

function mergePreview(d: PromptDraft){
  const t = expandTokens(d.tokens || []);
  return [d.parts.goal, d.parts.constraints, t, d.parts.style, d.parts.steps, d.parts.critique]
    .filter(Boolean).join('\n\n');
}

export function AgentPrompts(){
  const published = usePublishedPrompts();
  const [agentId, setAgentId] = useState('Orchestrator');
  const [pickA, setPickA] = useState<string>('');
  const [pickB, setPickB] = useState<string>('');
  const a = useMemo(() => published.find(p => p.id === pickA)?.draft, [published, pickA]);
  const b = useMemo(() => published.find(p => p.id === pickB)?.draft, [published, pickB]);
  const [outA, setOutA] = useState<{ output: string, score?: number, notes?: string }|null>(null);
  const [outB, setOutB] = useState<{ output: string, score?: number, notes?: string }|null>(null);
  const [msg, setMsg] = useState('');

  async function runOne(which: 'A'|'B'){
    const draft = which === 'A' ? a : b;
    if (!draft) return;
    const result = await EPG.runPrompt(draft);
    const evalRes = await EPG.evaluate(draft, result);
    const payload = { output: result.output, score: evalRes.score, notes: evalRes.notes };
    which === 'A' ? setOutA(payload) : setOutB(payload);
  }

  async function bindPrompt(which: 'A'|'B'){
    const draft = which === 'A' ? a : b;
    if (!draft) return;
    const path = `/bindings/agents/${agentId}/prompt`;
    const diffs = [ { op: 'add', path, value: { id: draft.id, version: draft.version } } ];
    const ticket = kernel.host.proposals.submit({
      title: `Bind ${draft.id} to ${agentId}`,
      rationale: 'Agent prompt binding',
      labels: ['agents','prompts', `agent:${agentId}`, `prompt:${draft.id}`],
      scope: ['logic'],
      sourceExtension: '@frameforge/app/agents',
      diffs
    });
    setMsg(`Created proposal ${ticket.id} to bind ${draft.id}`);
  }

  return (
    <div className="text-sm">
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <label>Agent: <select value={agentId} onChange={e=>setAgentId(e.target.value)}>
          <option>Orchestrator</option>
          <option>KnowledgeOps</option>
        </select></label>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <section className="widget">
          <div className="widget-title">Prompt A</div>
          <select value={pickA} onChange={e=>setPickA(e.target.value)}>
            <option value="">Select a prompt…</option>
            {published.map(p => (<option key={p.id} value={p.id}>{p.id}</option>))}
          </select>
          {a && (
            <>
              <pre style={{whiteSpace:'pre-wrap', marginTop:8}}>{mergePreview(a)}</pre>
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <button className="btn" onClick={()=>runOne('A')}>Run A</button>
                <button className="btn" onClick={()=>bindPrompt('A')}>Use Prompt</button>
              </div>
              {outA && (
                <div className="widget" style={{marginTop:8}}>
                  <div className="widget-title">A • Scorecard</div>
                  <div>Score: {outA.score}</div>
                  <div style={{marginTop:6}}>Output:</div>
                  <pre style={{whiteSpace:'pre-wrap'}}>{outA.output}</pre>
                </div>
              )}
            </>
          )}
        </section>
        <section className="widget">
          <div className="widget-title">Prompt B</div>
          <select value={pickB} onChange={e=>setPickB(e.target.value)}>
            <option value="">Select a prompt…</option>
            {published.map(p => (<option key={p.id} value={p.id}>{p.id}</option>))}
          </select>
          {b && (
            <>
              <pre style={{whiteSpace:'pre-wrap', marginTop:8}}>{mergePreview(b)}</pre>
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <button className="btn" onClick={()=>runOne('B')}>Run B</button>
                <button className="btn" onClick={()=>bindPrompt('B')}>Use Prompt</button>
              </div>
              {outB && (
                <div className="widget" style={{marginTop:8}}>
                  <div className="widget-title">B • Scorecard</div>
                  <div>Score: {outB.score}</div>
                  <div style={{marginTop:6}}>Output:</div>
                  <pre style={{whiteSpace:'pre-wrap'}}>{outB.output}</pre>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {!!msg && <div className="muted" style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}

