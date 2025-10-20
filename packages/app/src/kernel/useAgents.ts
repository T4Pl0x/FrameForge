import { useEffect, useState } from "react";
import { kernel } from "../kernel";

const ID_RE = /^[a-zA-Z0-9_\-:.]+$/;

export function useAgents() {
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let off: undefined | (() => void);
    (async () => {
      try {
        const logic: any = await (kernel as any).host?.spec?.read?.("logic.json");
        const ids = Array.isArray(logic?.agents) ? logic.agents.map((a: any) => a?.id).filter((x: any) => typeof x === 'string' && ID_RE.test(x)) : [];
        setAgents(ids);
        off = (kernel as any).events?.on?.('spec.applied', (evt: any) => {
          try {
            const p = String(evt?.paths?.[0] || '');
            if (p.endsWith('/logic.json')) {
              (kernel as any).host?.spec?.read?.("logic.json").then((next: any) => {
                const nextIds = Array.isArray(next?.agents) ? next.agents.map((a: any) => a?.id).filter((x: any) => typeof x === 'string' && ID_RE.test(x)) : [];
                setAgents(nextIds);
              }).catch(()=>{});
            }
          } catch {}
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load agents");
      } finally {
        setLoading(false);
      }
    })();
    return () => { try { off && off(); } catch {} };
  }, []);

  return { agents, loading, err };
}

