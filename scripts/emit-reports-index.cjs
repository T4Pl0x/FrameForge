#!/usr/bin/env node
/**
 * Emit a reports index file with absolute links for gate toasts / UIs.
 *
 * Usage:
 *  node scripts/emit-reports-index.cjs \
 *    --dir reports \
 *    --base https://cdn.example.com/builds/$BUILD_ID/reports/ \
 *    --pr "$PR_URL" \
 *    --dashboard "$DASH_URL" \
 *    --html        # (optional) also emit a simple index.html
 *
 * Exits non-zero on error; safe to run even if some reports are missing.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const outDir = arg('dir', 'reports');
const base = (arg('base') || '').trim(); // absolute or relative URL base, must end with '/'
const prUrl = arg('pr', '') || process.env.PR_URL || '';
const dashboardUrl = arg('dashboard', '') || process.env.DASH_URL || '';
const emitHtml = flag('html');

if (!fs.existsSync(outDir)) {
  console.error(`[emit-reports-index] dir not found: ${outDir}`);
  process.exit(2);
}
if (!base || !base.endsWith('/')) {
  console.error(`[emit-reports-index] --base required and must end with '/'. Got: ${base}`);
  process.exit(2);
}

const files = [
  { key: 'testsReport', file: 'tests-report.json' },
  { key: 'a11yReport', file: 'a11y-report.json' },
  { key: 'lintBuild', file: 'lint-build.json' },
  { key: 'coverageReport', file: 'coverage-summary.json' }, // optional
];

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const index = {
  // Primary deep-link target used by toasts; prefer an HTML summary if you have one
  reportsUrl: base + 'index.html',
  prUrl: prUrl || undefined,
  dashboardUrl: dashboardUrl || undefined,
};

for (const f of files) {
  const p = path.join(outDir, f.file);
  if (exists(p)) index[f.key] = base + f.file;
}

// If no index.html exists (or we don’t emit it), point reportsUrl to the folder itself
if (!exists(path.join(outDir, 'index.html'))) {
  index.reportsUrl = base; // folder listing is still useful
}

// Write index.json
const jsonPath = path.join(outDir, 'index.json');
fs.writeFileSync(jsonPath, JSON.stringify(index, null, 2));
console.log(`[emit-reports-index] wrote ${jsonPath}`);

// Optional: emit a minimal index.html if requested
if (emitHtml) {
  const htmlPath = path.join(outDir, 'index.html');
  const rows = files
    .filter((f) => index[f.key])
    .map(
      (f) =>
        `<li><a href="${index[f.key]}" target="_blank" rel="noreferrer">${f.key}</a></li>`
    )
    .join('\n');
  const html = `<!doctype html><meta charset="utf-8">
<title>Reports Index</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:16px}code{background:#f5f5f5;padding:2px 4px;border-radius:4px}</style>
<h1>Reports</h1>
<p>PR: ${index.prUrl ? `<a href="${index.prUrl}" target="_blank">open</a>` : '<em>none</em>'}</p>
<ul>${rows || '<li><em>No individual reports found</em></li>'}</ul>
<p>JSON: <code>index.json</code></p>`;
  fs.writeFileSync(htmlPath, html);
  console.log(`[emit-reports-index] wrote ${htmlPath}`);
}

