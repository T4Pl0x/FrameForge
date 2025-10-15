import assert from 'node:assert/strict';
import { createKernel } from '../src/index.js';

const kernel = createKernel({ store: { initialSpec: { logic: {} } } });
const id = kernel.proposals.propose({ target: 'logic.json', patch: [{ op: 'add', path: '/logic/agents', value: [] }], rationale: 'init' });
const pf = kernel.proposals.preflight(id);
assert.equal(pf.ok, true);
kernel.proposals.approve(id, { by: 'test' });
const snap = kernel.proposals.apply(id);
assert.ok(Array.isArray(snap.spec.logic.agents));
console.log('kernel proposal pipeline ok');
