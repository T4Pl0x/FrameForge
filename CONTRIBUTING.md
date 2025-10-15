# Contributing

This project follows the FrameForge System Specification (Codex Edition). Treat `/spec/**` as the source of truth.

Proposal-only writes
- Do not hand-edit code to change behavior. Submit RFC6902 JSON Patch proposals via the kernel host API.
- Use the Agent Panel or programmatic `kernel.proposals.propose({ target, patch, rationale })`.

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

