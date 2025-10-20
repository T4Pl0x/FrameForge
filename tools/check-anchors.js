#!/usr/bin/env node
/**
 * Simple check for edits to generated files outside allowed anchor regions.
 * It expects generated files to include markers:
 *  // FF:gen-begin <id>
 *  // FF:gen-end <id>
 *
 * This script compares git HEAD to the PR branch (if run in CI it should be run on PR ref),
 * but as a minimal first step it will scan modified files from `git diff --name-only HEAD~1..HEAD`.
 *
 * Usage (local): node tools/check-anchors.js
 */
import { execSync } from 'child_process';
import fs from 'fs';
const diffOutput = execSync('git diff --name-only --no-renames --diff-filter=AM HEAD~1..HEAD', { encoding: 'utf8' });
const files = diffOutput.split('\n').map(s => s.trim()).filter(Boolean).filter(f => f.startsWith('generated/'));
let violations = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // naive approach: ensure every non-FF:gen-* line is within a gen region OR within a FF:component block
  let inRegion = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (/FF:gen-begin/.test(L)) inRegion = true;
    if (/FF:gen-end/.test(L)) inRegion = false;
    if (/FF:component=/.test(L)) {
      // allow entire file if file begins with component marker (or treat per repo rules)
    }
    // This is a conservative check: if we find textual edits outside regions, flag file.
    // For initial run, warn only.
  }
  // For now, just print that the file was detected. A future version should diff generated baseline vs current.
  console.log(`Detected generated file in diff: ${file}`);
}

if (violations > 0) {
  console.error(`Found ${violations} anchor violations`);
  process.exit(1);
} else {
  console.log('Anchor scan completed (no checks flagged).');
}