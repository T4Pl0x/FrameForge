#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('node frameforge/scripts/validate-spec.mjs', { stdio: 'inherit' });
  console.log('[spec-validator] Done');
} catch (e) {
  console.error('[spec-validator] Failed');
  process.exit(e.status || 1);
}

