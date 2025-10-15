import { ERROR_MESSAGES } from '../errors/messages.js';

export function toastKernelError(err) {
  const code = err?.code;
  const trace = err?.trace_id ? ` (trace ${err.trace_id})` : '';
  const msg = (code && ERROR_MESSAGES[code]) || err?.message || 'Unexpected error.';
  try { window.dispatchEvent(new CustomEvent('ff:toast', { detail: { kind: 'error', msg: msg + trace } })); } catch {}
}

export function toastOK(msg) {
  try { window.dispatchEvent(new CustomEvent('ff:toast', { detail: { kind: 'ok', msg } })); } catch {}
}

