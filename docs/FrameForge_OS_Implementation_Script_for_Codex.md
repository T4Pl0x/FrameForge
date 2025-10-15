
# FrameForge OS — Implementation Script for Codex
> **Copy-paste this into your task runner.** It specifies the OS layout, kernel contracts, extensions, panels, and gates we agreed on. Build in small PRs with the acceptance checks below.

---

## 0) Objectives (What to ship)
- **OS Workspace Shell** with Dock (left), Workspace Surface (center), Tasks/Approvals Drawer (right), Bottom Status Bar (agents + tools).
- **Kernel** (proposal pipeline, RBAC, idempotency keys, audit).
- **Extension Host** (manifest, permissions, worker isolation, event bus).
- **Approvals UX** (Proposals Drawer with Approve/Apply; dev auto-approve flag).
- **Broker Rewire** (sandbox/publish polling via normalized artifacts).
- **Agent Panel MVP** (status dots, policy toggles → proposals).
- **Tool/MCP Hub MVP** (registry, broker, status overlay, settings panel).
- **RAG Spec Hooks** (data.json indices, logic.json agent rag configs).

> UI is truth — only `ext-ui` may change geometry/layout. All edits to `/spec/**` are RFC6902 proposals through the kernel.

---

## 1) Monorepo Structure (target)
```
packages/
  kernel/                 # proposal pipeline, RBAC, idempotency, audit, event bus
  ext-ui/                 # palette, inspector, canvas, emits analysis.json
  ext-compiler/           # AI vs Non-AI, workflows/agents/bindings/tests proposals
  ext-sandbox/            # runs tests/a11y/lint/build, uploads normalized artifacts
  ext-publish/            # PR creation, statuses, override comment
  ext-a11y/               # (optional later) contrast, aria fixes proposals

spec/
  ui.json  logic.json  data.json  theme.json  overlays.json  tests.json  meta.json  analysis.json

tools/
  registry.json          # installed tools/MCPs (status, perms, endpoints)
  *.tool.json            # per-tool manifests

scripts/
  normalize-tests.js
  normalize-a11y.js
  normalize-lint-build.js
  emit-build-summary.js
  validate-spec.mjs
  migrate-spec.mjs

src/
  App-Refactored.jsx
  kernel/KernelProvider.jsx
  components/ProposalsDrawer.jsx
  components/AgentsPanel.jsx
  components/ToolsOverlay.jsx
  components/ToolSettingsPanel.jsx
  components/GatesBadges.jsx
```

---

## 2) Workspace Shell (OS Layout)

### 2.1 Regions
- **Dock (Left):** extension launchers (UI, Compiler, Data, A11y, Sandbox, Publish).
- **Workspace Surface (Center):** active extension view; others minimized but live.
- **Tasks Drawer (Right):** Proposals & Approvals (always accessible).
- **Bottom Bar:** Agents chip (`🤖 Agents: 🟢X 🟡Y 🔴Z`), Tools overlay chip, Logs toggle.

### 2.2 Routes/Hotkeys
- `Ctrl/Cmd+1..6` switch active extension.
- `Ctrl/Cmd+P` open **Proposals Drawer**.
- `Alt+J` open **Agents Panel**; `Alt+T` Tools overlay; `Alt+H` Run History.

### 2.3 Acceptance
- Switching extensions preserves context; non-active extensions receive `spec.applied`/`ui.selection.changed` events.
- Tasks Drawer shows pending proposals globally (not tied to an extension view).

---

## 3) Kernel

### 3.1 Proposal Pipeline API
```ts
// submit
host.proposals.submit({
  title, rationale, labels, scope: ["ui"|"logic"|"data"|"theme"|"tests"|"overlays"],
  sourceExtension: string,
  idempotencyKey?: string,
  diffs: RFC6902[]
})

// approval + apply (kernel-internal)
kernel.proposals.approve(ticketId, approver)
kernel.proposals.apply(ticketId)
```

### 3.2 RBAC & Policy
- Roles: Owner, Maintainer, Contributor, Viewer.
- Policy rules:
  - Only `@frameforge/ext-ui` may **change geometry** (reject others).
  - All external call steps must include **self-heal** (retry/backoff/mock).
  - `approvalGated` is globally **true** (read-only).
