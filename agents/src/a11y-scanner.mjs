#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('node scripts/run-a11y-scan.js', { stdio: 'inherit' });
  console.log('[a11y-scanner] Done');
} catch (e) {
  console.error('[a11y-scanner] Failed');
  process.exit(e.status || 1);
}

