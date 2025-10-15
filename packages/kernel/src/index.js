import { createEventBus } from './eventBus.js';
import { createSpecStore } from './specStore.js';
import { validatePatch } from './jsonPatch.js';

export function createKernel(options = {}) {
  const bus = createEventBus();
  const store = createSpecStore(options.store);
  const proposals = new Map();
  let nextId = 1;

  function propose({ target, patch, rationale, metadata }) {
    const id = String(nextId++);
    const pre = validatePatch(patch);
    proposals.set(id, { id, target, patch, rationale: rationale || '', metadata: metadata || {}, status: pre.ok ? 'submitted' : 'invalid', errors: pre.errors || [] });
    bus.emit('proposal:submitted', { id, target });
    return id;
  }

  function preflight(id) {
    const p = proposals.get(id);
    if (!p) return { ok: false, errors: ['not found'] };
    const v = validatePatch(p.patch);
    p.status = v.ok ? 'ready' : 'invalid';
    p.errors = v.errors;
    return { ok: v.ok, errors: v.errors };
  }

  function approve(id, { by } = {}) {
    const p = proposals.get(id);
    if (!p) throw new Error('proposal not found');
    p.status = 'approved';
    p.approvedBy = by || 'system';
    bus.emit('proposal:approved', { id });
  }

  function apply(id) {
    const p = proposals.get(id);
    if (!p || p.status !== 'approved') throw new Error('proposal not approved');
    const result = store.apply(p.patch);
    if (!result.ok) throw new Error('apply failed');
    p.status = 'applied';
    bus.emit('proposal:applied', { id });
    bus.emit('spec:changed', store.snapshot());
    return store.snapshot();
  }

  const host = {
    readSpec: () => store.snapshot().spec,
    propose: ({ target, patch, rationale, metadata }) => propose({ target, patch, rationale, metadata }),
  };

  return { store, proposals: { propose, preflight, approve, apply }, bus, host };
}

