import { useEffect, useState } from "react";
import { readGateSummary, type GateSummary } from "./readers";

export function GateBadges(){
  const [s,setS]=useState<GateSummary|null>(null);
  useEffect(()=>{ let m=true; const f=async()=>m&&setS(await readGateSummary()); f(); const t=setInterval(f,10000); return ()=>{m=false;clearInterval(t)};},[]);
  const g=s?.gates||{};
  const pill=(label:string,state?:string)=> <span style={{border:'1px solid var(--border)', padding:'2px 6px', borderRadius:999, fontSize:12, marginRight:6}}>{label}: {state||"unknown"}</span>;
  return <div className="gate-badges">{pill("Tests",g.tests?.state)}{pill("A11y",g.a11y?.state)}{pill("Lint/Build",g.lintBuild?.state)}{s?.updatedAt&&<span style={{marginLeft:8, opacity:.7, fontSize:12}}>updated {new Date(s.updatedAt).toLocaleTimeString()}</span>}</div>;
}
