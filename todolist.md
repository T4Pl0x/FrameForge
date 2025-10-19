# FrameForge Codebase To‑Do

## P0 — Consolidation and Critical Fixes
- Unify `useCanvasSurface` hook into a single TS implementation compatible with all call sites.
- Remove duplicate JS version to avoid ambiguity.
- Fix broker/registry mismatches (key by `id`, permissive action check, request timeout).
- Make ToolsOverlay status calls reliable against registry shape.
- Repair obvious mojibake/encoding issues in key files.
- Replace corrupted status string in RAG adapter.
- Remove stray npm `package-lock.json` (use pnpm workspace).

## P1 — Maintainability & Safety
- Add OffscreenCanvas fallback in sampling paths; harden createImageBitmap usage.
- Introduce lightweight logger; gate dev logs.
- Add minimal ESLint config for monorepo (TS/React) and run once.
- Document modern extension loading in Extensions SDK doc.

## P2 — Structure & Docs
- Split oversized components (App-Refactored, Frame) into subcomponents/hooks.
- Update broader docs to reference `packages/*` as canonical runtime code.

---

Completed in this pass:
- P0: unify canvas hook; delete duplicate JS; fix call compatibility.
- P0: broker keyed by `id`, safer permissions, timeouts; ToolsOverlay fixed.
- P0: fix encoding issues in select files; RAG adapter status string.
- P0: remove package-lock.json.
- P1: add OffscreenCanvas fallback in ContrastBadge sampling.
- P1: add shared logger and use in app boot.
- P1: add ESLint config scoped to packages/*.
- P1: extend Extensions SDK doc with dev loader example.
- P0: consolidate code paths by removing duplicate top-level `src/**` files in favor of `frameforge/src/**`.
- P1: split `Frame.jsx` component menu into `ComponentMenu.jsx`.
