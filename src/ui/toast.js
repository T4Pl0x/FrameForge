import { ERROR_MESSAGES } from '../errors/messages.js';

export function toastKernelError(err, opts) {
  const code = err?.code;
  const trace = err?.trace_id ? ` (trace ${err.trace_id})` : '';
  const msg = (code && ERROR_MESSAGES[code]) || err?.message || 'Unexpected error.';
  try {
    window.dispatchEvent(new CustomEvent('ff:toast', { detail: { kind: 'error', msg: msg + trace, href: opts?.href, hrefLabel: opts?.hrefLabel } }));
  } catch {}
}

export function toastOK(msg, opts) {
  try { window.dispatchEvent(new CustomEvent('ff:toast', { detail: { kind: 'ok', msg, href: opts?.href, hrefLabel: opts?.hrefLabel } })); } catch {}
}
