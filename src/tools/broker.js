import registry from '../../tools/registry.json';

const toolMap = new Map();
for (const t of (registry.tools || [])) toolMap.set(t.id || t.name, t);

const GH_API = 'https://api.github.com';

// Simple token-bucket limiter for GH calls (self-heal/backoff)
function createLimiter({ rpm = 60, burst = 10 } = {}) {
  const capacity = Math.max(burst, Math.ceil(rpm / 10));
  let tokens = capacity;
  let lastRefill = Date.now();
  const refillInterval = 60000; // 1 min
  function refill() {
    const now = Date.now();
    const elapsed = now - lastRefill;
    if (elapsed > 0) {
      const add = Math.floor((elapsed / refillInterval) * rpm);
      if (add > 0) {
        tokens = Math.min(capacity, tokens + add);
        lastRefill = now;
      }
    }
  }
  async function wait() {
    for (;;) {
      refill();
      if (tokens > 0) { tokens -= 1; return; }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return { wait };
}

const limiter = createLimiter({ rpm: 300, burst: 30 });

async function limitedFetch(url, opts = {}, { retries = 2, backoffMs = 800, timeoutMs = 12000 } = {}) {
  await limiter.wait();
  let last;
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...(opts || {}), signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429 || res.status === 403) {
        await new Promise(r => setTimeout(r, backoffMs * (i + 1) + Math.floor(Math.random()*200)));
        last = res; continue;
      }
      return res;
    } catch (e) {
      clearTimeout(timer);
      last = e;
    }
  }
  // final attempt without limiter timeout
  return fetch(url, opts);
}

export async function call(toolId, action, payload) {
  const entry = toolMap.get(toolId);
  if (!entry) throw new Error(`Unknown tool: ${toolId}`);
  // Permissions: allow by default; if explicit array, enforce
  const perms = entry.permissions;
  if (Array.isArray(perms) && !perms.includes(action)) throw new Error(`Not permitted: ${toolId}.${action}`);
  // Placeholder: real MCP call would go here; return mocked status
  if (toolId === 'rag_indexer' && action === 'status') {
    return { ok: true, tool: toolId, action, status: 'green' };
  }
  return { ok: true, tool: toolId, action, payload, status: 'mocked' };
}

async function ghGET(path, token) {
  const r = await limitedFetch(`${GH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

async function downloadArtifactJsonZip(owner, repo, artifactId, token) {
  try {
    const r = await limitedFetch(`${GH_API}/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) return null;
    const blob = await r.blob();
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(blob);
    const entry = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.json'));
    if (!entry) return null;
    const text = await zip.files[entry].async('string');
    try { return JSON.parse(text); } catch { return null; }
  } catch { return null; }
}

export const broker = {
  health: {
    async publish({ token }) {
      try {
        if (!token) return { status: 'unknown' };
        const r = await limitedFetch(`${GH_API}/rate_limit`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
        if (!r.ok) return { status: r.status === 401 ? 'unauthorized' : (r.status === 403 ? 'forbidden' : 'offline') };
        return { status: 'online' };
      } catch { return { status: 'offline' }; }
    },
    async sandbox({ owner, repo, workflow = 'frameforge_sandbox.yml', token }) {
      try {
        if (!owner || !repo || !token) return { status: 'unknown' };
        const url = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/runs?per_page=1`;
        const r = await ghGET(url, token);
        const ok = Array.isArray(r?.workflow_runs);
        return { status: ok ? 'online' : 'offline' };
      } catch { return { status: 'offline' }; }
    }
  },
  sandbox: {
    async latestRun({ owner, repo, workflow, branch, event = 'repository_dispatch', since, token }) {
      const params = new URLSearchParams();
      params.set('event', event);
      params.set('per_page', '5');
      if (branch) params.set('branch', branch);
      const url = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/runs?${params.toString()}`;
      const data = await ghGET(url, token);
      const runs = Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
      const sinceMs = Number(since || 0);
      const filtered = runs.filter(r => !sinceMs || (new Date(r.created_at).getTime() >= sinceMs));
      const run = filtered[0] || runs[0] || null;
      return run || null;
    },
  },
  ci: {
    async dispatchRepositoryEvent({ owner, repo, token, event_type, client_payload }) {
      const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/dispatches`;
      const r = await fetch(`${GH_API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type, client_payload })
      });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `${path} -> ${r.status}`);
      }
      return { ok: true };
    },
    async dispatchWorkflow({ owner, repo, workflow, branch, inputs, token }) {
      const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`;
      const r = await fetch(`${GH_API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: branch, inputs })
      });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `${path} -> ${r.status}`);
      }
      return { ok: true };
    }
  },
  artifacts: {
    async list({ owner, repo, runId, token }) {
      const data = await ghGET(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs/${runId}/artifacts`, token);
      return (Array.isArray(data?.artifacts) ? data.artifacts : []).map(a => ({ id: a.id, name: a.name, url: a.archive_download_url }));
    },
    async getJson({ owner, repo, runId, name, token }) {
      const arts = await this.list({ owner, repo, runId, token });
      const match = arts.find(a => a.name === name || a.name.includes((name || '').replace('.json','')));
      if (!match) return null;
      return downloadArtifactJsonZip(owner, repo, match.id, token);
    },
  },
  vcs: {
    async findPRForHead({ owner, repo, head, token }) {
      const prs = await ghGET(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?head=${encodeURIComponent(head)}&state=all&per_page=1`, token);
    return Array.isArray(prs) && prs.length ? prs[0] : null;
    }
  }
};
