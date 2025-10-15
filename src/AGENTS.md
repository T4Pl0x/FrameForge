# FrameForge Agent Guidelines (src scope)

Scope: This AGENTS.md applies to all files under `frameforge/src/**`. It complements the repo‑root AGENTS.md and takes precedence here if there is any conflict.

## Global Guardrails (mirrored)

- Do not edit app behavior outside the spec.
- Canonical truth = `/spec/**` (ui.json, overlays.json, behaviors.json, logic.json, data.json, theme.json, packs, tests.json, meta.json).
- Code under `/generated/**` is overwritten on publish; only modify when the change is mechanical and aligns with the frozen spec version.
- If behavior must change, propose a spec diff (RFC6902) instead of hand‑editing code.
- Respect anchors/regions in source files:
  - `// FF:component=<id>`
  - `// FF:gen-begin <region>` … `// FF:gen-end <region>`
- Output unified diffs (as `git diff --no-prefix`) plus a short rationale & risk for each change.
- Run quick checks and summarize results: tests, a11y, lint, build.
- If you remove or rename, include migration notes.

## Code Style & Structure

- Follow existing patterns: hooks in `src/hooks/`, components in `src/components/`, utils in `src/utils/`.
- Avoid new folders or large renames unless the spec dictates the architecture.
- Keep UI copy consistent with the spec’s nomenclature.

## Testing & Verification

- Prefer zero‑warning builds where feasible.
- Verify flows called out in the spec (Apply Edits → Tasks, linking screens/modals, approvals).

