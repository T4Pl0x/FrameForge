import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

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
      server.middlewares.use('/__ff/write-report', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const { files } = JSON.parse(body || '{}');
            if (!Array.isArray(files) || files.length > 20) throw new Error('invalid');
            const allowed = (p: string) => p.startsWith('/.echo/') || p.startsWith('/frameforge/reports/');
            const fs = require('node:fs'), path = require('node:path');
            for (const f of files) {
              if (!allowed(f.path)) throw new Error('path not allowed');
              const abs = path.join(process.cwd(), f.path.replace(/^\//, ''));
              fs.mkdirSync(path.dirname(abs), { recursive: true });
              fs.writeFileSync(abs, JSON.stringify(f.json, null, 2));
            }
            res.statusCode = 200; res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
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
    }
  }
});
