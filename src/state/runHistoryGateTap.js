import { toastKernelError } from '../ui/toast.js';

let wired = false;
export function startGateToastTap() {
  if (wired) return;
  wired = true;
  try {
    const api = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
    if (!api) { wired = false; return; }
    api.events.subscribe('gate.failed', (e) => {
      const hint = e?.details?.firstHint || 'A gate failed. See reports for details.';
      const trace_id = e?.trace_id;
      const publish = e?.details?.publishInfo || {};
      const href = publish.prUrl || publish.reportsUrl || publish.dashboardUrl || undefined;
      const hrefLabel = publish.prUrl ? 'Open PR' : publish.reportsUrl ? 'Open Reports' : publish.dashboardUrl ? 'Open Dashboard' : undefined;
      toastKernelError({ code: 'GATE_FAILED_HINT', message: hint, trace_id }, { href, hrefLabel });
    });
  } catch { wired = false; }
}
