#!/usr/bin/env node
/* eslint-env node */
/**
 * Usage:
 *   node scripts/emit-build-summary.js <inputPath> > artifacts/build.json
 *
 * Accepts:
 *  - Webpack stats JSON (via `webpack --json > webpack-stats.json`)
 *    - Uses `errors`, `warnings` arrays or `errorsCount`/`warningsCount`
 *  - Esbuild JSON (from a Node wrapper that serializes { errors:[], warnings:[] })
 *  - Plaintext logs (fallback: counts lines containing "error" / "warning")
 *
 * Output (always):
 *  { "errorsCount": <number>, "warningsCount": <number>,
 *    "errors": [...optional strings...], "warnings": [...optional strings...] }
 */
import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: emit-build-summary <inputPath> > artifacts/build.json');
  process.exit(2);
}

const safeRead = (p) => {
  try {
    const txt = fs.readFileSync(p, 'utf8');
    try { return JSON.parse(txt); } catch { return txt; }
  } catch { return null; }
};

const src = safeRead(inputPath);
let errorsCount = 0, warningsCount = 0;
let errors = [], warnings = [];

// Case 1: Webpack stats JSON (including multi-compiler via children)
const looksLikeWebpack = src && typeof src === 'object' && (
  Array.isArray(src.errors) || Array.isArray(src.warnings) ||
  typeof src.errorsCount === 'number' || typeof src.warningsCount === 'number' ||
  Array.isArray(src.children)
);

if (looksLikeWebpack) {
  const collect = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.errors))   { errorsCount   += node.errors.length;   errors.push(...node.errors.map(String)); }
    if (Array.isArray(node.warnings)) { warningsCount += node.warnings.length; warnings.push(...node.warnings.map(String)); }
    if (typeof node.errorsCount === 'number')   errorsCount   += node.errorsCount;
    if (typeof node.warningsCount === 'number') warningsCount += node.warningsCount;
    if (Array.isArray(node.children)) node.children.forEach(collect);
  };
  collect(src);
}

// Case 2: Esbuild JSON-like { errors:[], warnings:[] }
else if (src && typeof src === 'object' && (Array.isArray(src.errors) || Array.isArray(src.warnings))) {
  errorsCount   = (src.errors   || []).length;
  warningsCount = (src.warnings || []).length;
  errors   = (src.errors   || []).map(String);
  warnings = (src.warnings || []).map(String);
}

// Case 3: Plain text log fallback
else if (typeof src === 'string') {
  const lines = src.split(/\r?\n/);
  for (const line of lines) {
    const l = line.toLowerCase();
    if (/\berror\b/.test(l) && !/sourcemap|source map/.test(l)) { errorsCount++; errors.push(line); }
    else if (/\bwarning\b/.test(l) && !/sourcemap|source map/.test(l)) { warningsCount++; warnings.push(line); }
  }
}

const out = {
  errorsCount,
  warningsCount,
  errors: errors.slice(0, 50),
  warnings: warnings.slice(0, 200),
};
process.stdout.write(JSON.stringify(out, null, 2));
