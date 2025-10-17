# Contributing

This project follows the FrameForge System Specification (Codex Edition). Treat `/spec/**` as the source of truth.

Proposal-only writes
- Do not hand-edit code to change behavior. Submit RFC6902 JSON Patch proposals via the kernel host API.
- Use the Agent Panel or programmatic `kernel.proposals.propose({ target, patch, rationale })`.

## Propose an extension

To propose, create, and apply spec modifications:

1. **Codegen**: Design your spec changes in code (write TypeScript that generates RFC6902 patches).
2. **Propose**: Submit via `kernel.proposal.propose()`. Creates a proposal artifact in `reports/proposals/`.
3. **Approvals**: Open Approvals drawer → select proposal → click "dry-run" to preview, then "Apply" if you approve.
4. **Apply**: Kernal applies with audited JSONL logging to `frameforge/reports/audit.log` + `.bak.<ts>` backups.

Example proposal generator:
```typescript
// My extension proposal logic
const changes = computeSpecDiffs(currentSpec, desiredSpec);
kernel.proposals.propose({
  target: 'spec/logic.json',
  patch: changes,
  rationale: 'Adds feature X for improved workflow Y'
});
```

Extensions
- Register new capabilities by adding packages under `packages/` and exposing `register(host)`.
- Keep UI behavior unchanged unless tied to spec updates.

Quality gates
- Normalize test/a11y/lint/build artifacts using `scripts/normalize-*.js`.
- CI should consume normalized reports and reflect statuses in PRs.

Getting started
- `npm run dev` to start the app.
- `npm run build` for production build.
- `npm run test:kernel` to run the kernel smoke test.
