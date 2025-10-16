import { WM } from "@frameforge/os";
import { FLAGS } from "../flags";

export function AppLauncher(){
  const APPS = [
    { id:'publish', label:'Publish', show:true },
    { id:'agents', label:'Agents', show:true },
    { id:'tools', label:'Tools', show:true },
    { id:'settings', label:'Settings', show:true },
    { id:'processes', label:'Processes', show:true },
    { id:'logs', label:'Kernel Logs', show:true },
    { id:'approvals', label:'Approvals', show:true },
    { id:'prompt-lab', label:'Prompt Lab', show: FLAGS.PROMPT_LAB },
    { id:'builder', label:'Builder', show: FLAGS.BUILDER },
  ] as const;
  return (
    <div className="ff-launcher">
      <button className="btn" title="Open Launcher" onClick={() => {
        const grid = document.querySelector('.ff-launcher-grid');
        if (grid) grid.classList.toggle('open');
      }}>Start</button>
      <div className="ff-launcher-grid">
        {APPS.filter(a=>a.show).map(a => (
          <button key={a.id} className="ff-app-btn" onClick={() => WM.open(a.id as any)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}
