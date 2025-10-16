import React, { useEffect, useState } from 'react';
import { useAgentHealth } from './useAgentHealth';
import { toProposal } from './policies';
import { FLAGS } from '../flags';
import { AgentPrompts } from './AgentPrompts';

export default function AgentPanel(){
  const health = useAgentHealth();
  const [tab, setTab] = useState<'overview'|'prompts'>('overview');
  useEffect(() => { /* mount stub */ }, []);
  return (
    <div className="text-sm">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <button className="btn" onClick={()=>setTab('overview')}>Overview</button>
        {FLAGS.PROMPT_LAB && <button className="btn" onClick={()=>setTab('prompts')}>Prompts</button>}
      </div>
      {tab === 'overview' && (
        <div>
          {health.map(h => (
            <div key={h.id} style={{marginBottom:8}}>
              <span style={{marginRight:6}}>{h.name}</span> <span>{h.status}</span>
              <div>
                <label>
                  <input type="checkbox" onChange={() => toProposal({ path: `/agents/${h.id}/policies/askWhenUncertain`, value: true })} /> askWhenUncertain
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'prompts' && FLAGS.PROMPT_LAB && (
        <AgentPrompts />
      )}
    </div>
  );
}
