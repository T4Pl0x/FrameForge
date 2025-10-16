Kernel

Implements the proposal pipeline, RBAC stubs, idempotency keys, audit logging, and event bus.

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

- Geometry isolation: only `@frameforge/ext-ui` may change `spec/ui.json` geometry/layout.
- Idempotency window: 5 minutes; duplicate idempotencyKey returns existing ticket.
- Writes audit entries to `spec/meta.json` on apply.

