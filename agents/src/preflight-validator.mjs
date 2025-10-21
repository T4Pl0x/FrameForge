#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('node frameforge/scripts/validate-preflight.mjs', { stdio: 'inherit' });
  console.log('[preflight-validator] Done');
} catch (e) {
  console.error('[preflight-validator] Failed');
  process.exit(e.status || 1);
}

