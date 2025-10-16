# FrameForge OS – Phase 0: Stabilize & Baseline

Goal: Keep the current app stable while OS features land behind flags. No behavior changes with flags OFF. Reversible docs-only PR.

Branch/PR: `stabilize/os-transition`

Outcomes

- Document the transition charter and conventions.
- Document feature flags and `.env.local` usage.
- Baseline acceptance: App unchanged with all flags OFF; tests/validate green.
- Rollback: Revert docs only.

Principles

- Flags default OFF. New OS features must not change default behavior.
- Small PRs, additive scaffolds, reversible.
- Kernel safety (proposal-only, UI-as-truth) remains unchanged.
- No raw integrations in UI; keep broker/mock behind flags.

PR/Branch Convention

- Prefix feature branches with `feat/…`; OS infrastructure with `feat/os-…`.
- Stabilization docs live under `docs/` and `packages/app/.env.example`.
- Acceptance is documented per PR, with flags to flip for local review.

Acceptance (Phase 0)

- With no `.env.local` (or all flags unset):
  - The UI renders baseline layout without OS Desktop/Windows/Launcher/Tray.
  - No new windows or drawers appear; app look remains unchanged.
- CI green: spec validation and app tests pass.

Rollback

- Revert this PR to remove docs and examples. No code paths are changed by this PR.

