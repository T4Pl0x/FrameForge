import React, { useMemo, useState } from 'react';
import { ProposeButton } from './ProposeButton';
import type { PipelineSpec, PipelineExtensionSpec, PipelineWidget } from '@frameforge/shared/src/pipeline.types';

type Diff = { op: 'add'|'replace'|'remove'; path: string; value?: any };

function makeSpec(appId: string, widgets: PipelineWidget[]): PipelineSpec {
  const ext: PipelineExtensionSpec = {
    name: `@frameforge/ext-${appId}`,
    entry: `packages/ext-${appId}/src/entry.tsx`,
    widgets
  };
  return { version: 'v1', appId, extensions: [ext] };
}

function makePatches(appId: string, spec: PipelineSpec): Diff[] {
  const base = `packages/ext-${appId}`;
  const manifest = {
    name: `@frameforge/ext-${appId}`,
    version: '0.1.0',
    entry: { module: 'src/entry.tsx' },
    capabilities: ['windowApp'],
    permissions: { read: [], propose: [] }
  };
  const entry = `export default function mount(host){ host.openWindow({ title: '${appId}', render: () => 'Hello from ${appId}' }); }\n`;
  return [
    { op: 'add', path: `/__file/${base}/manifest.json`, value: manifest },
    { op: 'add', path: `/__file/${base}/src/entry.tsx`, value: entry },
    { op: 'add', path: `/__file/shared/pipeline.${appId}.json`, value: spec }
  ];
}

export function Builder(){
  const [appId, setAppId] = useState('myapp');
  const [sel, setSel] = useState<Record<string, boolean>>({
    agents: true,
    tools: true,
    approvals: false,
    gates: false
  });

  const widgets = useMemo<PipelineWidget[]>(() => {
    const w: PipelineWidget[] = [];
    if (sel.agents) w.push({ id:'agents', kind:'panel', source:'@frameforge/app/agents' });
    if (sel.tools) w.push({ id:'tools', kind:'panel', source:'@frameforge/app/tools' });
    if (sel.approvals) w.push({ id:'approvals', kind:'panel', source:'@frameforge/app/approvals' });
    if (sel.gates) w.push({ id:'gates', kind:'overlay', source:'@frameforge/app/gates' });
    return w;
  }, [sel]);

  const spec = useMemo(() => makeSpec(appId, widgets), [appId, widgets]);
  const patches = useMemo(() => makePatches(appId, spec), [appId, spec]);

  return (
    <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:12}}>
      <section className="widget">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <div className="widget-title" style={{margin:0}}>No-Code Builder</div>
          <ProposeButton />
        </div>
        <div className="widget-title">Builder</div>
        <div style={{display:'grid', gap:8}}>
          <input value={appId} onChange={e=>setAppId(e.target.value)} placeholder="app id" />
          <label><input type="checkbox" checked={sel.agents} onChange={e=>setSel({...sel, agents:e.target.checked})} /> Agents Panel</label>
          <label><input type="checkbox" checked={sel.tools} onChange={e=>setSel({...sel, tools:e.target.checked})} /> Tools Panel</label>
          <label><input type="checkbox" checked={sel.approvals} onChange={e=>setSel({...sel, approvals:e.target.checked})} /> Approvals Panel</label>
          <label><input type="checkbox" checked={sel.gates} onChange={e=>setSel({...sel, gates:e.target.checked})} /> Gate Badges Overlay</label>
          <div className="muted" style={{fontSize:12}}>This is a dry-run. No files are written.</div>
        </div>
      </section>

      <section className="widget">
        <div className="widget-title">PipelineSpec Preview</div>
        <pre style={{whiteSpace:'pre-wrap', fontSize:12}}>{JSON.stringify(spec, null, 2)}</pre>
        <div className="widget-title" style={{marginTop:12}}>Codegen Patch (preview)</div>
        <pre style={{whiteSpace:'pre-wrap', fontSize:12}}>{JSON.stringify(patches, null, 2)}</pre>
      </section>
    </div>
  );
}
