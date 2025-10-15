import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import registry from '../../tools/registry.json';
import { broker } from '../tools/broker.js';

function readAutomationCfg() {
  try { const raw = localStorage.getItem('frameforge-refactor-automation'); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

function readEnv(automation) {
  const env = (import.meta && import.meta.env) || {};
  const f = (k, ls) => env[k] || (typeof localStorage !== 'undefined' ? localStorage.getItem(ls) : '') || '';
  const owner = automation.repoOwner || '';
  const repo = automation.repoName || '';
  const ref = automation.branch || '';
  const token = automation.token || '';
  return {
    BROKER_BASE_URL: f('VITE_BROKER_BASE_URL', 'frameforge-broker-base-url'),
    BROKER_TOKEN: f('VITE_BROKER_TOKEN', 'frameforge-broker-token'),
    PUBLISH_WORKFLOW: env.VITE_PUBLISH_WORKFLOW || 'frameforge_publish',
    SANDBOX_WORKFLOW: env.VITE_SANDBOX_WORKFLOW || 'frameforge_sandbox',
    GITHUB_REPO: env.VITE_GITHUB_REPO || (owner && repo ? `${owner}/${repo}` : ''),
    GITHUB_REF: env.VITE_GITHUB_REF || ref,
    GITHUB_ENV: env.VITE_GITHUB_ENV || '',
    CODEOWNERS_REQUIRED: String(env.VITE_CODEOWNERS_REQUIRED || '').toLowerCase() === 'true',
    REPORTS_INDEX_URL: env.VITE_REPORTS_INDEX_URL || (typeof localStorage !== 'undefined' ? localStorage.getItem('frameforge-reports-index-url') : ''),
    CI: (env.CI === true || String(env.CI).toLowerCase() === 'true' || (typeof localStorage !== 'undefined' && String(localStorage.getItem('frameforge-ci')||'').toLowerCase()==='true')) ? 'true' : 'false',
    TOKEN: token,
    owner,
    repo,
    ref,
  };
}

function checkRegistryPermissions() {
  const rd = (registry.tools || []).find(t => t.id === 'repository_dispatch' || t.name === 'repository_dispatch');
  const issues = [];
  if (!rd) {
    issues.push('tools.registry: repository_dispatch');
  } else {
    const callable = (rd.permissions && rd.permissions.callableBy) || rd.permissions?.callableBy || [];
    const ok = Array.isArray(callable) && callable.includes('@frameforge/ext-publish');
    if (!ok) issues.push('repository_dispatch.permissions.callableBy must include @frameforge/ext-publish');
  }
  return issues;
}

export function usePublishConfig() {
  const [automationTick, setAutomationTick] = useState(0);
  const [health, setHealth] = useState({ publish: 'unknown', sandbox: 'unknown' });
  const lastHealthAt = useRef(0);
  const lastHealthISO = useRef('');
  const backoff = useRef(30000);

  useEffect(() => {
    const onCfg = () => setAutomationTick(x => x + 1);
    window.addEventListener('ff:automation:updated', onCfg);
    return () => window.removeEventListener('ff:automation:updated', onCfg);
  }, []);

  const automation = useMemo(() => readAutomationCfg(), [automationTick]);
  const env = useMemo(() => readEnv(automation), [automation]);

  const computeMissing = useCallback((envObj, healthObj) => {
    const missing = [];
    if (!envObj.BROKER_BASE_URL) missing.push('BROKER_BASE_URL');
    if (!envObj.BROKER_TOKEN) missing.push('BROKER_TOKEN');
    if (!envObj.PUBLISH_WORKFLOW) missing.push('PUBLISH_WORKFLOW');
    if (!envObj.SANDBOX_WORKFLOW) missing.push('SANDBOX_WORKFLOW');
    if (!envObj.GITHUB_REPO) missing.push('GITHUB_REPO');
    if (!envObj.GITHUB_REF) missing.push('GITHUB_REF');
    // registry permissions
    missing.push(...checkRegistryPermissions());
    // health
    if (healthObj?.publish !== 'online') missing.push(`broker.health.publish=${healthObj?.publish ?? 'unknown'}`);
    if (healthObj?.sandbox && healthObj.sandbox !== 'online') missing.push(`broker.health.sandbox=${healthObj.sandbox}`);
    return missing;
  }, []);

  const refreshHealth = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastHealthAt.current) < 30000) return; // cache 30s
    lastHealthAt.current = now;
    try {
      const [p, s] = await Promise.all([
        broker.health.publish({ token: env.TOKEN }),
        broker.health.sandbox({ owner: env.owner, repo: env.repo, workflow: env.SANDBOX_WORKFLOW, token: env.TOKEN })
      ]);
      setHealth({ publish: p.status || 'unknown', sandbox: s.status || 'unknown' });
      try { lastHealthISO.current = new Date().toISOString(); } catch {}
      backoff.current = 30000;
    } catch {
      setHealth(h => h || { publish: 'offline', sandbox: 'offline' });
      backoff.current = Math.min(backoff.current * 1.5, 120000);
    }
  }, [env]);

  useEffect(() => { refreshHealth(true); const t = setInterval(refreshHealth, 30000); return () => clearInterval(t); }, [refreshHealth]);

  const missing = useMemo(() => computeMissing(env, health), [env, health, computeMissing]);
  const ready = missing.length === 0;
  const ageMs = (() => { try { return Math.max(0, Date.now() - (lastHealthAt.current||0)); } catch { return 0; } })();
  const healthMeta = { lastPollISO: lastHealthISO.current || undefined, ageMs };
  return { ready, missing, brokerHealth: health, env, retryHealth: () => refreshHealth(true), healthMeta };
}
