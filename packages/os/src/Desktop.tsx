import { useEffect, useRef, useState } from 'react';
import { WM, WinSpec } from './windowing';

function useWindows(){
  const [wins, setWins] = useState<WinSpec[]>(WM.list());
  useEffect(() => WM.subscribe(() => setWins(WM.list())), []);
  return wins;
}
function useActive(){
  const [id, setId] = useState<string | null>(WM.getActive());
  useEffect(() => WM.subscribe(() => setId(WM.getActive())), []);
  return id;
}

function Titlebar({ w }: { w: WinSpec }){
  return (
    <div className="ff-window-titlebar" onMouseDown={() => WM.focus(w.id)}>
      <span className="ff-window-title">{w.title}</span>
      <div className="ff-window-actions">
        <button title="Snap Left" onClick={() => WM.snap(w.id,'left')}>▮◧</button>
        <button title="Maximize" onClick={() => WM.snap(w.id,'max')}>▢</button>
        <button title="Minimize" onClick={() => WM.minimize(w.id)}>—</button>
        <button title="Close" onClick={() => WM.close(w.id)}>✕</button>
      </div>
    </div>
  );
}

export function Desktop({ noDock, renderContent }: { noDock?: boolean; renderContent: (w: WinSpec) => JSX.Element }){
  const wins = useWindows();
  const active = useActive();
  return (
    <div className={"ff-desktop" + (noDock ? " no-dock" : "") }>
      {wins.filter(w => !w.minimized).map(w => (
        <Window key={w.id} w={w} active={active === w.id} renderContent={renderContent} />
      ))}
    </div>
  );
}

function Window({ w, active, renderContent }: { w: WinSpec, active?: boolean, renderContent: (w: WinSpec) => JSX.Element }){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    let startX=0, startY=0, startL=0, startT=0; let dragging=false;
    function onDown(e: MouseEvent){
      const target = e.target as HTMLElement;
      if (!target.closest('.ff-window-titlebar')) return;
      dragging=true; startX=e.clientX; startY=e.clientY; startL=w.x; startT=w.y; WM.focus(w.id); e.preventDefault();
    }
    function onMove(e: MouseEvent){ if(!dragging) return; const dx=e.clientX-startX, dy=e.clientY-startY; w.x=startL+dx; w.y=startT+dy; (el.style.left = w.x+"px"), (el.style.top = w.y+"px"); }
    function onUp(){ dragging=false; }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [w.id, w.x, w.y]);
  return (
    <div ref={ref} className={"ff-window" + (active ? " active" : "")} style={{ left:w.x, top:w.y, width:w.w, height:w.h, zIndex:w.z }} onMouseDown={()=>WM.focus(w.id)}>
      <Titlebar w={w} />
      <div className="ff-window-content">
        {renderContent(w)}
      </div>
    </div>
  );
}

