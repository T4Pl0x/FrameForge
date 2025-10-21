#!/usr/bin/env node
import { execSync } from 'node:child_process';

const url = process.env.REPORTS_INDEX_URL || '';
const baseCmd = 'node scripts/verify-reports-index.js';
const cmd = url ? `${baseCmd} --url "${url}"` : baseCmd;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('[reports-verifier] Done');
} catch (e) {
  console.error('[reports-verifier] Failed');
  process.exit(e.status || 1);
}

