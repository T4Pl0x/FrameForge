Title: feat(epg): Prompt Lab Composer + tokens (flag-gated)

Body:

Adds shared prompt types: packages/shared/src/prompt.types.ts.
Adds Prompt Lab scaffolds: packages/app/src/prompt-lab/* (Composer, Tokens, Scorecard shells).
Launcher tile appears when VITE_FF_PROMPT_LAB=1.
Saves are proposal-only (no direct writes).

How to verify

In .env.local add VITE_FF_PROMPT_LAB=1.
Launch Prompt Lab from the OS Launcher.
Compose parts/tokens and view the merged preview (dry-run).

Checks

- Flags default OFF; app unchanged with flag OFF
- Composer renders and token expansion works
- No file writes occur (proposal-only path reserved for later)

Query Codex
@codex Confirm EPG scaffolds match scope and integrate with approvals policy.

