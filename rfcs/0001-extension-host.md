# RFC 0001 — Extension Host Contract (v1)

Status: Draft
Owner: Core
Reviewed: —

Summary
- Define a minimal, safe contract for loading extensions and proposing spec changes without direct writes.

Goals
- Load extensions with an explicit manifest and entry function.
- Restrict privileges via declared permissions/capabilities.
- Enforce proposal-only writes with approvals and audit.
- Support dev and prod loading modes.

Non‑Goals
- Full worker/iframe isolation (tracked; recommend future hardening).
- Networked kernel RPC.

Contract
- Manifest fields: `name`, `version`, `entry`, `capabilities[]`, `permissions[]`.
- Entry: `export default function entry(ctx) { ... }`.
- Context (`ctx`) provides a minimal surface:
  - `openWindow({ title, component })` (UI surface)
  - `proposals.submit({ title, diffs, scope, sourceExtension, idempotencyKey })`
  - Optional: event bus publisher for telemetry

Permissions
- `permissions` expresses allowlists (e.g., `propose:spec`, `tools:call`).
- The host enforces capability checks and may reject entry on mismatch.

Proposals
- All writes must be RFC6902 diffs.
- Lifecycle: submit → preflight → approve → apply.
- Audit lines are appended to `spec/meta.json#audit` on apply.
- Geometry/layout patches to `ui` are only valid when `sourceExtension === "@frameforge/ext-ui"`.
- IdempotencyKey is recommended for de‑dupe.

Loading
- Dev: load via Vite `/@fs` URLs.
- Prod: load via manifest.module or built paths.

Security Notes
- Never expose provider keys to the client; calls must go through a broker/proxy.
- Use per‑tool rate limits in the broker; surface slow‑down hints in UI.
- Plan to enforce worker/iframe isolation with CSP (connect‑src restricted to broker endpoints).

Appendix
- See RFC 0002 for spec structure and patch path conventions.
