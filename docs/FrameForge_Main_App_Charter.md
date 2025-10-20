# FrameForge Main App Charter (Phase 0 — Freeze & Snapshot)

Purpose
- Define the main app’s mission, scope, and operating guardrails.
- Stop drift while we transition to the OS architecture and extension-first model.

Mission
- Provide a desktop-like shell (OS) and developer-facing panels to: load extensions, review/apply proposals with approvals, and manage AI/policy settings.

Scope (MVP)
- OS Shell: window manager, Dock/Launcher, app panels (Agents, Tools, Approvals, Settings).
- Extensions Host: dev/prod loading of extension panels and commands.
- Approvals: generate, review, and safely apply patches (dev-only apply with clear guardrails).
- Settings: AI provider configuration (codex/claude/deepseek/openrouter), model/base URL, and policy texts (rules/workflow).

Out of Scope (for Phase 0)
- Server-side persistence, multi-user auth, and production brokers.
- Non-dev apply flows and write access outside whitelisted files.

Guardrails
- Dev endpoints must never be exposed in prod builds.
- Tokens/keys are for dev only (localStorage); do not log secrets.
- Keep patches constrained and validated before apply.

Architecture Tenets
- packages/* = canonical runtime code; frameforge/src/** = legacy/demo.
- Dev/prod separation by flags: DEV + VITE_EXPOSE_DEV for /__ff/* endpoints.
- OS panels are thin UIs that call well-defined hosts/adapters; avoid kitchen-sink panels.

Contribution Rules
- No behavior change without a linked proposal/issue and acceptance criteria.
- Prefer small, focused PRs; document any new env flags and scripts.
- Tests for any new host logic; smoke tests for new panels.

Quality Bar
- CI runs lint + typecheck + tests.
- New docs update QUICKSTART or EXTENSIONS_SDK if applicable.

