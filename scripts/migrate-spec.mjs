#!/usr/bin/env node
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { apply: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') out.apply = true;
    else if (a === '--dry-run') out.apply = false;
    else if (a === '--from') out.from = args[++i];
    else if (a === '--to') out.to = args[++i];
  }
  return out;
}

async function fileExists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const { from, to, apply } = parseArgs();
  if (!from || !to) {
    console.error('Usage: node migrate-spec.mjs --from 1.0.0 --to 1.1.0 [--dry-run|--apply]');
    process.exit(1);
  }
  const migratorPath = path.join(root, 'scripts', 'migrations', `${from}-${to}.mjs`);
  if (!(await fileExists(migratorPath))) {
    console.error(`Missing migrator: ${migratorPath}`);
    process.exit(1);
  }
  const { migrate } = await import(migratorPath);
  const metaPath = path.join(root, 'spec', 'meta.json');
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));

  const files = Object.keys(meta.files || {}).filter((f) => /\.json$/.test(f));
  const patches = await migrate({ root, files });
  if (!Array.isArray(patches)) {
    console.error('Migrator must return an array of RFC6902 patches grouped per file');
    process.exit(1);
  }
  console.log('Proposed patches:\n');
  for (const p of patches) {
    console.log(`- ${p.file}`);
    for (const op of p.patch) console.log(`  ${JSON.stringify(op)}`);
  }
  if (apply) {
    for (const p of patches) {
      const fp = path.join(root, 'spec', p.file);
      const data = JSON.parse(await readFile(fp, 'utf8'));
      // naive apply for replace/add/remove only
      for (const op of p.patch) {
        if (!['add','replace','remove'].includes(op.op)) throw new Error(`Unsupported op ${op.op}`);
        // we rely on kernel store semantics; here we just overwrite full file when replace ''
        if (op.path === '') Object.assign(data, op.value);
      }
      await writeFile(fp, JSON.stringify(data, null, 2));
    }
    console.log('Migration applied');
  } else {
    console.log('\nDry-run complete (no changes written)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

