/** Run History Filter state (session) */
// Filter values: 'all' | 'proposal' | 'apply' | 'gate'
let current = (() => { try { return sessionStorage.getItem('ff.runhistory.filter') || 'all'; } catch { return 'all'; } })();
const listeners = new Set();

export function getFilter() { return current; }
export function setFilter(f) {
  current = f;
  try { sessionStorage.setItem('ff.runhistory.filter', f); } catch {}
  listeners.forEach((fn) => { try { fn(); } catch {} });
}
export function onFilterChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function matchFilter(evt, f = current) {
  const t = evt?.type || '';
  if (f === 'all') return true;
  if (f === 'proposal') return t.startsWith('proposal:');
  if (f === 'apply') return t.startsWith('apply.');
  if (f === 'gate') return t.startsWith('gate.');
  return true;
}

