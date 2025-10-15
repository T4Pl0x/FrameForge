# Phase 1 — Dissection Report

Task: Inventory by role, propose file moves (no moves now), map spec surfaces, and list risks against "UI as truth" and "proposal-only writes".

Inventory (by role)
- kernel: (none yet)
- ui-tools: `src/components/**`, `src/componentRegistry/**`, `src/hooks/**`, `src/inspector/**`, `src/utils/mermaid.js`, `src/workers/**`, `src/canvas/**`
- compiler: `src/components/MermaidCanvas.jsx`, `src/utils/mermaid.js`, `src/components/WorkflowEditor.jsx`
- quality: `scripts/normalize-*.js`, `scripts/summarize-lint-build.js`, `scripts/run-a11y-scan.js`, `schemas/preflight.json`, eslint/vite configs
- sandbox: `.github/workflows/frameforge_sandbox.yml`, `scripts/normalize-*.js`, `scripts/emit-build-summary.js`
- publish: `.github/workflows/frameforge_publish.yml`, `.github/workflows/frameforge-override.yml`, `.github/workflows/publish.yml`
- codegen: (none yet) — generated outputs not present; plan for `/generated/**`
- misc: `docs/**`, root configs, `.copilot/**`

Proposed file moves (no moves yet)
- Create workspace `packages/`:
  - `packages/kernel/` — spec store, proposal pipeline, event bus
  - `packages/ext-ui/` — palette/inspector/canvas as UI extension
  - `packages/ext-compiler/` — backend/gen proposals
  - `packages/ext-sandbox/` — CI normalization + reports
  - `packages/ext-publish/` — PR orchestration + statuses
- Introduce `/spec/` — `ui.json`, `logic.json`, `data.json`, `theme.json`, `overlays.json`, `tests.json`, `meta.json`, `analysis.json`
- Introduce `/tools/` — `registry.json`, `*.tool.json`

Spec surface map
- Current repo has no `/spec/**` usage. UI state persists via `localStorage` keys: `frameforge-doc`, `frameforge-backend`, `frameforge-refactor-automation` (see `src/hooks/useAppState.js`).
- Import/export of the working document is JSON via the browser (see `src/hooks/useDocumentOperations.js`).
- No direct writes to files on disk from the client runtime.

Top risks (violations / hotspots)
1) Direct state persistence to `localStorage` bypasses proposal pipeline semantics.
2) No `/spec/**` canonical source yet; UI is truth only in-memory.
3) Import/export flows are free-form JSON, not validated against spec schema.
4) Mermaid workflow editing is detached from any spec-backed `logic.json`.
5) No extension host boundary—UI and capabilities intermix.
6) No event bus for auditability of mutations.
7) Quality gates exist but are not wired to a normalized PR status dashboard in-app.
8) Tool access (AI/chat) lacks a broker with permissions/rate limits.
9) No RAG schema present; future KnowledgeOps coupling is undefined.
10) Docs exist but contributors lack RFC guidance for spec evolution.

PR plan (small, safe)
- PR 1: Add governance docs + tag (done).
- PR 2: Add `/spec/**` stubs and kernel package (no behavior changes); wire alias only.
- PR 3: Add extension host scaffold + ext-ui/ext-compiler manifests (no behavior change).
- PR 4: Add Agent Panel MVP shell with proposal emitters (gated, no apply by default).
- PR 5: Add tools registry + broker stubs and settings UI.
- PR 6: Add sandbox/publish extensions reusing `scripts/normalize-*` outputs.
- PR 7: Add RAG schema + adapters stubs.
- PR 8: Remove direct writes (migrate localStorage flows to kernel store) and add RFC stubs.

Acceptance
- Inventory and proposed moves documented.
- Hotspots identified with file references.
