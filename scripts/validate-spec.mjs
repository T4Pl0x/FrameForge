#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const specDir = path.join(root, 'spec');
const files = [
  'ui.json', 'logic.json', 'data.json', 'theme.json',
  'overlays.json', 'tests.json', 'meta.json', 'analysis.json'
];

function ok(msg){ console.log(`✔ ${msg}`); }
function fail(msg){ console.error(`✖ ${msg}`); process.exitCode = 1; }

async function main(){
  try {
    await fs.access(specDir);
  } catch {
    fail(`Missing spec directory at ${specDir}`);
    process.exit(1);
  }
  for (const f of files) {
    const p = path.join(specDir, f);
    try {
      const raw = await fs.readFile(p, 'utf8');
      const json = JSON.parse(raw);
      if (f === 'meta.json') {
        if (!json || typeof json !== 'object' || !Array.isArray(json.audit)) {
          fail('meta.json must contain an array field "audit"');
        }
      }
      ok(`Parsed ${f}`);
    } catch (e) {
      fail(`Failed ${f}: ${e.message}`);
    }
  }
  if (process.exitCode) {
    console.error('Spec validation failed');
    process.exit(process.exitCode);
  } else {
    console.log('Spec OK');
  }
}

main();

