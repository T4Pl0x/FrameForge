#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('node scripts/summarize-lint-build.js', { stdio: 'inherit' });
  console.log('[lintbuild-summarizer] Done');
} catch (e) {
  console.error('[lintbuild-summarizer] Failed');
  process.exit(e.status || 1);
}

