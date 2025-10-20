# FrameForge Codex Prompt Palette (Phase 0)

Purpose
- Establish a consistent, reusable prompt structure for AI-assisted workflows (codex/claude/deepseek/openrouter).
- Make constraints, acceptance, and outputs explicit to reduce ambiguity.

Prompt Template
- System: Role, ownership, and non-negotiable constraints (security, dev-only, no secrets in logs, read-only in prod).
- Developer: Task framing with inputs, repo structure pointers, file paths, acceptance criteria, and constraints.
- User: Concrete ask or follow-up clarifications.
- Tooling: Explicitly specify allowed tools and when to refuse.

Constraints
- Dev-only network writes; never expose /__ff/* unless DEV && VITE_EXPOSE_DEV=1.
- No secrets or tokens in logs or artifacts; mask keys.
- Patches limited to whitelisted files for demos.

Acceptance Criteria (examples)
- “Docs exist; builds pass; no behavior change.”
- “Smoke test runs and passes; panel renders without runtime errors.”
- “Schema validation catches malformed patches; Download Patch produces RFC6902 JSON.”

Output Format
- Use concise bullet summaries for actions taken.
- Provide file paths and exact commands separately when necessary.
- Avoid dumping large blobs unless explicitly requested.

Examples (abbrev.)
- Governance phase: create docs/FrameForge_Main_App_Charter.md, docs/Transition_README.md, tag baseline.
- Extension demo: mount window, read Settings, submit mock proposal.

Notes
- Treat packages/* as canonical runtime code; frameforge/src/** is legacy/demo while transitioning.
- Prefer patches and docs over vague narratives.

