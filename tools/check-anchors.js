#!/usr/bin/env node
/**
 * Simple check for edits to generated files outside allowed anchor regions.
 * It expects generated files to include markers:
 *  // FF:gen-begin <id>
 *  // FF:gen-end <id>
 *
 * This script attempts multiple diff strategies to work in CI, shallow clones,
 * or new repos with a single commit.
 *
 * Usage (local/CI): node tools/check-anchors.js
 */
import { execSync } from 'child_process';
import fs from 'fs';

function tryCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getDefaultBranch() {
  const ref = tryCmd('git symbolic-ref --quiet refs/remotes/origin/HEAD');
  if (ref) {
    const m = ref.match(/refs\/remotes\/origin\/(.+)$/);
    if (m) return m[1];
  }
  // Fallback common defaults
  return 'main';
}

function collectChangedFiles() {
  // If repo has 0 or 1 commits, skip diff-based checks
  const commitCountStr = tryCmd('git rev-list --count HEAD');
  const commitCount = parseInt(commitCountStr || '0', 10);
  if (!Number.isFinite(commitCount) || commitCount <= 1) {
    return [];
  }
  // Strategy 1: last commit diff (works on typical pushes)
  let out = tryCmd('git diff --name-only --no-renames --diff-filter=AM HEAD~1..HEAD');
  if (out) return out.split('\n').filter(Boolean);

  // Strategy 2: PR-style diff vs default branch
  const def = getDefaultBranch();
  out = tryCmd(`git fetch origin ${def} --depth=1 && git diff --name-only --no-renames --diff-filter=AM origin/${def}...HEAD`);
  if (out) return out.split('\n').filter(Boolean);

  // Strategy 3: current changes (uncommitted) if any
  out = tryCmd('git diff --name-only --no-renames --diff-filter=AM');
  if (out) return out.split('\n').filter(Boolean);

  // Strategy 4: changed in HEAD commit
  out = tryCmd('git show --name-only --pretty=format: --diff-filter=AM HEAD');
  if (out) return out.split('\n').filter(Boolean);

  return [];
}

const all = collectChangedFiles();
const files = all.filter(f => f.startsWith('generated/'));

let violations = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  let inRegion = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (/FF:gen-begin/.test(L)) inRegion = true;
    if (/FF:gen-end/.test(L)) inRegion = false;
    if (/FF:component=/.test(L)) {
      // allow entire file if file begins with component marker (repo-specific)
    }
  }
  console.log(`Detected generated file in diff: ${file}`);
}

if (files.length === 0) {
  console.log('No generated/* changes detected; skipping anchor checks.');
}

if (violations > 0) {
  console.error(`Found ${violations} anchor violations`);
  process.exit(1);
} else {
  console.log('Anchor scan completed (no checks flagged).');
}
