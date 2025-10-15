#!/usr/bin/env node
/**
 * Summarize ESLint + build outputs into reports/lint-build.json
 * - Reads reports/lint.json (eslint --format json)
 * - Reads reports/build.log (captured build stdout/stderr)
 * Produces: { lintErrors, lintWarnings, buildErrors, buildWarnings }
 */
import fs from 'node:fs';
import path from 'node:path';

const reportsDir = path.resolve('reports');
const lintJsonPath = path.join(reportsDir, 'lint.json');
const buildLogPath = path.join(reportsDir, 'build.log');
const outPath = path.join(reportsDir, 'lint-build.json');

function readJSONSafe(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function summarizeLint(data) {
  let lintErrors = 0;
  let lintWarnings = 0;
  if (Array.isArray(data)) {
    for (const file of data) {
      if (typeof file.errorCount === 'number') lintErrors += file.errorCount;
      if (typeof file.warningCount === 'number') lintWarnings += file.warningCount;
      if (!('errorCount' in file) && Array.isArray(file.messages)) {
        for (const m of file.messages) {
          if (m && m.severity === 2) lintErrors += 1;
          if (m && m.severity === 1) lintWarnings += 1;
        }
      }
    }
  }
  return { lintErrors, lintWarnings };
}

function summarizeBuild(logText) {
  if (typeof logText !== 'string') return { buildErrors: 0, buildWarnings: 0 };
  const lines = logText.split(/\r?\n/);
  let buildErrors = 0;
  let buildWarnings = 0;
  for (const ln of lines) {
    const s = ln.trim();
    // Heuristics for vite/rollup/tsc outputs
    if (/^error\b/i.test(s) || /error during build/i.test(s) || /rolluperror/i.test(s)) buildErrors += 1;
    if (/^warn(ing)?\b/i.test(s) || /\/!\s*\(plugin.*\) warning/i.test(s)) buildWarnings += 1;
  }
  return { buildErrors, buildWarnings };
}

fs.mkdirSync(reportsDir, { recursive: true });

const lintData = readJSONSafe(lintJsonPath) || [];
const buildLog = fs.existsSync(buildLogPath) ? fs.readFileSync(buildLogPath, 'utf8') : '';

const lintSum = summarizeLint(lintData);
const buildSum = summarizeBuild(buildLog);

const out = { ...lintSum, ...buildSum };
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Wrote', outPath, out);

