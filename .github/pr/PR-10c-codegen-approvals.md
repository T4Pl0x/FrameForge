Title: feat(codegen): ff:codegen CLI + dev propose/apply endpoints

Body:

CLI: packages/shared/codegen/ff-codegen.mjs

- --mode preview → prints planned files (no writes)
- --mode proposal → writes files + proposal artifact + dev autoload index

Dev endpoints in Vite:

- POST /__ff/propose → runs codegen in proposal mode
- POST /__ff/apply → applies restricted patches to tools/registry.json, path-locked, max 20 patches, backup write, returns updated registry JSON

Approvals Drawer lists artifacts, supports:

- Apply (dry-run): in-memory preview of next registry
- Apply (real): writes registry + marks appliedAt

OS auto-load reads the generated dev index and shows toast: “Loaded N extension(s)”.

How to verify

Example spec:

{ "version":"v1", "appId":"demoapp",
  "extensions":[{ "name":"@frameforge/ext-demoapp", "entry":"packages/ext-demoapp/src/entry.tsx", "widgets":[] }]
}

Propose:

pnpm ff:codegen --target web --spec builder-output.json --out packages/ext-demoapp-web --mode proposal

pnpm dev → toast + window: demoapp • generated (web).

Approvals → Apply ticket → tools/registry.json updated; backup created.

Checks

- Preview mode prints; Proposal mode writes artifact + dev index
- /__ff/apply rejects >20 patches, non-registry paths, or invalid ops
- Apply (dry-run) shows expected next registry; Apply (real) writes backup + returns new registry JSON

Query Codex
@codex Review the restrictions and confirm they match the dev policy (file-scoped, reversible). If any additional guardrails are desired, list them and I’ll add.

