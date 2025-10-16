# Feature Flags – Conventions and Usage

Flags are read from Vite environment variables (packages/app) and default to OFF. To enable features locally, create `packages/app/.env.local` and set the desired flags to `1` or `true`.

Conventions

- All feature flags use the `VITE_FF_` prefix in the app.
- Flags are additive and can be toggled independently.
- OS-level flags should not alter baseline behavior when `false`.

Available Flags (app)

- `VITE_FF_WORKSPACE_SHELL` – show baseline Dock/Surface/BottomBar.
- `VITE_FF_APPROVALS_DRAWER` – render Approvals UI (currently as a widget card).
- `VITE_FF_DEV_AUTO_APPROVE` – show dev auto-approve indicator (no writes in app).
- `VITE_FF_BROKER` – show broker enabled note.
- `VITE_FF_GATES_BADGES` – render Gate badges widget.
- `VITE_FF_AGENT_PANEL` – render Agents panel widget.
- `VITE_FF_TOOL_HUB` – render Tool Hub widget.
- `VITE_FF_RAG` – render RAG panel widget.

OS Flags (behind stable default-off)

- `VITE_FF_OS_DESKTOP` – enable desktop surface.
- `VITE_FF_OS_WINDOWS` – render windowed apps (Publish/Agents/Tools/Settings/Processes/Logs/Approvals).
- `VITE_FF_OS_LAUNCHER` – show Start launcher (bottom-left).
- `VITE_FF_OS_TRAY` – show system tray (bottom-right) + clock.

Example `.env.local`

```
# Baseline workspace only
VITE_FF_WORKSPACE_SHELL=1

# OS mode (desktop + windows + start menu + tray)
# VITE_FF_OS_DESKTOP=1
# VITE_FF_OS_WINDOWS=1
# VITE_FF_OS_LAUNCHER=1
# VITE_FF_OS_TRAY=1

# Panels
# VITE_FF_GATES_BADGES=1
# VITE_FF_AGENT_PANEL=1
# VITE_FF_TOOL_HUB=1
# VITE_FF_RAG=1
# VITE_FF_APPROVALS_DRAWER=1
```

Notes

- With all flags OFF (default), behavior is unchanged and no new UI appears.
- Flag values are read at build time by Vite via `import.meta.env`.
- See `packages/app/.env.example` for canonical examples.

