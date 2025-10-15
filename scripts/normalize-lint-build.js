#!/usr/bin/env node
/* eslint-env node */
// usage:
//  node scripts/normalize-lint-build.js <lint.json?> <build.json?> > reports/lint-build.json
import fs from 'node:fs';

const [lintPath, buildPath] = process.argv.slice(2);
const safeRead = (p) => {
  try { return p ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; } catch { return null; }
};

const lint = safeRead(lintPath);
const build = safeRead(buildPath);

let lintErrors = 0, lintWarnings = 0;
if (lint) {
  // ESLint JSON (formatter=json)
  if (Array.isArray(lint)) {
    for (const f of lint) {
      lintErrors   += (f.errorCount || 0);
      lintWarnings += (f.warningCount || 0);
    }
  }
  // tsc --pretty false --json (community wrappers vary)
  if (lint?.errors || lint?.warnings) {
    lintErrors   += Number(lint.errors   || 0);
    lintWarnings += Number(lint.warnings || 0);
  }
}

let buildErrors = 0, buildWarnings = 0;
// esbuild / webpack stats (simplified)
if (build) {
  if (Array.isArray(build.errors))   buildErrors   += build.errors.length;
  if (Array.isArray(build.warnings)) buildWarnings += build.warnings.length;
  if (typeof build.errorsCount === 'number')   buildErrors   += build.errorsCount;
  if (typeof build.warningsCount === 'number') buildWarnings += build.warningsCount;
}

const out = { lintErrors, lintWarnings, buildErrors, buildWarnings };
process.stdout.write(JSON.stringify(out, null, 2));
