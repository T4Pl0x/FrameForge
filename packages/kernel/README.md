# @frameforge/kernel

Minimal kernel for FrameForge OS providing:
- Spec store with snapshot/diff/apply
- Proposal pipeline (submit → preflight → approve → apply)
- Event bus for auditability
- Host API for extensions (read-only + propose)

Usage
```js
import { createKernel } from '@frameforge/kernel';
const kernel = createKernel({ store: { initialSpec: { ui: {}, logic: {}, data: {}, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } });
const id = kernel.proposals.propose({ target: 'logic.json', patch: [{ op: 'add', path: '/agents', value: [] }], rationale: 'init agents' });
kernel.proposals.preflight(id);
kernel.proposals.approve(id, { by: 'dev' });
kernel.proposals.apply(id);
```

