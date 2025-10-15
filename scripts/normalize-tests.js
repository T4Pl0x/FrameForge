#!/usr/bin/env node
/* eslint-env node */
// scripts/normalize-tests.js
import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: normalize-tests <input.json> > reports/tests-report.json');
  process.exit(2);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read/parse input:', e?.message || e);
  process.stdout.write(JSON.stringify({ summary: { passed: 0, failed: 0, skipped: 0, total: 0, durationMs: 0 }, suites: [] }, null, 2));
  process.exit(0);
}

const out = {
  summary: { passed: 0, failed: 0, skipped: 0, total: 0, durationMs: 0 },
  suites: [],
};

// Detectors
const isJest = raw?.numTotalTests !== undefined || raw?.testResults;
const isVitest = raw?.numTotalTests !== undefined && raw?.success !== undefined && raw?.startTime;
const isPlaywright = Array.isArray(raw?.suites) && raw?.stats;
const isMochawesome = raw?.stats && Array.isArray(raw?.results);

// JEST / VITEST
if (isJest || isVitest) {
  const results = raw.testResults || [];
  let passed = 0, failed = 0, skipped = 0, duration = 0, total = 0;
  for (const tr of results) {
    const sPassed = (tr.assertionResults?.filter((a) => a.status === 'passed').length) || 0;
    const sFailed = (tr.assertionResults?.filter((a) => a.status === 'failed').length) || 0;
    const sSkipped = (tr.assertionResults?.filter((a) => a.status === 'pending' || a.status === 'skipped').length) || 0;
    const sTotal = sPassed + sFailed + sSkipped;
    const sDuration = (tr.endTime && tr.startTime)
      ? (tr.endTime - tr.startTime)
      : (tr.perfStats?.end - tr.perfStats?.start) || 0;
    out.suites.push({
      name: tr.name || tr.testFilePath || 'suite',
      passed: sPassed,
      failed: sFailed,
      skipped: sSkipped,
      total: sTotal,
      durationMs: sDuration,
    });
    passed += sPassed; failed += sFailed; skipped += sSkipped; total += sTotal; duration += sDuration;
  }
  out.summary = { passed, failed, skipped, total, durationMs: duration };
}

// PLAYWRIGHT (reporter=json)
else if (isPlaywright) {
  function walk(node, accName = '') {
    const name = node.title || accName || 'suite';
    if (node.suites) node.suites.forEach((s) => walk(s, name));
    if (node.specs) {
      let sPassed = 0, sFailed = 0, sSkipped = 0, sTotal = 0, sDuration = 0;
      for (const spec of node.specs) {
        for (const t of spec.tests || []) {
          sTotal++;
          sDuration += (t.duration || 0);
          const st = t.results?.[0]?.status || t.outcome || 'skipped';
          if (st === 'passed') sPassed++;
          else if (st === 'failed') sFailed++;
          else sSkipped++;
        }
      }
      out.suites.push({ name, passed: sPassed, failed: sFailed, skipped: sSkipped, total: sTotal, durationMs: sDuration });
    }
  }
  walk(raw);
  out.summary = out.suites.reduce(
    (s, r) => ({
      passed: s.passed + r.passed,
      failed: s.failed + r.failed,
      skipped: s.skipped + r.skipped,
      total: s.total + r.total,
      durationMs: s.durationMs + r.durationMs,
    }),
    { passed: 0, failed: 0, skipped: 0, total: 0, durationMs: 0 }
  );
}

// CYPRESS + MOCHAWESOME
else if (isMochawesome) {
  let passed = 0, failed = 0, skipped = 0, total = 0, duration = 0;
  for (const res of raw.results) {
    const sPassed = res.passes?.length || 0;
    const sFailed = res.failures?.length || 0;
    const sSkipped = res.pending?.length || 0;
    const sTotal = sPassed + sFailed + sSkipped;
    const sDuration = res.duration || 0;
    out.suites.push({
      name: res.suite?.fullFile || res.file || 'suite',
      passed: sPassed,
      failed: sFailed,
      skipped: sSkipped,
      total: sTotal,
      durationMs: sDuration,
    });
    passed += sPassed; failed += sFailed; skipped += sSkipped; total += sTotal; duration += sDuration;
  }
  out.summary = { passed, failed, skipped, total, durationMs: duration };
}

// Fallback generic
else {
  const tests = raw.tests || [];
  const passed = tests.filter((t) => t.status === 'passed').length;
  const failed = tests.filter((t) => t.status === 'failed').length;
  const skipped = tests.filter((t) => t.status === 'skipped').length;
  out.summary = { passed, failed, skipped, total: tests.length, durationMs: Number(raw.durationMs || 0) };
  out.suites = [{ name: raw.name || 'suite', passed, failed, skipped, total: tests.length, durationMs: Number(raw.durationMs || 0) }];
}

process.stdout.write(JSON.stringify(out, null, 2));
