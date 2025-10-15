# FrameForge OS Transition (Quick Guide)

This repo is transitioning to FrameForge OS via small, reversible steps.

Phases
- Phase 0: Freeze & Snapshot — add governance docs, tag `pre-os-v0`.
- Phase 1: Dissect — inventory by role, propose file moves (no moves).
- Phase 2: Extract Kernel — proposal-only spec writes via kernel APIs.
- Phase 3: Core Extensions — `ext-ui` and `ext-compiler` behind manifest.
- Phase 4: Gates Parity — sandbox/publish as extensions with normalized reports.
- Phase 5: Agent Panel — policies emit RFC6902 diffs; approval gate.
- Phase 6: Tool/MCP Hub — registry + broker + overlay.
- Phase 7: RAG Integration — spec + adapters; health in UI.
- Phase 8: Clean-up & RFCs — remove direct writes; add RFCs and guides.

Acceptance (global)
- Kernel enforces RFC6902 + approvals.
- Extensions use host API; no direct spec writes.
- Gates consume normalized artifacts.
- Agent Panel MVP live; policies gated.
- Tool Hub broker enforces permissions and shows status.
- RAG spec present; adapters compile.
- Docs updated.

Notes
- Canonical truth is `/spec/**`.
- Code under `/generated/**` is overwritten on publish.
- Prefer minimal, focused diffs aligned to the spec.
