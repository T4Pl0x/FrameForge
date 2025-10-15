let current = { tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' };
let info = { status: 'unknown', prUrl: undefined, reportsUrl: undefined, dashboardUrl: undefined, artifacts: undefined, firstHint: undefined, reportType: undefined, summary: undefined };
const subs = new Set();

export function getGates() { return current; }
export function getGatesInfo() { return { gates: current, info }; }

export function setGates(next) {
  current = { ...current, ...next };
  for (const fn of Array.from(subs)) {
    try { fn({ gates: current, info }); } catch {}
  }
}

export function subscribeGates(fn) {
  const wrap = (payload) => fn(payload?.gates ? payload : { gates: current, info });
  subs.add(wrap);
  try { fn({ gates: current, info }); } catch {}
  return () => { subs.delete(wrap); };
}

// Wire to kernel events if available
let wired = false;
export function startGatesTap() {
  if (wired) return; wired = true;
  try {
    const api = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
    if (!api) { wired = false; return; }
    const up = (e) => {
      if (e?.details?.publishInfo || e?.details?.summary || e?.details?.artifacts) {
        info = {
          status: e.status || info.status,
          prUrl: e.details.publishInfo?.prUrl || info.prUrl,
          reportsUrl: e.details.publishInfo?.reportsUrl || info.reportsUrl,
          dashboardUrl: e.details.publishInfo?.dashboardUrl || info.dashboardUrl,
          artifacts: e.details.artifacts || info.artifacts,
          firstHint: e.details.firstHint || info.firstHint,
          reportType: e.details.reportType || info.reportType,
          summary: e.details.summary || info.summary,
        };
      }
      if (e?.gates) setGates(e.gates);
    };
    const off1 = api.events.subscribe('gate.status', up);
    const off2 = api.events.subscribe('gate.passed', up);
    const off3 = api.events.subscribe('gate.failed', up);
    return () => { try { off1(); off2(); off3(); } catch {} };
  } catch { wired = false; }
}
