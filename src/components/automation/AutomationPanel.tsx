import React, { useMemo, useState } from 'react';
import { broker } from '../../tools/broker.js';

type Props = {
  defaultOwner?: string;
  defaultRepo?: string;
  defaultBranch?: string;
  defaultWorkflow?: string;
};

export default function AutomationPanel({ defaultOwner = '', defaultRepo = '', defaultBranch = 'main', defaultWorkflow = 'copilot-refactor.yml' }: Props){
  const [owner, setOwner] = useState(defaultOwner);
  const [repo, setRepo] = useState(defaultRepo);
  const [branch, setBranch] = useState(defaultBranch);
  const [workflow, setWorkflow] = useState(defaultWorkflow);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<string>('');

  const ready = useMemo(() => !!(owner && repo && token), [owner, repo, token]);

  async function dispatchRepoEvent(){
    try {
      setStatus('Dispatching repository event…');
      await broker.ci.dispatchRepositoryEvent({ owner, repo, token, event_type: 'frameforge_automation', client_payload: { branch, workflow } });
      setStatus('Repository event dispatched');
    } catch (e: any) {
      setStatus(`Failed: ${e?.message || e}`);
    }
  }

  async function dispatchWorkflow(){
    try {
      setStatus('Dispatching workflow…');
      await broker.ci.dispatchWorkflow({ owner, repo, workflow, branch, inputs: {}, token });
      setStatus('Workflow dispatched');
    } catch (e: any) {
      setStatus(`Failed: ${e?.message || e}`);
    }
  }

  return (
    <section className="widget">
      <div className="widget-title">Automation</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Owner</span>
          <input value={owner} onChange={(e)=>setOwner(e.target.value)} placeholder="acme-corp" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Repo</span>
          <input value={repo} onChange={(e)=>setRepo(e.target.value)} placeholder="FrameForge" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Branch</span>
          <input value={branch} onChange={(e)=>setBranch(e.target.value)} placeholder="main" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Workflow file</span>
          <input value={workflow} onChange={(e)=>setWorkflow(e.target.value)} placeholder="copilot-refactor.yml" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Token</span>
          <input value={token} onChange={(e)=>setToken(e.target.value)} placeholder="ghp_…" type="password" />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={!ready} onClick={dispatchRepoEvent}>Dispatch Repo Event</button>
          <button disabled={!ready} onClick={dispatchWorkflow}>Dispatch Workflow</button>
        </div>
        {status && <div className="muted">{status}</div>}
      </div>
    </section>
  );
}

