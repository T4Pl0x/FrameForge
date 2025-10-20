Kernel

Implements the proposal pipeline, RBAC stubs, idempotency keys (5 minutes), audit logging to spec/meta.json, and an event bus.

Scope

- Spec store on disk under `spec/*.json` (ui, logic, data, theme, tests, overlays, meta)
- Proposals: submit → approve → apply
- Idempotency window: 5 minutes (duplicate `idempotencyKey` returns existing ticket)
- Audit: append an entry to `spec/meta.json#audit` on apply
- Events: `proposal.created`, `proposal.approved`, `spec.applied`
- Geometry policy stub: restrict UI geometry/layout to UI extension (can be tuned later)

Non‑Goals (v1)

- Fine‑grained RBAC and policy engine
- Multi‑scope or cross‑file proposals (one scope per ticket)
- Merge/conflict resolution beyond RFC6902 apply
- Networked kernel RPC; this package is local/host only

API

// submit (host-facing)
host.proposals.submit({
  title, rationale, labels, scope: ["ui"|"logic"|"data"|"theme"|"tests"|"overlays"],
  sourceExtension: string,
  idempotencyKey?: string,
  diffs: RFC6902[]
})

// approve + apply (kernel-internal)
kernel.proposals.approve(ticketId, approver)
kernel.proposals.apply(ticketId)

Events

- proposal.created {ticketId, source}
- proposal.approved {ticketId}
- spec.applied {paths, versionId, ticketId}

Notes

- Geometry isolation: only `@frameforge/ext-ui` may change `spec/ui.json` geometry/layout (policy subject to Phase 3/7).
- Idempotency window: 5 minutes; duplicate `idempotencyKey` returns existing ticket.
- Writes audit entries to `spec/meta.json` on apply.
