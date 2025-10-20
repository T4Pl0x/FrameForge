import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const DEV = process.env.NODE_ENV !== 'production';
const EXPOSE_DEV = process.env.VITE_EXPOSE_DEV === '1';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@os': path.resolve(__dirname, '../os/src'),
      '@kernel': path.resolve(__dirname, '../kernel/src'),
      '@app': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    configureServer(server) {
      if (!(DEV && EXPOSE_DEV)) return; // opt-in even in dev
      // eslint-disable-next-line no-console
      console.warn('[FF][DEV] Exposing dev-only endpoints: /__ff/*');

      server.middlewares.use('/__ff/write-report', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405; res.end('Method Not Allowed'); return;
          }
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const files = Array.isArray(parsed.files) ? parsed.files : [];
              if (!files.length || files.length > 20) throw new Error('invalid');

              const path = require('node:path');
              const fs = require('node:fs');
              const allow = (p: string) =>
                p.startsWith('/.echo/') || p.startsWith('/frameforge/reports/');

              for (const f of files) {
                if (!f || typeof f.path !== 'string' || !allow(f.path)) {
                  throw new Error('path not allowed');
                }
                const rel = f.path.replace(/^\//, '');
                const abs = path.join(process.cwd(), rel);
                fs.mkdirSync(path.dirname(abs), { recursive: true });
                fs.writeFileSync(abs, JSON.stringify(f.json ?? {}, null, 2));
              }
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ ok: true, wrote: files.length }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
        } catch (e) {
          res.statusCode = 500; res.end(String(e));
        }
      });

      server.middlewares.use('/__ff/propose', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let buf = '';
        req.on('data', (c) => { buf += c; });
        req.on('end', () => {
          try {
            const body = JSON.parse(buf || '{}');
            const args = [
              'packages/shared/codegen/ff-codegen.mjs',
              `--target=${body.target || 'web'}`,
              `--spec=${body.spec || 'builder-output.json'}`,
              `--out=${body.out || 'packages/ext-demoapp-web'}`,
              `--mode=proposal`
            ];
            const p = spawn('node', args, { stdio: ['ignore', 'pipe', 'pipe'] });
            let out = '', err = '';
            p.stdout.on('data', d => { out += d.toString(); });
            p.stderr.on('data', d => { err += d.toString(); });
            p.on('close', (code) => {
              res.setHeader('content-type', 'application/json');
              if (code === 0) { res.end(out || '{}'); }
              else { res.statusCode = 500; res.end(JSON.stringify({ error: err || 'codegen failed' })); }
            });
          } catch (e) {
            res.statusCode = 400; res.end(JSON.stringify({ error: (e as any)?.message || 'bad request' }));
          }
        });
      });

      // ---------- APPLY (dev-only) ----------
      server.middlewares.use('/__ff/apply', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let buf = '';
        req.on('data', (c) => { buf += c; });
        req.on('end', () => {
          try {
            const body = JSON.parse(buf || '{}');
            const repoRoot = process.env.VITE_REPO_ROOT || process.env.npm_config_VITE_REPO_ROOT || '';
            const root = repoRoot || (body.repoRoot || '');
            if (!root) { res.statusCode = 400; res.end(JSON.stringify({ error: 'VITE_REPO_ROOT missing' })); return; }

            // Load proposal artifact
            const artifactPath = path.resolve(root, 'frameforge/reports/proposals', `${body.ticketId}.json`);
            if (!fs.existsSync(artifactPath)) {
              res.statusCode = 404; res.end(JSON.stringify({ error: 'proposal not found' })); return;
            }
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            const patches = Array.isArray(artifact.patches) ? artifact.patches : [];
            if (patches.length > 20) { res.statusCode = 400; res.end(JSON.stringify({ error: 'too many patches' })); return; }

            // Ensure registry exists
            const registryPath = path.resolve(root, 'tools/registry.json');
            if (!fs.existsSync(registryPath)) {
              fs.mkdirSync(path.dirname(registryPath), { recursive: true });
              fs.writeFileSync(registryPath, JSON.stringify({ extensions: [] }, null, 2));
            }
            const original = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

            // Restricted patch applier for tools/registry.json only
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
                  .map(s => s.replace(/~1/g,'/').replace(/~0/g,'~'));
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

            let next;
            try {
              next = applyPatches(original, patches);
            } catch (e: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'patch failed', detail: e?.message }));
              return;
            }

            // Backup and write
            const backup = `${registryPath}.bak.${Date.now()}`;
            fs.writeFileSync(backup, JSON.stringify(original, null, 2));
            fs.writeFileSync(registryPath, JSON.stringify(next, null, 2));

            // Mark artifact as applied
            const appliedMark = { ...artifact, appliedAt: new Date().toISOString() };
            fs.writeFileSync(artifactPath, JSON.stringify(appliedMark, null, 2));

            res.setHeader('content-type', 'application/json');
            const nextBody = JSON.stringify(next, null, 2);
            res.end(JSON.stringify({ ok: true, registryPath, backup, changes: patches.length, registry: nextBody }));
          } catch (e: any) {
            res.statusCode = 500; res.end(JSON.stringify({ error: e?.message || 'apply failed' }));
          }
        });
      });

      // ---------- GH PROXY (dev-only) ----------
      async function ghFetch(path: string, init?: RequestInit) {
        const token = process.env.VITE_GH_TOKEN || process.env.GH_TOKEN || '';
        const url = `https://api.github.com${path}`;
        const headers = {
          'Accept': 'application/vnd.github+json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(init?.headers || {}) as any,
        } as Record<string, string>;
        const r = await fetch(url, { ...(init || {}), headers });
        return r;
      }

      server.middlewares.use('/__ff/gh/get', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let buf = '';
        req.on('data', (c) => { buf += c; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(buf || '{}');
            const path = String(body.path || '');
            if (!path.startsWith('/')) throw new Error('invalid path');
            const r = await ghFetch(path, { method: 'GET' });
            const json = await r.json();
            res.setHeader('content-type', 'application/json');
            res.statusCode = r.status;
            res.end(JSON.stringify(json));
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ error: e?.message || 'bad request' }));
          }
        });
      });

      server.middlewares.use('/__ff/gh/post', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let buf = '';
        req.on('data', (c) => { buf += c; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(buf || '{}');
            const path = String(body.path || '');
            if (!path.startsWith('/')) throw new Error('invalid path');
            const r = await ghFetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body.body || {}) });
            const text = await r.text();
            res.setHeader('content-type', 'application/json');
            res.statusCode = r.status;
            res.end(text || '{}');
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ error: e?.message || 'bad request' }));
          }
        });
      });

      server.middlewares.use('/__ff/gh/get-zip-json', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let buf = '';
        req.on('data', (c) => { buf += c; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(buf || '{}');
            const path = String(body.path || '');
            if (!path.startsWith('/')) throw new Error('invalid path');
            const r = await ghFetch(path, { method: 'GET' });
            if (!r.ok) { res.statusCode = r.status; res.end(JSON.stringify({ error: 'fetch failed' })); return; }
            const blob = await r.blob();
            const { default: JSZip } = await import('jszip');
            const zip = await JSZip.loadAsync(blob as any);
            const entry = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.json'));
            if (!entry) { res.statusCode = 404; res.end(JSON.stringify({ error: 'no json in zip' })); return; }
            const text = await zip.files[entry].async('string');
            res.setHeader('content-type', 'application/json');
            res.end(text);
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ error: e?.message || 'bad request' }));
          }
        });
      });

      // ---------- RAG TOOLS (dev-only) ----------
      function sanitizeIndexId(id: string) {
        if (typeof id !== 'string') return '';
        const ok = id.match(/^[a-zA-Z0-9_-]{1,64}$/);
        return ok ? id : '';
      }
      function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
      async function readJsonBody(req: any, maxBytes = 2 * 1024 * 1024) {
        return await new Promise<any>((resolve, reject) => {
          let size = 0; let buf = '';
          req.on('data', (c: any) => { size += c.length; if (size > maxBytes) { reject(new Error('payload_too_large')); req.destroy(); return; } buf += c; });
          req.on('end', () => { try { resolve(JSON.parse(buf || '{}')); } catch { reject(new Error('invalid_json')); } });
          req.on('error', (e: any) => reject(e));
        });
      }
      // simple dev-only rate limiter for RAG index endpoint
      const ragBuckets = new Map<string, { tokens: number; last: number }>();
      const RAG_RPM = 30; const RAG_BURST = 10; const REFILL_MS = 60000 / RAG_RPM;
      function ragRateOk(key: string) {
        const now = Date.now();
        const b = ragBuckets.get(key) || { tokens: RAG_BURST, last: now };
        const elapsed = now - b.last;
        const refill = Math.floor(elapsed / REFILL_MS);
        if (refill > 0) { b.tokens = Math.min(RAG_BURST, b.tokens + refill); b.last = now; }
        if (b.tokens <= 0) { ragBuckets.set(key, b); return false; }
        b.tokens -= 1; ragBuckets.set(key, b); return true;
      }

      async function saveDocsFs(indexId: string, docs: any[]) {
        const fs = await import('node:fs/promises');
        const p = await import('node:path');
        const base = p.join(process.cwd(), '.ff', 'rag', indexId, 'docs');
        await fs.mkdir(base, { recursive: true });
        const now = Date.now();
        for (let i = 0; i < docs.length; i++) {
          const d = docs[i] || {}; const did = String(d.id || `doc_${now}_${i}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const text: string = String(d.text || '').slice(0, 20000); // cap per-doc text
          const meta = d.meta && typeof d.meta === 'object' ? d.meta : {};
          const body = JSON.stringify({ id: did, text, meta }, null, 0);
          await fs.writeFile(p.join(base, `doc-${did}.json`), body);
        }
      }
      async function simpleSearch(indexId: string, query: string, topK = 5) {
        const fs = await import('node:fs/promises');
        const p = await import('node:path');
        const base = p.join(process.cwd(), '.ff', 'rag', indexId, 'docs');
        let files: string[] = [];
        try { files = (await fs.readdir(base)).filter(f => f.endsWith('.json')); } catch { return []; }
        const terms = String(query).toLowerCase().split(/\W+/).filter(Boolean);
        const hits: any[] = [];
        for (const f of files) {
          try {
            const raw = await fs.readFile(p.join(base, f), 'utf8');
            const doc = JSON.parse(raw);
            const text = String(doc.text || '').toLowerCase();
            let score = 0; for (const t of terms) { const m = text.split(t).length - 1; score += m; }
            if (score > 0) hits.push({ id: doc.id, text: String(doc.text || '').slice(0, 500), score, meta: doc.meta || {} });
          } catch { /* ignore */ }
        }
        hits.sort((a, b) => b.score - a.score);
        return hits.slice(0, clamp(topK, 1, 50));
      }

      server.middlewares.use('/api/tools/rag/index', async (req, res) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
          const key = (req.headers['x-forwarded-for'] as string) || (req.socket as any)?.remoteAddress || 'anon';
          if (!ragRateOk(String(key))) { res.setHeader('Retry-After','5'); res.statusCode = 429; res.end(JSON.stringify({ ok:false, error:'rate_limited' })); return; }
          const body = await readJsonBody(req);
          const indexId = sanitizeIndexId(body?.indexId || '');
          const docs = Array.isArray(body?.docs) ? body.docs : [];
          if (!indexId || !docs) { res.statusCode = 400; res.end(JSON.stringify({ ok:false, error:'bad_args' })); return; }
          // basic total size guard
          const totalChars = docs.reduce((n: number, d: any) => n + String(d?.text || '').length, 0);
          if (totalChars > 2 * 1024 * 1024) { res.statusCode = 413; res.end(JSON.stringify({ ok:false, error:'payload_too_large' })); return; }
          await saveDocsFs(indexId, docs);
          res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok:true, indexed: docs.length, indexId }));
        } catch (e: any) { res.statusCode = 400; res.end(JSON.stringify({ ok:false, error: e?.message || 'bad_request' })); }
      });

      server.middlewares.use('/api/tools/rag/search', async (req, res) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
          const body = await readJsonBody(req);
          const indexId = sanitizeIndexId(body?.indexId || '');
          const query = String(body?.query || '');
          const topK = clamp(Number(body?.topK || 5), 1, 50);
          if (!indexId || !query) { res.statusCode = 400; res.end(JSON.stringify({ ok:false, error:'bad_args' })); return; }
          const hits = await simpleSearch(indexId, query, topK);
          res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok:true, hits }));
        } catch (e: any) { res.statusCode = 400; res.end(JSON.stringify({ ok:false, error: e?.message || 'bad_request' })); }
      });
    }
  }
});
