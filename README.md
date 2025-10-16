FrameForge OS (Monorepo)

This repository contains the FrameForge OS workspace shell, kernel, extension host stubs, and scripts. It follows the UI-as-truth and proposal-only principles: spec mutations must be submitted as RFC6902 proposals to the kernel and applied via approvals.

- UI-as-Truth: Only `@frameforge/ext-ui` may change geometry/layout in `spec/ui.json`.
- Proposal-only: All spec mutations go through the kernel via RFC6902 diffs and approvals.
- Gates parity: UI gates reflect normalized artifacts from Sandbox/Publish.
- Policy & Audit: Kernel enforces rules and writes audit entries to `spec/meta.json`.

See `packages/kernel/README.md` for kernel usage and `scripts/` for utilities.

