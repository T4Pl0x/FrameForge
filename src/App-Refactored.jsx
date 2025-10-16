import React from 'react';

export default function AppRefactored(){
  return (
    <div style={{display:'grid', gridTemplateColumns:'280px 1fr 360px', gridTemplateRows:'1fr 28px', height:'100vh'}}>
      <aside style={{gridColumn:'1', gridRow:'1', background:'#161a22', color:'#e5e7eb', padding:'8px'}}>Dock (stub)</aside>
      <main style={{gridColumn:'2', gridRow:'1', background:'#0f1115', color:'#e5e7eb', padding:'8px'}}>Workspace Surface (stub)</main>
      <section style={{gridColumn:'3', gridRow:'1', background:'#161a22', color:'#e5e7eb', padding:'8px'}}>Tasks / Approvals (stub)</section>
      <footer style={{gridColumn:'1 / span 3', gridRow:'2', background:'#0b0e13', color:'#9ca3af', padding:'4px 8px'}}>Bottom Status Bar (stub)</footer>
    </div>
  );
}

