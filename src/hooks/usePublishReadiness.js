import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePublishConfig } from './usePublishConfig.js';
import { broker } from '../tools/broker.js';
import { checkPublishReadiness } from '../utils/publishReadiness.js';

export function usePublishReadiness() {
  const { env, brokerHealth, retryHealth, healthMeta } = usePublishConfig();
  const [artifacts, setArtifacts] = useState({ names: [] });
  const [artTick, setArtTick] = useState(0);
  const refreshing = useRef(false);

  const refreshArtifacts = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const owner = env.owner; const repo = env.repo; const token = env.TOKEN;
      if (!owner || !repo || !token) { setArtifacts({ names: [] }); return; }
      const run = await broker.sandbox.latestRun({ owner, repo, workflow: env.SANDBOX_WORKFLOW || 'frameforge_sandbox.yml', token });
      if (!run) { setArtifacts({ names: [] }); return; }
      const list = await broker.artifacts.list({ owner, repo, runId: run.id, token });
      setArtifacts({ names: (list || []).map(a => a.name) });
      setArtTick(x => x + 1);
    } catch { /* ignore */ }
    finally { refreshing.current = false; }
  }, [env]);

  useEffect(() => { refreshArtifacts(); }, [refreshArtifacts]);
  const result = useMemo(() => checkPublishReadiness({ env, brokerHealth, latestArtifacts: artifacts, healthMeta }), [env, brokerHealth, artifacts, artTick, healthMeta]);
  return { ...result, env, brokerHealth, refreshArtifacts, retryHealth, healthMeta, artifacts };
}
