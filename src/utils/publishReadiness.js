import registry from '../../tools/registry.json';

const REASON_META = {
  BROKER_BASE_URL: { message: 'Broker base URL is not set.', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  BROKER_TOKEN: { message: 'Broker token missing (required for authenticated broker calls).', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  PUBLISH_WORKFLOW: { message: 'Publish workflow name missing (e.g., frameforge_publish).', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  SANDBOX_WORKFLOW: { message: 'Sandbox workflow name missing (e.g., frameforge_sandbox).', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  GITHUB_REPO: { message: 'Target GitHub repository not set (org/repo).', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  GITHUB_REF: { message: 'Target branch not set (e.g., main).', category: 'Config', action: { label: 'Open settings', actionId: 'open_settings' } },
  'tools.registry: repository_dispatch': { message: 'Repository Dispatch tool is not registered in the Tool Registry.', category: 'Permissions', action: { label: 'Open registry', actionId: 'open_registry' } },
  'repository_dispatch.permissions.callableBy must include @frameforge/ext-publish': { message: 'Publish extension lacks permission to call repository_dispatch.', category: 'Permissions', action: { label: 'Open registry', actionId: 'open_registry' } },
  'broker.health.publish=offline': { message: 'Broker publish channel is offline.', category: 'Health', action: { label: 'Retry check', actionId: 'retry_health' } },
  'broker.health.publish=degraded': { message: 'Broker publish channel is degraded.', category: 'Health', action: { label: 'Retry check', actionId: 'retry_health' } },
  'broker.health.publish=unknown': { message: 'Broker publish channel status is unknown.', category: 'Health', action: { label: 'Retry check', actionId: 'retry_health' } },
  'broker.health.sandbox=offline': { message: 'Sandbox channel is offline (gates may not update).', category: 'Health', action: { label: 'Retry check', actionId: 'retry_health' } },
  'broker.health.sandbox=degraded': { message: 'Sandbox channel is degraded (gates may lag).', category: 'Health', action: { label: 'Retry check', actionId: 'retry_health' } },
  'missing tests-report.json': { message: 'Latest run is missing tests-report.json.', category: 'Artifacts', action: { label: 'Open reports', actionId: 'open_reports' } },
  'missing a11y-report.json': { message: 'Latest run is missing a11y-report.json.', category: 'Artifacts', action: { label: 'Open reports', actionId: 'open_reports' } },
  'missing lint-build.json': { message: 'Latest run is missing lint-build.json.', category: 'Artifacts', action: { label: 'Open reports', actionId: 'open_reports' } },
  'REPORTS_INDEX_URL shape unexpected': { message: 'Reports index URL does not match expected CI pattern.', category: 'CI', action: { label: 'Open settings', actionId: 'open_settings' } },
};

function asReason(key, kind) {
  const m = REASON_META[key] || {};
  const msg = m.message || key;
  const category = m.category || 'Config';
  const action = m.action || undefined;
  return { key, kind, category, message: msg, action };
}

function maskSecret(s) {
  if (!s) return undefined;
  const tail = String(s).slice(-4);
  const len = Math.max(8, Math.max(0, String(s).length - 4));
  return '•'.repeat(len) + tail;
}

function buildDetails({ env, brokerHealth, healthMeta, latestArtifacts }) {
  const present = new Set(Array.isArray(latestArtifacts?.names) ? latestArtifacts.names : []);
  const neededArts = ['tests-report.json','a11y-report.json','lint-build.json'];
  const repoDispatch = (registry.tools || []).find(t => t.id === 'repository_dispatch' || t.name === 'repository_dispatch');
  const callable = (repoDispatch?.permissions && repoDispatch.permissions.callableBy) || repoDispatch?.permissions?.callableBy || [];
  const callableOk = Array.isArray(callable) && callable.includes('@frameforge/ext-publish');
  return {
    env: {
      BROKER_BASE_URL: env.BROKER_BASE_URL || undefined,
      PUBLISH_WORKFLOW: env.PUBLISH_WORKFLOW || undefined,
      SANDBOX_WORKFLOW: env.SANDBOX_WORKFLOW || undefined,
      GITHUB_REPO: env.GITHUB_REPO || undefined,
      GITHUB_REF: env.GITHUB_REF || undefined,
      BROKER_TOKEN_masked: maskSecret(env.BROKER_TOKEN),
      CI: env.CI === 'true' ? 'true' : 'false',
      REPORTS_INDEX_URL: env.REPORTS_INDEX_URL || undefined,
    },
    registry: {
      hasRepositoryDispatch: Boolean(repoDispatch),
      callableByOk: callableOk,
      endpoint: repoDispatch?.endpoint,
      lastPingISO: repoDispatch?.lastPingISO,
      latencyMs: repoDispatch?.latencyMs,
    },
    health: {
      publish: { status: brokerHealth?.publish ?? 'unknown', lastPollISO: healthMeta?.lastPollISO, ageMs: healthMeta?.ageMs },
      sandbox: { status: brokerHealth?.sandbox ?? 'unknown', lastPollISO: healthMeta?.lastPollISO, ageMs: healthMeta?.ageMs },
    },
    artifacts: {
      present: Array.from(present).filter(n => neededArts.includes(n)),
      missing: neededArts.filter(n => !present.has(n)),
    },
    ci: env.CI === 'true' ? {
      reportsIndexUrl: env.REPORTS_INDEX_URL,
      shapeOk: env.REPORTS_INDEX_URL ? /^https?:\/\/[^/]+\/builds\/[^/]+\/reports\/index\.json$/i.test(env.REPORTS_INDEX_URL) : undefined,
    } : null,
  };
}

export function checkPublishReadiness({ env, brokerHealth, latestArtifacts, healthMeta }) {
  const blocking = [];
  const warnings = [];

  // Required env
  const need = ['BROKER_BASE_URL','BROKER_TOKEN','PUBLISH_WORKFLOW','SANDBOX_WORKFLOW','GITHUB_REPO','GITHUB_REF'];
  for (const k of need) if (!env?.[k]) blocking.push(k);

  // Tool registry + permissions
  const rd = (registry.tools || []).find(t => t.id === 'repository_dispatch' || t.name === 'repository_dispatch');
  if (!rd) blocking.push('tools.registry: repository_dispatch');
  else {
    const callable = (rd.permissions && rd.permissions.callableBy) || rd.permissions?.callableBy || [];
    const ok = Array.isArray(callable) && callable.includes('@frameforge/ext-publish');
    if (!ok) blocking.push('repository_dispatch.permissions.callableBy must include @frameforge/ext-publish');
  }

  // Broker health
  const pub = brokerHealth?.publish ?? 'unknown';
  const sbx = brokerHealth?.sandbox ?? 'unknown';
  if (pub !== 'online') blocking.push(`broker.health.publish=${pub}`);
  if (sbx !== 'online') warnings.push(`broker.health.sandbox=${sbx}`);

  // Artifact presence (warnings only)
  const needed = ['tests-report.json','a11y-report.json','lint-build.json'];
  const have = new Set(Array.isArray(latestArtifacts?.names) ? latestArtifacts.names : []);
  for (const n of needed) if (!have.has(n)) warnings.push(`missing ${n}`);

  // CI-only URL shape check (warning only)
  if (String(env?.CI || '').toLowerCase() === 'true' && env?.REPORTS_INDEX_URL) {
    const ok = /^https?:\/\/[^/]+\/builds\/[^/]+\/reports\/index\.json$/i.test(env.REPORTS_INDEX_URL);
    if (!ok) warnings.push('REPORTS_INDEX_URL shape unexpected');
  }

  const reasons = [
    ...blocking.map(k => asReason(k, 'blocking')),
    ...warnings.map(k => asReason(k, 'warning')),
  ];
  const details = buildDetails({ env, brokerHealth, healthMeta, latestArtifacts });
  return { ready: blocking.length === 0, blocking, warnings, reasons, details };
}
