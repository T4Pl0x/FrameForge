import { createEventBus } from './eventBus.js';
import { createSpecStore } from './specStore.js';
import { validatePatch } from './jsonPatch.js';

function djb2Hash(str) {
  let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function randomId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

export function createKernel(options = {}) {
  const bus = createEventBus();
  const store = createSpecStore(options.store);
  const proposals = new Map();
  const idempotency = new Map(); // key -> { id, ts }
  let nextId = 1;

  const roles = Array.isArray(options?.user?.roles) ? options.user.roles : ['owner'];
  const currentUser = options?.user || { id: 'anonymous', roles };

  const policy = {
    canApprove(user, target) {
      const r = user?.roles || [];
      return r.includes('approver') || r.includes('owner');
    },
    canApply(user, target) {
      const r = user?.roles || [];
      return r.includes('approver') || r.includes('owner');
    },
  };

  const GEOMETRY_PATHS = [/^\/ui\/frames(?:\/[0-9-]+)?(?:\/|$)/, /^\/ui\/screens(?:\/|$)/];
  const AI_EXTS = new Set(['@frameforge/ext-compiler', '@frameforge/ext-exec']);

  function isGeometryPatch(op) {
    try { return GEOMETRY_PATHS.some((rx) => rx.test(op.path)); } catch { return false; }
  }

  function propose({ target, patch, rationale, metadata, idempotencyKey, provenance }) {
    const id = String(nextId++);
    const pre = validatePatch(patch);
    const meta = metadata || {};
    const prov = provenance || meta.provenance || {};
    const now = new Date().toISOString();
    const rec = { id, target, patch, rationale: rationale || '', metadata: meta, provenance: prov, created_at: now, status: pre.ok ? 'submitted' : 'invalid', errors: pre.errors || [] };
    if (idempotencyKey) {
      const hit = idempotency.get(idempotencyKey);
      const ttlMs = 5 * 60 * 1000;
      if (hit && (Date.now() - hit.ts < ttlMs)) {
        return hit.id; // duplicate
      }
      rec.idempotency_key = idempotencyKey;
      idempotency.set(idempotencyKey, { id, ts: Date.now() });
    }
    proposals.set(id, rec);
    bus.emit('proposal:submitted', { id, target });
    return id;
  }

  function preflight(id) {
    const p = proposals.get(id);
    if (!p) return { ok: false, errors: ['not found'] };
    const v = validatePatch(p.patch);
    // Geometry isolation: only ext-ui may propose geometry/layout changes
    const actorName = p?.metadata?.sourceExtension || p?.provenance?.actor?.name;
    const hasGeom = (p.patch || []).some(isGeometryPatch);
    if (hasGeom && actorName !== '@frameforge/ext-ui') {
      p.status = 'invalid';
      p.errors = ['GEOMETRY_WRITE_FORBIDDEN: Only @frameforge/ext-ui may propose geometry/layout changes'];
      return { ok: false, errors: p.errors };
    }
    // AI provenance strictness
    if (AI_EXTS.has(actorName)) {
      const modelId = p?.provenance?.model?.id;
      const inputsSha = p?.provenance?.inputs_sha256;
      if (!modelId || !inputsSha) {
        p.status = 'invalid';
        p.errors = ['PROVENANCE_INCOMPLETE: AI proposals must include model.id and inputs_sha256'];
        return { ok: false, errors: p.errors };
      }
    }
    p.status = v.ok ? 'ready' : 'invalid';
    p.errors = v.errors;
    return { ok: v.ok, errors: v.errors };
  }

  function approve(id, { by, user } = {}) {
    const p = proposals.get(id);
    if (!p) throw new Error('proposal not found');
    const actor = user || currentUser;
    if (!policy.canApprove(actor, p.target)) {
      const need = 'approver';
      const err = new Error('Forbidden: approve');
      err.code = 403; err.need = need; err.path = p.target?.file || 'unknown';
      throw err;
    }
    p.status = 'approved';
    p.approvedBy = by || actor?.id || 'system';
    bus.emit('proposal:approved', { id });
  }

  function apply(id, { user } = {}) {
    const p = proposals.get(id);
    if (!p || p.status !== 'approved') throw new Error('proposal not approved');
    const actor = user || currentUser;
    if (!policy.canApply(actor, p.target)) {
      const need = 'approver';
      const err = new Error('Forbidden: apply');
      err.code = 403; err.need = need; err.path = p.target?.file || 'unknown';
      throw err;
    }
    const result = store.apply(p.patch);
    if (!result.ok) throw new Error('apply failed');
    p.status = 'applied';
    const snap = store.snapshot();
    // Audit
    try {
      const trace_id = randomId('tr_');
      const commit = randomId('c_');
      const state_hash = djb2Hash(JSON.stringify(snap.spec));
      const auditEntry = {
        proposal_id: id,
        approver: p.approvedBy || actor?.id || 'unknown',
        commit,
        state_hash,
        trace_id,
        applied_at: new Date().toISOString(),
        model: p?.provenance?.model || null,
        inputs_sha256: p?.provenance?.inputs_sha256 || null,
      };
      // Append to meta.audit
      const patch = [{ op: 'add', path: '/meta/audit/-', value: auditEntry }];
      store.apply(patch);
      bus.emit('apply.succeeded', { id, trace_id, commit, state_hash });
    } catch { /* ignore audit errors */ }
    bus.emit('proposal:applied', { id });
    bus.emit('spec:changed', store.snapshot());
    return store.snapshot();
  }

  function reject(id, { reason, by } = {}) {
    const p = proposals.get(id);
    if (!p) throw new Error('proposal not found');
    p.status = 'rejected';
    p.rejectedBy = by || 'system';
    p.reason = reason || '';
    bus.emit('proposal:rejected', { id });
  }

  function list(status) {
    const arr = Array.from(proposals.values());
    return status ? arr.filter((p) => p.status === status) : arr;
  }

  const host = {
    readSpec: () => store.snapshot().spec,
    propose: ({ target, patch, rationale, metadata, idempotencyKey, provenance }) => propose({ target, patch, rationale, metadata, idempotencyKey, provenance }),
    approveProposal: (id, ctx) => approve(id, ctx || {}),
    applyProposal: (id, ctx) => apply(id, ctx || {}),
    listProposals: (st) => list(st),
  };

  return { store, proposals: { propose, preflight, approve, apply, reject, list }, bus, host, policy };
}
