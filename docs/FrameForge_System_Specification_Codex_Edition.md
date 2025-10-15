# FRAMEFORGE --- COMPLETE NO-CODE SYSTEM SPECIFICATION (CODEX EDITION)

## Vision

FrameForge is a visual-first no-code platform where users design
complete apps visually --- not by writing code. AI augments creation by
asking clarifying questions, providing intelligent context help, and
auto-generating structure once the user's visual intent is locked in.
The visual runtime is the single source of truth --- users never need to
touch code.

## Core Principles

1.  AI is a collaborator, not an autocrat.
2.  Visual truth = system truth.
3.  User approval required for any AI change.
4.  Everything is modular and declarative.
5.  AI Chat is component-aware.
6.  MCP tools manage capabilities safely.

## Architecture

UI Runtime (Interpreter) executes the spec visually in the browser. AI
Orchestrator manages planner, verifier, critic, and healer agents. MCP
servers handle modular tool actions. Sandbox handles codegen & testing.
Storage version-controls JSON specs and packs.

## User Experience Flow

1.  Onboarding: AI scaffolds base screens.
2.  Design: Drag & drop, props, logic, data, theme, animation.
3.  Test: Chainable mock APIs.
4.  Chat: Context-aware assistant.
5.  Publish: Freeze → Test → Heal → PR.

## Agents

Planner (CoT): plan actions. Repo-RAG: retrieve design patterns.
Verifier (CoVe): validate logic. Critic (Reflexion): learn from user
corrections. Healer: auto-fix. Reviewer: verify before PR.

## Data Model

Spec files include `ui.json`, `overlays.json`, `behaviors.json`,
`logic.json`, `data.json`, `theme.json`, `packs/`, `tests.json`,
`meta.json`. These together form the full no-code representation of the
app.

## Logic Drawer

Defines user-triggered events and actions in structured JSON. No
node-graph editor needed; users define via simple dropdowns and AI
guidance.

## Chainable Mock API

Mocks define endpoints, responses, variable effects, and chaining.
Simulates latency and errors. Supports storing values like auth tokens
for reuse.

## Chat Assistant

Component-scoped AI chat. Selection = context. AI reads component
details and suggests improvements with clear approval gates.

## MCP Integration

MCP manages all tool access via safe APIs. Tools grouped by domain:
spec, ui, mocks, logic, publish. Each returns structured Proposal
patches requiring approval.

## Design-Time Tools

SpecStore: get/apply spec. UI: insert_component, create_popup,
apply_animation, apply_theme. Logic: add_action, add_condition, record
tests. Mocks: create_mock, simulate_mock, set/get vars.

## Publish-Time Tools

SandboxRunner: generate & test. Healer: propose fixes. VCS: open PR.
Each requires frozen spec version ID.

## Performance & Security

Canvas virtualization, background workers, autosave diffs. All tool
actions scoped by selection and logged for audit.

## Acceptance Criteria

✅ No-code users can build apps visually.\
✅ AI changes require user approval.\
✅ MCP tools safely manage all automation.\
✅ Sandbox build deterministic.\
✅ Fully reversible actions.