- **Idempotency**: drop duplicate `idempotencyKey` submits within 5 minutes.
- **Audit**: write entries to `spec/meta.json` `{ticketId, who, when, diffs, labels, sourceExtension}`.

### 3.3 Events
- `spec.applied {paths, versionId, ticketId}`
- `proposal.created {ticketId, source}`
- `proposal.approved {ticketId}`
- `ui.selection.changed {screenId, frameId, componentId}`
- `sandbox.run.completed {runId, gates}`

### 3.4 Acceptance
- Direct spec writes are blocked; proposals required.
- Geometry patches from non-UI extension are rejected with a clear reason.
- Audit entries appear on apply.

---

## 4) Extension Host

### 4.1 Manifest (example)
```json
{
  "name": "@frameforge/ext-ui",
  "version": "1.0.0",
  "capabilities": ["componentPalette","inspectorPanels","canvasTools","tutorials","proposeSpecDiff"],
  "permissions": {
    "read": ["spec:ui","spec:data","spec:theme","ui:selection"],
    "propose": ["spec:ui","spec:theme"]
  },
  "entry": { "worker": "dist/worker.js" },
  "compat": { "hostApi": "^1.0.0" }
}
```

### 4.2 Isolation
- Run extensions in Workers/Iframes; message bus API; timeouts; memory caps; crash isolation.

### 4.3 Acceptance
- Extensions cannot mutate the DOM outside their surface.
- Permission checks enforced before `proposals.submit` returns.

---

## 5) Approvals UX (Proposals Drawer)

### 5.1 UI
- List of pending tickets (title, labels, source, risk).
- Expand → show humanized Task Plan + raw diffs.
- **Approve** → **Apply**. Dev flag: `FF_DEV_AUTO_APPROVE=true` (local only).

### 5.2 Acceptance
- Drawer shows proposals from any extension.
- Approve/Apply results in `spec.applied`; canvas updates; audit line added.

---

## 6) Broker + Gates (Sandbox/Publish)

### 6.1 Broker calls
```ts
const run = await broker.sandbox.latestRun({ branch, workflow: "frameforge_publish" });
const tests = await broker.artifacts.getJson({ runId: run.id, name: "tests-report.json" }).catch(() => null);
const a11y  = await broker.artifacts.getJson({ runId: run.id, name: "a11y-report.json"  }).catch(() => null);
const lb    = await broker.artifacts.getJson({ runId: run.id, name: "lint-build.json"   }).catch(() => null);
```

### 6.2 Normalized shapes
```ts
type TestsReport = { summary:{passed, failed, skipped, total, durationMs} };
type A11yReport  = { violations, passes, inapplicable, waived? };
type LintBuild   = { lintErrors, lintWarnings, buildErrors, buildWarnings };
```

### 6.3 Gate calc
- tests: `failed === 0`
- a11y: `violations === 0`
- lint/build: `buildErrors===0 && lintErrors===0`
- Unknown state → show tooltip “artifact missing/unreadable.”

### 6.4 Acceptance
- UI gates match PR statuses.
- No raw GitHub calls remain in App.

---

## 7) Agent Panel (MVP)

### 7.1 UI
- Bottom bar chip → Drawer with **Overview / Policies / Tools** tabs.
- Status dots: 🟢 online, 🟡 degraded, 🔴 offline, 🟣 busy.
- Policy toggles: `askWhenUncertain`, `maxRisk`, `selfHeal.retries/backoff`, `rateLimit`, `cot`, `cove`, `memory`.

### 7.2 Diff examples
```json
[{ "op":"replace", "path":"/agents/Orchestrator/policies/cove", "value":"strict" }]
[{ "op":"add", "path":"/agents/Orchestrator/policies/rateLimit", "value": { "rpm":60,"burst":10 } }]
```

### 7.3 Acceptance
- Toggling creates a proposal; changes apply only after approval.
- Tool list shows status from Tool Registry; no direct calls.

---

## 8) Tool/MCP Hub (Registry + Broker + Overlay)

