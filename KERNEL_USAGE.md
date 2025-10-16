Kernel Quickstart

1) Create a kernel and submit a proposal

Example (Node REPL or script):

import { Kernel } from './packages/kernel/src/index.mjs';

const k = new Kernel({});
const host = k.host;

// Example: change theme accent
const ticket = host.proposals.submit({
  title: 'Tweak accent color',
  rationale: 'Improve contrast',
  labels: ['theme'],
  scope: ['theme'],
  sourceExtension: '@frameforge/ext-ui',
  diffs: [
    { op: 'replace', path: '/colors/accent', value: '#34d399' }
  ]
});

// Approve and apply
const api = k.kernel;
api.proposals.approve(ticket.id, 'maintainer');
await api.proposals.apply(ticket.id);

2) Audit

On apply, an entry is appended to `spec/meta.json` under `audit` with ticketId, who, when, diffs, labels, sourceExtension.

Notes

- Geometry isolation blocks proposals from non-UI extensions that target `ui` geometry/layout.
- Set `FF_DEV_AUTO_APPROVE=true` to auto-approve+apply on submit (local only).

