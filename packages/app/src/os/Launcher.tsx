import { WM } from './windowing';

const APPS = [
  { id:'mermaid', label:'Mermaid', icon:'🜲' },
  { id:'assistant', label:'Assistant', icon:'🤖' },
  { id:'publish', label:'Publish', icon:'📤' },
  { id:'agents', label:'Agents', icon:'🧠' },
  { id:'tools', label:'Tools', icon:'🔧' },
  { id:'settings', label:'Settings', icon:'⚙️' },
  { id:'processes', label:'Processes', icon:'⚡' },
  { id:'logs', label:'Kernel Logs', icon:'📋' },
  { id:'approvals', label:'Approvals', icon:'✅' },
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
          <button key={a.id} className="ff-app-btn" onClick={() => WM.open(a.id as any)} aria-label={a.label}>
            <span className="app-icon">{a.icon}</span>
            <span className="visually-hidden">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
