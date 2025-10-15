# FrameForge Agent Guidelines

This repository is governed by the FrameForge System Specification (Codex Edition).

## Global Guardrails

- Do not edit app behavior outside the spec.
- Canonical truth = `/spec/**` (ui.json, overlays.json, behaviors.json, logic.json, data.json, theme.json, packs, tests.json, meta.json).
- Code under `/generated/**` is overwritten on publish; only modify when the change is mechanical and aligns with the frozen spec version.
- If behavior must change, propose a spec diff (RFC6902) instead of hand-editing code.
- Respect anchors/regions in source files:
  - `// FF:component=<id>`
  - `// FF:gen-begin <region>` … `// FF:gen-end <region>`
- Output unified diffs (as `git diff --no-prefix`) plus a short rationale & risk for each change.
- Run quick checks and summarize results: tests, a11y, lint, build.
- If you remove or rename, include migration notes.

- Primary guideline: `frameforge/docs/FrameForge_System_Specification_Codex_Edition.md`
- Treat the specification as the source of truth for UX flows, features, terminology, and behaviors.
- When making changes, validate against the spec before implementation and before PRs.
- Prefer minimal, focused diffs that map directly to spec sections and acceptance criteria.
- If the code diverges from the spec, open an issue to reconcile (update spec first, then code), unless the change is clearly a bug fix aligned with the spec’s intent.

Code style and structure:
- Match existing patterns in this repo (hooks in `src/hooks/`, components in `src/components/`, docs in `frameforge/docs/`).
- Do not introduce new folders or major renames without confirming they’re consistent with the spec’s architecture.
- Keep UI copy consistent with the spec’s nomenclature (e.g., “Apply Edits”, “Δ Changed”, linking flows, etc.).

Testing and verification:
- Build should pass without warnings where feasible.
- Manually verify flows outlined in the spec (e.g., Apply Edits → Tasks, linking screens/modals, approvals) after changes.

Documentation:
- If a change adjusts a behavior described in the spec, add a short note to the top of the spec document (changelog section) or create an addendum in `frameforge/docs/` and link it.
