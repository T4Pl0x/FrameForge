import { useEffect, useMemo, useState } from 'react';
import { readGateSummary, GateState } from '../gates/readers';

export type AgentHealth = { id: string; name: string; status: 'green'|'red'|'yellow'|'unknown' };

const map = (s: GateState): AgentHealth['status'] =>
  s === 'passing' ? 'green' : s === 'failing' ? 'red' : s === 'warning' ? 'yellow' : 'unknown';

export function useAgentHealth(pollMs = 5000): AgentHealth[] {
  const [now, setNow] = useState(0);
  const [data, setData] = useState<{ tests: AgentHealth['status']; a11y: AgentHealth['status']; lintBuild: AgentHealth['status'] }>({ tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown' });

  useEffect(() => {
    let mounted = true;
    let t: any;
    const tick = async () => {
      try {
        const s = await readGateSummary();
        if (!mounted) return;
        setData({
          tests: map(s.gates?.tests?.state || 'unknown' as GateState),
          a11y: map(s.gates?.a11y?.state || 'unknown' as GateState),
          lintBuild: map(s.gates?.lintBuild?.state || 'unknown' as GateState),
        });
        setNow(Date.now());
      } catch { /* ignore */ }
    };
    tick();
    t = setInterval(tick, pollMs);
    return () => { mounted = false; if (t) clearInterval(t); };
  }, [pollMs]);

  return useMemo<AgentHealth[]>(() => ([
    { id: 'tests', name: 'Tests', status: data.tests },
    { id: 'a11y', name: 'A11y', status: data.a11y },
    { id: 'lintBuild', name: 'Lint/Build', status: data.lintBuild },
  ]), [data.tests, data.a11y, data.lintBuild, now]);
}

