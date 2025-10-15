# FrameForge Main App Charter (Kernel Contract)

Purpose: Define the non-negotiable responsibilities and boundaries of the FrameForge OS kernel so UI and extensions evolve safely without rewrites.

Core tenets
- Proposal-only writes: All mutations to `/spec/**` must arrive as RFC6902 JSON Patch proposals and require explicit approval before apply.
- UI is truth: `/spec/ui.json` is the source of visual structure. Extensions and codegen must not diverge from it.
- No hand edits: Generated code under `/generated/**` is derived from spec + codegen and may be overwritten.

Kernel scope
- Spec store: Load/save spec snapshots (ui, logic, data, theme, overlays, tests, meta, analysis).
- Diff + patch: Compute JSON diffs; validate and apply RFC6902 patches.
- Proposal pipeline: submit → preflight → approve → apply (auditable).
- Event bus: Emitted signals for proposal lifecycle and spec snapshots.
- Host API: Read-only accessors and a `propose()` surface for extensions.

Non-goals
- Rendering UI or owning component logic.
- Direct network publishing, CI orchestration, or tool execution.
- Owning extension UIs—extensions render their own surfaces.

Interfaces (high level)
- Kernel.create(options): returns `{ store, proposals, bus, host }`.
- store.get(path?) → object; store.snapshot() → {spec, version}.
- proposals.propose({target, patch, rationale}) → id.
- proposals.preflight(id) → {ok, errors[]}.
- proposals.approve(id, {by}) → void.
- proposals.apply(id) → {specAfter, version}.
- bus.on(event, fn) where event ∈ ['proposal:submitted','proposal:approved','proposal:applied','spec:changed'].

Acceptance
- All spec writes flow through proposal pipeline.
- No UI behavior changes when kernel is introduced.
- Minimal, focused API surface documented here.

