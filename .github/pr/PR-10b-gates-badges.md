Title: feat(gates): wire GateBadges to VITE_GATES_SUMMARY_PATH

Body:

Adds packages/app/src/gates/readers.ts: fetch + normalize gate summary JSON.
Updates GateBadges to read + poll every 10s; shows passing/warning/failing and updated time.
Adds badge styles: .badge.state-{passing,warning,failing,unknown}.
Docs + Makefile targets for demos:

- gates-demo (mix)
- gates-green
- gates-red

Default path configurable via:

VITE_GATES_SUMMARY_PATH=/.echo/gate-summary.json

How to verify

make gates-demo → writes .echo/gate-summary.json.
pnpm dev → badges reflect pass/warn/fail + updated time.

Checks

- Path configurable via VITE_GATES_SUMMARY_PATH
- Unknown/missing file shows unknown state (no crash)
- Styles applied for all states

Query Codex
@codex Confirm path & keys map to CI artifacts or advise the exact mapping to adopt.

