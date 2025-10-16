FrameForge OS (Monorepo)

This repository contains the FrameForge OS workspace shell, kernel, extension host stubs, and scripts. It follows the UI-as-truth and proposal-only principles: spec mutations must be submitted as RFC6902 proposals to the kernel and applied via approvals.

- UI-as-Truth: Only `@frameforge/ext-ui` may change geometry/layout in `spec/ui.json`.
- Proposal-only: All spec mutations go through the kernel via RFC6902 diffs and approvals.
- Gates parity: UI gates reflect normalized artifacts from Sandbox/Publish.
- Policy & Audit: Kernel enforces rules and writes audit entries to `spec/meta.json`.

See `packages/kernel/README.md` for kernel usage and `scripts/` for utilities.

## Gates summary (dev)

Set where the UI reads gate results (tests/a11y/lint-build):

```bash
# packages/app/.env.local
VITE_GATES_SUMMARY_PATH=/.echo/gate-summary.json
```

Create/update the file during demos:

```bash
mkdir -p .echo
echo '{"tests":"ok","a11y":"warn","lintBuild":"fail","ts":"2025-10-16T12:00:00Z"}' > .echo/gate-summary.json
```

The UI polls this file every 10s and shows badges: passing / warning / failing.

Stabilize & Baseline (Phase 0)

- Goal: Keep the current app stable while OS features land behind flags.
- Branch/PR: `stabilize/os-transition`
- Docs:
  - `docs/OS-TRANSITION.md` – charter and acceptance
  - `docs/FLAGS.md` – flag conventions and `.env.local` usage
- Acceptance: with all flags OFF, the app remains unchanged; tests/validate pass.
