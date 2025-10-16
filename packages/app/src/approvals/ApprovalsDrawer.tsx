import React from "react";
import { useProposals } from "./useProposals";

export function ApprovalsDrawer() {
  const [refresh, setRefresh] = React.useState(0);
  const proposals = useProposals(refresh);
  const [msg, setMsg] = React.useState<string>("");

  async function onApply(ticketId: string) {
    setMsg("Applying…");
    try {
      const res = await fetch('/__ff/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'apply failed');
      setMsg(`Applied ${ticketId}: ${json.changes} patch(es). Backup: ${json.backup}`);
      setRefresh(x => x + 1);
    } catch (e: any) {
      setMsg(`Apply failed: ${e?.message || e}`);
    }
  }

  return (
    <div className="text-sm">
      <div className="font-medium mb-2">Approvals</div>
      {proposals.length === 0 ? (
        <div className="opacity-70">No pending proposals.</div>
      ) : (
        <ul style={{display:"flex", flexDirection:"column", gap:8}}>
          {proposals.map(p => {
            const perms = (p.data.patches || []).flatMap((x: any) => {
              const v = x?.value; if (!v) return [] as string[];
              if (Array.isArray((v as any).permissions)) return (v as any).permissions as string[];
              return [] as string[];
            });
            return (
            <li key={p.ticketId} style={{border:"1px solid #2a2f3a", borderRadius:8, padding:8}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:600}}>{p.ticketId}</div>
                  <div style={{opacity:.7, fontSize:12}}>{p.data.createdAt}{p.data.appliedAt ? ` • applied ${p.data.appliedAt}` : ''}</div>
                  {perms.length > 0 && (
                    <div style={{opacity:.8, fontSize:12, marginTop:4}}>Permissions requested: {perms.join(', ')}</div>
                  )}
                </div>
                <div style={{display:"flex", gap:8}}>
                  {!p.data.appliedAt && (
                    <button onClick={() => onApply(p.ticketId)} style={{padding:"4px 8px", borderRadius:6}}>
                      Apply
                    </button>
                  )}
                </div>
              </div>
              <details style={{marginTop:6}}>
                <summary>View patches</summary>
                <pre style={{fontSize:12, opacity:.9, marginTop:6}}>{JSON.stringify(p.data.patches, null, 2)}</pre>
              </details>
            </li>
            );
          })}
        </ul>
      )}
      {!!msg && <div style={{marginTop:8, fontSize:12, opacity:.8}}>{msg}</div>}
    </div>
  );
}
