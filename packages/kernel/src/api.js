// Thin API surface over kernel instance
export function createKernelApi(kernel) {
  function submit(proposal) {
    const { target, patch, idempotency_key: idempotencyKey, provenance } = proposal;
    const id = kernel.proposals.propose({ target: target?.file?.replace(/^spec\//,'') || target, patch, rationale: proposal.rationale || '', metadata: {}, idempotencyKey, provenance });
    const pf = kernel.proposals.preflight(id);
    return { status: pf?.ok ? 'preflighted' : 'rejected', reasons: pf?.errors || [] };
  }
  function approve(proposalId, approverId) {
    kernel.proposals.approve(proposalId, { by: approverId, user: { id: approverId, roles: ['approver'] } });
    return { ok: true };
  }
  function apply(proposalId, opts) {
    const snap = kernel.proposals.apply(proposalId, { override: opts?.override, user: opts?.user });
    const state_hash = typeof JSON !== 'undefined' ? (JSON.stringify(snap.spec).length.toString(16)) : '';
    return { commit: 'c_api', state_hash };
  }
  function listProposals(status) {
    return kernel.proposals.list ? kernel.proposals.list(status) : [];
  }
  function subscribe(pattern, fn) {
    const toRegex = (pat) => new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    const rx = toRegex(pattern);
    const handler = (name) => (payload) => { if (rx.test(name)) fn({ type: name, ...payload }); };
    const off = [];
    const events = [
      'proposal:submitted',
      'proposal:approved',
      'proposal:rejected',
      'proposal:applied',
      'apply.succeeded',
      'gate.status'
    ];
    for (const ev of events) off.push(kernel.bus.on(ev, handler(ev)));
    return () => off.forEach((f) => { try { f(); } catch {} });
  }
  function publish(name, payload) {
    try { kernel.bus.emit(name, { type: name, ...payload }); } catch {}
  }
  return { submit, approve, apply, listProposals, events: { subscribe, publish } };
}
