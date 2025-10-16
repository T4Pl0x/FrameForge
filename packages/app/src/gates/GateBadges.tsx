import { useEffect, useState } from "react";
import { readGateSummary, type GateSummary } from "./readers";

function cls(state?: string){
  switch(state){
    case 'passing': return 'badge state-passing';
    case 'warning': return 'badge state-warning';
    case 'failing': return 'badge state-failing';
    default: return 'badge state-unknown';
  }
}

export function GateBadges(){
  const [s,setS]=useState<GateSummary|null>(null);
  useEffect(()=>{ let m=true; const f=async()=>m&&setS(await readGateSummary()); f(); const t=setInterval(f,10000); return ()=>{m=false;clearInterval(t)};},[]);
  const g=s?.gates||{};
  return (
    <div className="gate-badges">
      <span className={cls(g.tests?.state)}>Tests: {g.tests?.state||'unknown'}</span>
      <span className={cls(g.a11y?.state)}>A11y: {g.a11y?.state||'unknown'}</span>
      <span className={cls(g.lintBuild?.state)}>Lint/Build: {g.lintBuild?.state||'unknown'}</span>
      {s?.updatedAt && <span style={{marginLeft:8, opacity:.7, fontSize:12}}>updated {new Date(s.updatedAt).toLocaleTimeString()}</span>}
    </div>
  );
}