### 8.1 Registry shape
```json
{
  "tools": [
    {"id":"a11y_scan","kind":"mcp","endpoint":"https://...","status":"online","lastPingISO":"...","permissions":{"callableBy":["@frameforge/ext-ui"]}},
    {"id":"search_docs","kind":"mcp","endpoint":"https://...","status":"offline"}
  ]
}
```

### 8.2 Status Overlay
- Small overlay showing tool statuses; click opens Tool Settings Panel.
- Desktop shortcuts optional (open settings directly).

### 8.3 Acceptance
- Broker enforces `permissions.call` and rate limits.
- Status dots reflect heartbeat; tool disable prevents calls.

---

## 9) RAG Spec Hooks

### 9.1 data.json
```json
{ "rag": { "indices": [
  {"id":"docs_index","source":"s3://bucket/docs","embedding":"e5-large","chunk":"md:512/64"}
] } }
```

### 9.2 logic.json
```json
{ "agents":[
  { "id":"KnowledgeOps","role":"rag-qa","rag":{"indices":["docs_index"],"reranker":"cross-encoder-msmarco","topK":5} }
] }
```

### 9.3 Acceptance
- RAG agent calls go through broker (`search_docs`); if down, self-heal uses mocks.
- Agent Panel displays index health; attach blocked if 🔴.

---

## 10) Geometry Isolation

### 10.1 Kernel policy
- Reject any proposal that mutates `/spec/ui.json` **geometry/layout** unless `sourceExtension === "@frameforge/ext-ui"`.

### 10.2 Acceptance
- Attempt from other extensions returns a policy error; log shows offending paths.

---

## 11) Dev Flags & Scripts
- `FF_DEV_AUTO_APPROVE=true` (localStorage/env) — auto-approve proposals for dev only.
- `npm run validate:spec` — schema checks.
- `node scripts/migrate-spec.mjs --from v1 --to v1.1` — scaffold migration.
- `npm run reports:verify:(one|matrix)` — CI reports PoP checks (CI only).

---

## 12) Step-by-step Tasks (PR-sized)

1) **Kernel basics**: proposal submit/approve/apply, RBAC stubs, audit write.  
   *Acceptance*: proposal flow works; audit in `meta.json`.

2) **Workspace shell**: Dock/Surface/Drawer/Bottom bar skeleton + hotkeys.  
   *Acceptance*: extension swapping, drawer opens anywhere.

3) **Approvals Drawer**: list, details, approve/apply, dev auto-approve.  
   *Acceptance*: applies diffs; canvas updates.

4) **Broker rewire**: gates via normalized artifacts + unknown tooltips.  
   *Acceptance*: matches PR statuses, no raw GH calls.

5) **Agent Panel MVP**: status dots + policy toggles → proposals.  
   *Acceptance*: toggles create proposals; dots live-update.

6) **Tool Hub MVP**: registry + broker + overlay + settings panel.  
   *Acceptance*: permissions enforced; health reflects.

7) **Geometry isolation policy** in kernel.  
   *Acceptance*: non-UI geometry patches rejected with reason.

8) **RAG hooks**: data/logic schema, broker adapters, panel display.  
   *Acceptance*: agent uses index or mock; status shown.

9) **Spec validate + migrate scripts**.  
   *Acceptance*: validate passes on current spec; migrate scaffolds a noop bump.

---

## 13) Global Acceptance Criteria
- **UI-as-Truth**: Only ext-ui changes geometry/layout.
- **Proposal-only**: All spec mutations via RFC6902 + approvals.
- **Gates parity**: UI gate lights == PR statuses from normalized artifacts.
- **Policy & Audit**: kernel enforces rules; writes audit lines.
- **Resilience**: offline tools show red + tooltips; RAG calls fall back gracefully.
- **Docs**: inline README for each package; root README explains OS layout.

---

## 14) Nice-to-haves (later)
- Simulation runner in Agent Console.
- A11y “Fix with AI” proposals (ext-a11y).
- Desktop shortcuts grid for tools/agents.
- Multi-tenant extension permissions.
- Undo/redo per proposal (history panel).

---

**Deliver in small PRs.** If anything conflicts, prefer kernel policy and spec safety over convenience.
