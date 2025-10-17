import React, { useState, useMemo } from "react";
import { proposePatch } from "./usePropose";

// Minimal window app contract: default export registers with host
export default function register() {
  return {
    title: "Mermaid",
    open: (host: any) => {
      host.WM.open({
        title: "Mermaid Diagram",
        content: <MermaidPanel />,
        width: 720, height: 520
      });
    }
  };
}

function MermaidPanel() {
  const [src, setSrc] = useState<string>("graph TD; A-->B; B-->C;");
  const [id, setId] = useState<string>(() => `diag-${Math.random().toString(36).slice(2, 8)}`);
  const preview = useMemo(() => src.trim(), [src]);

  async function onPropose() {
    // RFC6902 add/replace under spec/analysis.json#/diagrams/<id>
    const patch = [{
      op: "add",
      path: "/spec/analysis.json#/diagrams/" + id,
      value: { id, type: "mermaid", source: src, updatedAt: new Date().toISOString() }
    }];
    const r = await proposePatch(patch);
    alert(r.ok ? "Proposal submitted (check Approvals)" : "Could not submit via dev endpoint; export patch manually.");
  }

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <label>
        Diagram ID
        <input value={id} onChange={e => setId(e.target.value)} style={{ width: "100%" }} />
      </label>
      <label>
        Mermaid Source
        <textarea value={src} onChange={e => setSrc(e.target.value)} rows={8} style={{ width: "100%", fontFamily: "monospace" }} />
      </label>
      <div>
        <button onClick={onPropose}>Propose diagram block</button>
      </div>
      <div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Preview (text-only; render engine optional)</div>
        <pre style={{ background: "#111", color: "#ddd", padding: 8, borderRadius: 6 }}>{preview}</pre>
      </div>
    </div>
  );
}
