import { broker } from '../../tools/broker.js';

export async function evaluateGates({ owner, repo, runId, token, trace_id, publishInfo }) {
  const kapi = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
  const tr = trace_id || ('tr_gate_' + Math.random().toString(36).slice(2, 8));
  try { kapi?.events?.publish('gate.started', { type: 'gate.started', trace_id: tr, status: 'unknown', target: { file: 'reports' } }); } catch {}
  const tests = await broker.artifacts.getJson({ owner, repo, runId, name: 'tests-report.json', token }).catch(() => null);
  const a11y = await broker.artifacts.getJson({ owner, repo, runId, name: 'a11y-report.json', token }).catch(() => null);
  const lb = await broker.artifacts.getJson({ owner, repo, runId, name: 'lint-build.json', token }).catch(() => null);

  const gates = { tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' };
  const testsFailed = Number(tests?.summary?.failed ?? tests?.numFailedTests ?? tests?.failed ?? 0);
  gates.tests = tests ? (testsFailed === 0 ? 'pass' : 'fail') : 'unknown';
  const vio = Array.isArray(a11y?.violations) ? a11y.violations.length : (a11y?.violations ?? 0);
  const unwaived = a11y?.unwaivedViolations ?? vio;
  gates.a11y = a11y ? ((Number(unwaived) === 0) ? 'pass' : 'fail') : 'unknown';
  const be = Number(lb?.buildErrors ?? 0), le = Number(lb?.lintErrors ?? 0), bw = Number(lb?.buildWarnings ?? 0), lw = Number(lb?.lintWarnings ?? 0);
  gates.lintBuild = lb ? ((be === 0 && le === 0) ? 'pass' : 'fail') : 'unknown';
  const warnCount = bw + lw;
  if (warnCount > 100) gates.risk = 'high'; else if (warnCount > 20) gates.risk = 'medium';

  const allPass = (gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass');
  const publishInfoData = publishInfo || { reportsUrl: `https://github.com/${owner}/${repo}/actions/runs/${runId}` };
  if (allPass) {
    const details = {
      tests: { passed: tests?.summary?.passed ?? 0, failed: testsFailed },
      a11y: { violations: vio },
      lint: { errors: lb?.lintErrors ?? 0, warnings: lb?.lintWarnings ?? 0 },
      build: { errors: lb?.buildErrors ?? 0, warnings: lb?.buildWarnings ?? 0 },
    };
    try { kapi?.events?.publish('gate.passed', { type: 'gate.passed', trace_id: tr, status: 'green', details: { ...details, publishInfo: publishInfoData } }); } catch {}
    return { status: 'green', summary: details, gates };
  } else {
    let reportType = 'unknown';
    let firstHint = '';
    if (gates.tests !== 'pass' && tests) { reportType = 'tests'; firstHint = `failed: ${testsFailed}`; }
    else if (gates.a11y !== 'pass' && a11y) { reportType = 'a11y'; firstHint = `violations: ${vio}`; }
    else if (gates.lintBuild !== 'pass' && lb) { reportType = 'lintBuild'; firstHint = `lint ${lb?.lintErrors ?? 0}e/${lb?.lintWarnings ?? 0}w · build ${lb?.buildErrors ?? 0}e/${lb?.buildWarnings ?? 0}w`; }
    try { kapi?.events?.publish('gate.failed', { type: 'gate.failed', trace_id: tr, status: 'red', details: { firstHint, reportType, publishInfo: publishInfoData } }); } catch {}
    return { status: 'red', summary: { firstHint, reportType }, gates };
  }
}
