Title: chore(registry): add top-level "extensions":[] via Approvals

Body:

Adds proposal artifact: frameforge/reports/proposals/align-registry.json
(patch path: "/tools/registry.json#/extensions").

Apply via Approvals (dev-only): backs up tools/registry.json and ensures a top-level "extensions":[].

Keeps Tool Hub backward-compatible (tools[] preserved).

How to verify

Open Approvals Drawer → select align-registry → Apply.
Confirm .bak.<ts> backup created; tools/registry.json now contains extensions: [].

Checks

- Apply endpoint accepts artifact and returns updated registry JSON
- Backup is written before mutation
- Tool Hub continues to read both tools[] and extensions[]

Query Codex
@codex Confirm this registry shape is canonical for dev autoload + Tool Hub.

