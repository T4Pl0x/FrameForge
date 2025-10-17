import React, { useEffect, useState } from "react";
import { buildSuggestions } from "./suggest";
import { proposePatch } from "./usePropose";

export default function register() {
  return {
    title: "Assistant",
    open: (host: any) => host.WM.open({ title: "Assistant", content: <AssistantPanel host={host} />, width: 680, height: 520 })
  };
}

function AssistantPanel({ host }: { host: any }) {
  const [spec, setSpec] = useState<any>(null);
  const [sugs, setSugs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      // Host should expose a read-only spec snapshot; fallback to fetch if available
      const snap = host?.Spec?.snapshot ? await host.Spec.snapshot() : null;
      setSpec(snap);
      setSugs(await buildSuggestions(snap ?? {}));
    })();
  }, [host]);

  async function apply(patch: any) {
    const r = await proposePatch([patch]);
    alert(r.ok ? "Proposal submitted (check Approvals)" : "Dev propose not available; export JSON patch manually.");
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Suggestions</h3>
      {!sugs.length && <div>No suggestions right now.</div>}
      <ul style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {sugs.map((s: any, i: number) => (
          <li key={i} style={{ border: "1px solid #333", borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 600 }}>{s.title}</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              confidence {(s.confidence*100).toFixed(0)}%
              {s.openQuestions?.length ? ` • openQuestions: ${s.openQuestions.length}` : ""}
            </div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => apply(s.patch)}>Propose change</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
