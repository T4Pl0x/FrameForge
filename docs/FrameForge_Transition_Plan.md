
# FrameForge OS Transition Plan (Codex Playbook)

This plan converts the current repo into **FrameForge OS** without a rewrite. It follows small, reversible PRs with explicit acceptance checks.

> **Golden Rules**
> - **UI is Truth**: `/spec/ui.json` owns visual structure.
> - **Proposal-only writes**: all mutations arrive as **RFC6902 diffs**, go through **approval**, then apply.
> - **No code edits by hand**: Generated code comes from spec + codegen only.
> - **Publish path**: `repository_dispatch` → Sandbox (normalized artifacts) → Gates → PR (labels/status/override).

---

## Phase 0 — Freeze & Snapshot

**Goal**: Stop drift; add governance docs.

**Tasks**
- Create branch: `stabilize/os-transition`.
- Add docs:
  - `frameforge/docs/FrameForge_Main_App_Charter.md` (kernel contract)
  - `frameforge/docs/FrameForge_Codex_Prompt_Palette.md` (prompt packs)
  - `frameforge/docs/Transition_README.md` (short explainer)
- Tag current state `pre-os-v0`.

**Acceptance**
- Docs exist; CI stays green.

---

## Phase 1 — Dissect (Inventory & Map)

**Codex Prompt**
```
Task: Dissect the current repo into Kernel vs Extensions vs Codegen.

Deliverables:
1) Inventory: list files by role → {kernel|ui-tools|compiler|quality|sandbox|publish|codegen|misc}.
2) Proposed file moves (no moves yet): path → target package (e.g., packages/ext-ui).
3) Spec surface map: where /spec/** is read/written; flag any direct code writes.
4) Risk list: top 10 violations of "UI as truth" or "proposal-only writes".
Output: markdown report + PR plan (small, safe PRs).
Constraints: no behavior changes; no file moves.
```
**Acceptance**
- Inventory + proposed moves; hotspots identified with evidence.

---

## Phase 2 — Extract the Kernel (Main App)

**Codex Prompt**
```
Task: Create a minimal "kernel" package and wire it without behavior changes.

Scope:
- packages/kernel/: spec loader, snapshot/diff, proposal pipeline (submit→preflight→approve→apply), event bus.
- Replace direct spec writes with kernel "proposal-only" interface.
- Add thin adapter so existing UI flows keep working.

Deliverables:
- New package with unit tests for proposal pipeline and event bus.
- Docs: kernel README (scope + non-goals).
```
**Acceptance**
- App runs as before.
- All spec writes now go through kernel APIs.
- Tests pass.

---

## Phase 3 — Carve Out Core Extensions

### A) UI Extension (`@frameforge/ext-ui`)

**Codex Prompt**
```
Task: Extract palette/inspector/canvas into packages/ext-ui behind a manifest.

Scope:
- Manifest (capabilities: componentPalette, inspectorPanels, canvasTools, tutorials, proposeSpecDiff).
- Read-only spec access via kernel host API.
- Emit /spec/analysis.json on save/major edits.

Constraints:
- Only ext-ui can change geometry/layout.
Deliverables: ext-ui package + host registration + smoke tests.
```
**Acceptance**
- Visual editing works through ext-ui; analysis.json emitted.

### B) Compiler Extension (`@frameforge/ext-compiler`)

**Codex Prompt**
```
Task: Extract backend/gen logic into packages/ext-compiler (AI vs Non-AI decision).

Scope:
- Read ui.json, data.json, analysis.json.
- Propose workflows/agents/bindings/tests (logic.json, data.json, tests.json).
- Include openQuestions[] when uncertain.

Deliverables: ext-compiler package + sample proposals; no code writes.
```
**Acceptance**
- "Generate Backend" shows proposals; approve → spec updates; no code touched.

---

## Phase 4 — Gates Parity (Sandbox & Publish as Extensions)

