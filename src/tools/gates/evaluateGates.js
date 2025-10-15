import { broker } from '../../tools/broker.js';
import { pollPublishInfo } from '../publish/pollPublishInfo.js';

export async function evaluateGates({ owner, repo, runId, token, trace_id, publishInfo, buildId, buildBaseUrl, prUrl, dashboardUrl }) {
  const kapi = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
  const tr = trace_id || ('tr_gate_' + Math.random().toString(36).slice(2, 8));
  try { kapi?.events?.publish('gate.started', { type: 'gate.started', trace_id: tr, status: 'unknown', target: { file: 'reports' } }); } catch {}
  let publishInfoData = publishInfo;
  try {
    publishInfoData = await pollPublishInfo({ buildId: buildId || runId, buildBaseUrl, prUrl, dashboardUrl });
  } catch { /* ignore */ }
  const tests = await broker.artifacts.getJson({ owner, repo, runId, name: 'tests-report.json', token }).catch(() => null);
  const a11y = await broker.artifacts.getJson({ owner, repo, runId, name: 'a11y-report.json', token }).catch(() => null);
  const lb = await broker.artifacts.getJson({ owner, repo, runId, name: 'lint-build.json', token }).catch(() => null);
  // Artifact links for UI parity
  let artifacts = {};
  try {
    const list = await broker.artifacts.list({ owner, repo, runId, token });
    for (const a of (list || [])) artifacts[a.name] = a.url;
  } catch { /* no links */ }

  const gates = { tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' };
  // Normalize summaries
  const testsPassed = Number(tests?.summary?.passed ?? tests?.passed ?? 0);
  const testsFailed = Number(tests?.summary?.failed ?? tests?.numFailedTests ?? tests?.failed ?? 0);
  const testsSkipped = Number(tests?.summary?.skipped ?? tests?.skipped ?? 0);
  const testsTotal = Number(tests?.summary?.total ?? (testsPassed + testsFailed + testsSkipped) || 0);
  gates.tests = tests ? (testsFailed === 0 ? 'pass' : 'fail') : 'unknown';
  const vio = Array.isArray(a11y?.violations) ? a11y.violations.length : (a11y?.violations ?? 0);
  const unwaived = Number(a11y?.unwaivedViolations ?? vio);
  gates.a11y = a11y ? ((unwaived === 0) ? 'pass' : 'fail') : 'unknown';
  const be = Number(lb?.buildErrors ?? 0), le = Number(lb?.lintErrors ?? 0), bw = Number(lb?.buildWarnings ?? 0), lw = Number(lb?.lintWarnings ?? 0);
  gates.lintBuild = lb ? ((be === 0 && le === 0) ? 'pass' : 'fail') : 'unknown';
  const warnCount = bw + lw;
  if (warnCount > 100) gates.risk = 'high'; else if (warnCount > 20) gates.risk = 'medium';

  const allPass = (gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass');
  publishInfoData = publishInfoData || { reportsUrl: `https://github.com/${owner}/${repo}/actions/runs/${runId}` };
  const summary = {
    tests: { passed: testsPassed, failed: testsFailed, skipped: testsSkipped, total: testsTotal },
    a11y: { violations: vio, unwaived },
    lint: { errors: le, warnings: lw },
    build: { errors: be, warnings: bw },
  };
  // broadcast current gate status snapshot
  try { kapi?.events?.publish('gate.status', { type: 'gate.status', trace_id: tr, status: allPass ? 'green' : 'red', gates, details: { publishInfo: publishInfoData, artifacts, summary } }); } catch {}

  if (allPass) {
    try { kapi?.events?.publish('gate.passed', { type: 'gate.passed', trace_id: tr, status: 'green', gates, details: { summary, publishInfo: publishInfoData, artifacts } }); } catch {}
    return { status: 'green', summary, gates, artifacts, publishInfo: publishInfoData };
  } else {
    let reportType = 'unknown';
    let firstHint = '';
    if (gates.tests !== 'pass' && tests) { reportType = 'tests'; firstHint = `failed: ${testsFailed}`; }
    else if (gates.a11y !== 'pass' && a11y) { reportType = 'a11y'; firstHint = `violations: ${vio}`; }
    else if (gates.lintBuild !== 'pass' && lb) { reportType = 'lintBuild'; firstHint = `lint ${lb?.lintErrors ?? 0}e/${lb?.lintWarnings ?? 0}w · build ${lb?.buildErrors ?? 0}e/${lb?.buildWarnings ?? 0}w`; }
    try { kapi?.events?.publish('gate.failed', { type: 'gate.failed', trace_id: tr, status: 'red', gates, details: { firstHint, reportType, publishInfo: publishInfoData, artifacts, summary } }); } catch {}
    return { status: 'red', summary, gates, artifacts, publishInfo: publishInfoData };
  }
} 
