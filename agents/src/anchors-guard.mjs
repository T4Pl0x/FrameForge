#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('node tools/check-anchors.js', { stdio: 'inherit' });
  console.log('[anchors-guard] Done');
} catch (e) {
  console.error('[anchors-guard] Failed');
  process.exit(e.status || 1);
}

