import React from 'react';

type Host = {
  openWindow: (opts: { title: string; render: () => React.ReactNode }) => string;
  proposals: { submit: (payload: any) => any };
};

function TodoApp({ host }: { host: Host }){
  return (
    <div>
      <h3 style={{marginTop:0}}>Hello Extension: ToDo</h3>
      <p className="muted">This is a minimal extension running as an app window.</p>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button className="btn" onClick={() => {
          const p = host.proposals.submit({
            title: 'Register ext-todo tool',
            rationale: 'Extension requests registry entry',
            labels: ['tools','registry','ext-todo'],
            scope: ['overlays'],
            sourceExtension: '@frameforge/ext-todo',
            diffs: [
              { op: 'add', path: '/__file/tools/registry.json', value: {
                tools: [
                  { id: 'ext_todo', kind: 'extension', endpoint: null, status: 'offline', lastPingISO: null,
                    permissions: { callableBy: ['@frameforge/app'] } }
                ]
              }}
            ]
          });
          console.log('Proposed registry update', p.id);
        }}>Propose Registry Entry</button>
      </div>
    </div>
  );
}

export default function mount(host: Host){
  host.openWindow({ title: 'ToDo', render: () => <TodoApp host={host} /> });
}

