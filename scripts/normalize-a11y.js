#!/usr/bin/env node
/* eslint-env node */
// scripts/normalize-a11y.js
import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: normalize-a11y <input.json> > reports/a11y-report.json');
  process.exit(2);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read/parse input:', e?.message || e);
  process.stdout.write(JSON.stringify({ violations: 0, passes: 0, inapplicable: 0, waived: 0, details: [] }, null, 2));
  process.exit(0);
}

const out = { violations: 0, passes: 0, inapplicable: 0, waived: 0, details: [] };

// Accept either a single axe result or { results:[…] } or array of results
const results = Array.isArray(raw?.results) ? raw.results : Array.isArray(raw) ? raw : [raw];

let vio = 0, pass = 0, inap = 0, waived = 0;
const details = new Map(); // id -> { impact, nodes }

for (const r of results) {
  const V = r?.violations || [];
  const P = r?.passes || [];
  const I = r?.inapplicable || [];
  const W = r?.waivers || []; // optional custom: [{id, reason}]

  vio += V.length; pass += P.length; inap += I.length; waived += (W.length || 0);

  for (const v of V) {
    const prev = details.get(v.id) || { impact: v.impact || 'minor', nodes: 0 };
    details.set(v.id, { impact: v.impact || prev.impact, nodes: prev.nodes + (Array.isArray(v.nodes) ? v.nodes.length : 1) });
  }
}

out.violations = vio;
out.passes = pass;
out.inapplicable = inap;
out.waived = waived;
out.details = Array.from(details, ([id, d]) => ({ id, impact: d.impact, nodes: d.nodes }));

process.stdout.write(JSON.stringify(out, null, 2));
