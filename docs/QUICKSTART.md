# FrameForge OS — Quickstart (v1.0.0-rc.1)

## Prereqs
- Node 20+, pnpm 9+
- GitHub token (optional) for Publisher

## Install & Run
```bash
pnpm i
pnpm run dev
```

## Create your first UI
1. Open **UI Creator** from the Launcher.
2. Drag components onto canvas; use **[ + ]** to configure; 🗑 to remove.
3. `Cmd/Ctrl+Z` undo, `Shift` for fine adjustments. WCAG-AA helpers are built-in.

## Build your first workflow
1. Open **Workflow** panel.
2. Add nodes: **Trigger → Guardrail → PromptLab → UIAgent**; connect edges.
3. Fix **Refactor** warnings (guardrails, fan-out, prompt length).
4. Run **Workflow: Compile** → saves `/spec/logic/flow.json`.
5. Run **Workflow: Debug Trace** to see step logs.

## Compile / Sandbox / Publish
- **Compile**: via Command Bar ("compile") or Workflow command.
- **Sandbox**: runs checks; lights read `/reports/*.json`.
- **Publish**: opens a PR (requires GH token).

## CI Gates (local)
```bash
pnpm run test:coverage
pnpm run test:e2e
pnpm run gates