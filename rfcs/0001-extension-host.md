# RFC 0001 — Extension Host

Summary
- Define a stable host interface for extensions to register capabilities and propose spec diffs.

Motivation
- Decouple core UI from capabilities and codegen.

Proposal
- Host API exposed by kernel: `readSpec()`, `propose({target, patch, rationale, metadata})`.
- Extensions provide `register(host)` and return capability handlers (e.g., `analyze()`, `generate()`).

Rollout
- Start with ext-ui and ext-compiler. No behavior changes initially.

