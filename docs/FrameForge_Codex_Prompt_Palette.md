# FrameForge Codex Prompt Palette

Use these prompt packs to drive consistent, auditable automation. Each pack assumes proposal-only writes and references spec sections explicitly.

Dissect (Inventory & Map)
- Task: Inventory files by role {kernel|ui-tools|compiler|quality|sandbox|publish|codegen|misc}.
- Output: markdown with evidence, no file moves.

Kernel Extraction
- Task: Create minimal kernel package and wire adapters.
- Constraints: No behavior changes; replace direct spec writes only.

UI Extension
- Task: Extract palette/inspector/canvas behind manifest.
- Emits: `/spec/analysis.json` on save/major edits.

Compiler Extension
- Task: Read ui/data/analysis and propose logic bindings/tests.
- Output: proposals only; include `openQuestions[]` when uncertain.

Gates Parity
- Task: Normalize test/a11y/lint/build artifacts → PR statuses.
- Output: `reports/*.json` and `scripts/normalize-*.js` summaries.

Agent Panel MVP
- Task: Bottom bar + Drawer (Overview, Policies, Tools).
- Behavior: Editing policies emits RFC6902 diffs; approval required.

Tool/MCP Hub
- Task: Implement Tool Registry + Broker + status overlay.
- Behavior: `call:mcp/<tool>` with permissions + rate limits.

RAG Integration
- Task: Add `data.json.rag.indices[]` and `logic.json.agents[].rag`.
- Adapters: `rag_indexer`, `search_docs` with health pings.

