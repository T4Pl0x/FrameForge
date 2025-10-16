Title: feat(os): Desktop, Windowing, Launcher, Tray (flag-gated)

Body:

Adds OS primitives under packages/os/:

- Desktop.tsx (desktop canvas)
- windowing.ts (open/focus/minimize/snap)
- Launcher.tsx
- Tray.tsx
- notifications.ts

App bootstrap switches to kernel.bootExtensions with ctxFactory; shows toast “Loaded N extension(s)” when dev extensions mount.

Flags (default OFF):
- VITE_FF_OS_DESKTOP
- VITE_FF_OS_WINDOWS
- VITE_FF_OS_LAUNCHER
- VITE_FF_OS_TRAY
- VITE_FF_OS_NOTIFS

No behavior changes when flags are OFF.

How to verify

In packages/app/.env.local set:

VITE_FF_OS_DESKTOP=1
VITE_FF_OS_WINDOWS=1
VITE_FF_OS_LAUNCHER=1
VITE_FF_OS_TRAY=1
VITE_FF_OS_NOTIFS=1

pnpm dev → Desktop + Launcher render; opening tiles spawns independent windows.

If you have dev extensions (from codegen), toast shows “Loaded N extension(s)”.

Checks

- Flags default OFF; app unchanged with flags OFF
- Basic window ops: open/focus/minimize/snap work
- Boot uses kernel.bootExtensions and doesn’t throw when zero extensions

Query Codex
@codex Please confirm OS primitives and the flag model match the plan and that OFF-state preserves current behavior.

