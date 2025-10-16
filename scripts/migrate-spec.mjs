#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const from = args.includes('--from') ? args[args.indexOf('--from')+1] : null;
const to = args.includes('--to') ? args[args.indexOf('--to')+1] : null;

async function main(){
  const metaPath = path.join(process.cwd(), 'spec', 'meta.json');
  const raw = await fs.readFile(metaPath, 'utf8');
  const meta = JSON.parse(raw);
  const prev = meta.version || null;
  if (!from || !to) {
    console.log('Usage: node scripts/migrate-spec.mjs --from vX --to vY');
    process.exit(0);
  }
  if (prev && prev !== from) {
    console.warn(`Warning: meta.version (${prev}) != --from (${from}). Proceeding with no-op.`);
  }
  // No-op scaffold bump; migrations can be hooked here.
  meta.version = to;
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  console.log(`Spec migrated: ${from} -> ${to}`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