**Codex Prompt**
```
Task: Ensure Sandbox & Publish use normalized artifacts and repository_dispatch.

Scope:
- packages/ext-sandbox: run tests/a11y/lint/build and upload:
  - reports/tests-report.json
  - reports/a11y-report.json
  - reports/lint-build.json
- packages/ext-publish: open PR; post commit statuses from normalized files; support owner override (reason+expiry).

Deliverables: extensions + workflows; scripts/normalize-*.js present.
```
**Acceptance**
- UI gates mirror PR statuses; override path audited.

---

## Phase 5 — Agent Panel (MVP)

**Codex Prompt**
```
Task: Implement Agent Panel MVP.

Scope:
- Bottom task bar: "Agents: 🟢X 🟡Y 🔴Z" → opens Drawer.
- Drawer tabs: Overview, Policies, Tools.
- Editing policies produces RFC6902 diffs to logic.json (approval required).
- Tool statuses read from Tool Registry (read-only).

Deliverables: panel UI, proposal wiring, health computation.
```
**Acceptance**
- Policy toggles create proposals; nothing changes until approved.
- Health dots reflect heartbeats/call outcomes.

---

## Phase 6 — Tool/MCP Hub (Registry + Broker + Overlay)

**Codex Prompt**
```
Task: Implement Tool Registry + MCP Broker + status overlay + settings.

Scope:
- /tools/registry.json and per-tool manifests.
- Broker API: call:mcp/<tool> with permissions/rate limits.
- Status overlay + desktop shortcuts → settings panel.

Deliverables: registry, broker, overlay, settings UI; unit tests for permission checks.
```
**Acceptance**
- Extensions call tools via broker; permissions enforced; statuses live-update.

---

## Phase 7 — RAG Integration (Spec + Runtime)

**Codex Prompt**
```
Task: Add RAG spec + runtime adapters and integrate with KnowledgeOps.

Scope:
- data.json: rag.indices[] (source, embedding, chunk).
- logic.json: agents[].rag (indices, reranker, topK).
- Broker adapters: rag_indexer, search_docs with health pings.
- Agent Panel: show index status; block attach if red.

Deliverables: schema updates, adapters, panel hooks, tests.
```
**Acceptance**
- RAG flows work or fall back to mocks; health visible in UI.

---

## Phase 8 — Clean-up & RFCs

**Codex Prompt**
```
Task: Remove direct writes, finalize docs, add RFCs.

Scope:
- Eliminate any bypass of proposal pipeline.
- Add /rfcs/0001-extension-host.md and /rfcs/0002-spec-v1.md (stubs ok).
- Update CONTRIBUTING.md (how to build extensions + propose diffs).

Deliverables: PR with removals + docs; CI green.
```
**Acceptance**
- No direct writes remain; docs guide new contributors.

---

## File/Folder Targets (final structure)

```
packages/
  kernel/
  ext-ui/
  ext-compiler/
  ext-sandbox/
  ext-publish/
  (later) ext-a11y/ ext-theme/ ext-data/

spec/
  ui.json  logic.json  data.json  theme.json  overlays.json  tests.json  meta.json  analysis.json

tools/
  registry.json  *.tool.json

scripts/
  normalize-tests.js  normalize-a11y.js  normalize-lint-build.js  emit-build-summary.js

.github/workflows/
  frameforge_sandbox.yml
  frameforge_publish.yml
```

---

## Acceptance Gate (global)

A transition PR is **approved** only if:
- Kernel proposal pipeline enforces RFC6902 + approvals.
- Ext-UI and Ext-Compiler run through host API, not direct writes.
- Sandbox & Publish consume **normalized** artifacts for gates.
- Agent Panel MVP works (policy → proposal → approval → apply).
- Tool Hub broker enforces permissions and shows live status.
- RAG spec exists; adapters compile; panel shows index health.
- Docs updated (Charter, Transition README, RFC stubs).

---

**Done right, this plan gives you an OS-grade core in days—not months—while keeping current users productive.**
