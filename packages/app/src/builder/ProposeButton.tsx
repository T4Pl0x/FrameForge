import React from "react";

type Props = { specPath?: string; target?: "web"|"desktop"; outDir?: string };

export function ProposeButton({ specPath="builder-output.json", target="web", outDir="packages/ext-demoapp-web" }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ticketId?:string; proposalArtifact?:string} | null>(null);
  async function onClick() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/__ff/propose", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ spec: specPath, target, out: outDir }),
      });
      const json = await res.json();
      setResult({ ticketId: json.ticketId, proposalArtifact: json.proposalArtifact });
    } catch (e) {
      setResult({ ticketId: undefined, proposalArtifact: "ERROR" });
    } finally { setBusy(false); }
  }
  return (
    <div style={{display:"inline-flex", alignItems:"center", gap:8}}>
      <button onClick={onClick} disabled={busy} style={{padding:"6px 10px", borderRadius:8}}>
        {busy ? "Proposing…" : "Propose from Builder"}
      </button>
      {result?.ticketId && (
        <code title={result.proposalArtifact}>ticketId: {result.ticketId}</code>
      )}
    </div>
  );
}

