# Changelog

## 1.0.0-rc.1 — FrameForge OS
### Added
- UI Creator (Figma-style chrome, grid snap, keyboard & a11y)
- Workflow/Agent Builder (nodes, edges, refactor, compile, debug)
- Compiler CLI + plan writer; Sandbox/Publisher hooks
- Dynamic extension/view registries
- Security: env-gated approvals; session-scoped tokens
- CI/CD: unit+e2e, axe, perf smoke, coverage/build/a11y gates

### Changed
- Bundle warning limit 1200 KB; lazy-load heavy deps

### Notes
This is a release candidate; expect minor API polishing before 1.0.0.