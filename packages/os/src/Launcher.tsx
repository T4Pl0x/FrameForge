import { WM } from './windowing';

const APPS = [
  { id:'publish', label:'Publish' },
  { id:'agents', label:'Agents' },
  { id:'tools', label:'Tools' },
  { id:'settings', label:'Settings' },
  { id:'processes', label:'Processes' },
  { id:'logs', label:'Kernel Logs' },
  { id:'approvals', label:'Approvals' },
] as const;

export function Launcher(){
  return (
    <div className="ff-launcher">
      <button className="btn" title="Open Launcher" onClick={() => {
        const grid = document.querySelector('.ff-launcher-grid');
        if (grid) grid.classList.toggle('open');
      }}>Start</button>
      <div className="ff-launcher-grid">
        {APPS.map(a => (
          <button key={a.id} className="ff-app-btn" onClick={() => WM.open(a.id as any)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}

