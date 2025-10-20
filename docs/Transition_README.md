# FrameForge OS Transition — Phase 0 (Freeze & Snapshot)

Goal
- Stop drift; document guardrails; set a baseline tag to anchor further work.

Actions in Phase 0
- Add governance docs:
  - docs/FrameForge_Main_App_Charter.md
  - docs/FrameForge_Codex_Prompt_Palette.md
  - docs/Transition_README.md (this file)
- Tag baseline: `pre-os-v0` (no behavior changes).

Rules of the Road
- packages/* = canonical runtime; frameforge/src/** = legacy/demo while transitioning.
- Dev endpoints (`/__ff/*`) exist only if DEV && VITE_EXPOSE_DEV=1 and must be excluded from prod builds.
- Settings (AI keys/models) persist in localStorage only for dev; never log secrets.
- Proposals must validate against schema before preview/apply; Download Patch provides RFC6902 JSON.

How to Verify
- Builds pass locally (lint/typecheck/tests) and CI is green.
- Opening Settings renders; Approvals shows proposals/dev labels; no behavior changes from this phase.

Next Phases (preview)
- Phase 1: Approvals hardening, sample extension polish, broker improvements.
- Phase 2: Production path (server broker, packaging, optional telemetry).

