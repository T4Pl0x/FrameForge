import registry from '../../tools/registry.json';

const toolMap = new Map();
for (const t of registry.tools) toolMap.set(t.name, t);

const GH_API = 'https://api.github.com';

export async function call(toolName, action, payload) {
  const entry = toolMap.get(toolName);
  if (!entry) throw new Error(`Unknown tool: ${toolName}`);
  if (!entry.permissions.includes(action)) throw new Error(`Not permitted: ${toolName}.${action}`);
  // Placeholder: real MCP call would go here; return mocked status
  if (toolName === 'rag_indexer' && action === 'status') {
    return { ok: true, tool: toolName, action, status: 'green' };
  }
  return { ok: true, tool: toolName, action, payload, status: 'mocked' };
}

async function ghGET(path, token) {
  const r = await fetch(`${GH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

async function downloadArtifactJsonZip(owner, repo, artifactId, token) {
  try {
    const r = await fetch(`${GH_API}/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`, {
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
  sandbox: {
    async latestRun({ owner, repo, workflow, since, token }) {
      const url = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/runs?event=repository_dispatch&per_page=5`;
      const data = await ghGET(url, token);
      const runs = Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
      const sinceMs = Number(since || 0);
      const run = runs.find(r => !sinceMs || (new Date(r.created_at).getTime() >= sinceMs));
      return run || null;
    },
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
};
