# FrameForge UI Designer

An AI-assisted prototyping environment built with React and Vite. FrameForge lets product teams sketch interface frames, brief each component for AI handoff, coordinate tasks, and now map backend/front-end workflows via Mermaid diagrams.

## Specification Guideline

This project follows the FrameForge System Specification (Codex Edition) as the primary source of truth for features, flows, and terminology.

- Read the spec at: `frameforge/docs/FrameForge_System_Specification_Codex_Edition.md`
- Contributors should validate changes against the spec and reference relevant sections in PR descriptions.

## Prerequisites

- **Node.js ≥ 20.19.0** (Vite 7 and @vitejs/plugin-react require it). Earlier 20.x releases, including 20.17.0, will emit engine warnings and break the dev server.
- npm ≥ 10. Task runners use the bundled npm CLI.

To verify versions:

```pwsh
node -v
npm -v
```

Consider using [`nvm`](https://github.com/coreybutler/nvm-windows) or [`fnm`](https://github.com/Schniz/fnm) to switch Node versions on Windows.

## Installation

```pwsh
npm install
```

This pulls React 19, Mermaid, and supporting tooling. If you upgrade dependencies, run `npm audit` afterward to keep track of advisories.

## Development

```pwsh
npm run dev
```

The app expects a modern Node runtime; if the command exits immediately, re-check the Node requirement above.

### Core features

- **Canvas & Frames**: Drag, resize, and annotate UI frames. Persisted frame title options help standardize naming.
- **AI Chat Panel**: Capture product briefs, generate copy guidance, and add scoped tasks directly from assistant replies.
- **Task Board**: Lightweight workflow—toggle status, convert audit findings into backlog items, and track completion.
- **Mermaid Workflow View**: Switch the center panel to Mermaid to describe front-end → back-end flows. Auto-refresh seeds diagrams from existing frames and backend-related tasks, which you can refine by editing the definition.
- **Component Registry**: Insert buttons, form fields, and layout primitives from the contextual add menu. Trash icons remove frames or components in-place.

## Production build

```pwsh
npm run build
```

Outputs static assets under `dist/`. Bundle size warnings stem from Mermaid’s diagram types; tune `build.rollupOptions` if needed.

## Suggested next steps

- Split `ComponentRegistry.jsx` and `App-Refactored.jsx` into smaller modules for maintainability.
- Add tests (e.g., diagram generation, document operations) before expanding the feature set further.
- Document API/service contracts so Mermaid diagrams can map to real backend integrations instead of keyword heuristics.

## License

Internal project — add a license file if you intend to share or open-source.
