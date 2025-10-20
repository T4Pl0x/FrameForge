import React from "react";
import { useProposals } from "./useProposals";
import { apply } from "@frameforge/kernel/host/apply";

export function ApprovalsDrawer() {
  const [refresh, setRefresh] = React.useState(0);
  const proposals = useProposals(refresh);
  const [msg, setMsg] = React.useState<string>("");
  const [dryRun, setDryRun] = React.useState<boolean>(false);

  async function applyDryRun(ticketId: string){
    try {
      const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
      if (!base) throw new Error('VITE_REPO_ROOT not set');
      const art: any = await import(`/@fs/${base}/frameforge/reports/proposals/${ticketId}.json?${Date.now()}`);
      const data = (art?.default || art) as any;
      const regMod: any = await import(`/@fs/${base}/tools/registry.json?${Date.now()}`);
      const original = (regMod?.default || regMod);
      const patches = Array.isArray(data.patches) ? data.patches : [];
      const next = applyPatches(original, patches);
      setMsg(`Dry-run: would write tools/registry.json with ${patches.length} patch(es):\n` + JSON.stringify(next, null, 2));
    } catch (e: any) {
      setMsg(`Dry-run failed: ${e?.message || e}`);
    }
  }

  function applyPatches(obj: any, arr: any[]) {
    let target = JSON.parse(JSON.stringify(obj));
    for (const p of arr) {
      if (!['add','replace','remove'].includes(p.op)) throw new Error(`Unsupported op: ${p.op}`);
      const [fileRef, jsonPtrRaw] = String(p.path).split('#');
      if (!fileRef.endsWith('/tools/registry.json')) throw new Error('Patch targets unsupported file');
      const segs = (jsonPtrRaw || '')
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean)
        .map((s: string) => s.replace(/~1/g,'/').replace(/~0/g,'~'));
      let parent = target;
      for (let i = 0; i < Math.max(0, segs.length - 1); i++) {
        const k = segs[i];
        if (!(k in parent)) parent[k] = {};
        parent = parent[k];
      }
      const key = segs[segs.length - 1];
      if (p.op === 'add') {
        if (key === undefined) throw new Error('Invalid add path');
        if (Array.isArray(parent) && key === '-') parent.push(p.value);
        else parent[key] = p.value;
      } else if (p.op === 'replace') {
        if (key === undefined) throw new Error('Invalid replace path');
        if (!(key in parent)) throw new Error('Path does not exist for replace');
        parent[key] = p.value;
      } else if (p.op === 'remove') {
        if (key === undefined) throw new Error('Invalid remove path');
        if (Array.isArray(parent)) {
          const idx = Number(key);
          if (Number.isNaN(idx)) throw new Error('remove index must be numeric for arrays');
          parent.splice(idx, 1);
        } else {
          delete parent[key];
        }
      }
    }
    return target;
  }

  async function onApply(ticketId: string) {
    setMsg(dryRun ? "Computing dry-run…" : "Applying…");
    try {
      // Load proposal data
      const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
      if (!base) throw new Error('VITE_REPO_ROOT not set');
      const art: any = await import(`/@fs/${base}/frameforge/reports/proposals/${ticketId}.json?${Date.now()}`);
      const data = (art?.default || art) as any;
      const patches = Array.isArray(data.patches) ? data.patches : [];

      if (patches.length === 0) {
        setMsg(`No patches found in ${ticketId}`);
        return;
      }

      // Use kernel.apply for both dry-run and real apply in production
      // Fall back to dev endpoint only in dev mode
      if (import.meta.env.DEV && !dryRun) {
        // Dev mode real apply - use legacy endpoint
        const res = await fetch('/__ff/apply', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ticketId })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'apply failed');
        setMsg(`Applied ${ticketId} (dev): ${json.changes} patch(es). Backup: ${json.backup}`);
      } else {
        // Production mode or dry-run - use kernel.apply
        const result = await apply(patches, {
          dryRun,
          trace_id: ticketId
        });

        if (dryRun) {
          setMsg(`Dry-run ${ticketId}: would apply ${patches.length} patch(es) with result:\n${JSON.stringify(result.nextJson, null, 2)}`);
        } else {
          setMsg(`Applied ${ticketId}: ${patches.length} patch(es). Backup: ${result.backup}`);
        }
      }

      setRefresh(x => x + 1);
    } catch (e: any) {
      setMsg(`Apply failed: ${e?.message || e}`);
    }
  }

  return (
    <div className="text-sm">
      <div className="font-medium mb-2">Approvals</div>
      <label style={{display:'inline-flex', alignItems:'center', gap:6, marginBottom:8}}>
        <input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)} /> Apply (dry-run)
      </label>
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
                      {dryRun ? 'Preview Apply' : 'Apply'}
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
                        if (!base) throw new Error('VITE_REPO_ROOT not set');
                        const art: any = await import(`/@fs/${base}/frameforge/reports/proposals/${p.ticketId}.json?${Date.now()}`);
                        const data = (art?.default || art) as any;
                        const blob = new Blob([JSON.stringify(data.patches || [], null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${p.ticketId}.patches.json`;
                        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                      } catch (e:any) {
                        setMsg(`Download failed: ${e?.message || e}`);
                      }
                    }}
                    style={{padding:"4px 8px", borderRadius:6}}
                  >
                    Download Patch
                  </button>
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
