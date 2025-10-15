import assert from 'node:assert/strict';
import { createKernel } from '../src/index.js';

const kernel = createKernel({ store: { initialSpec: { ui: { frames: [], screens: [] } } } });
// Non-UI extension attempts geometry change
const id = kernel.proposals.propose({
  target: 'ui.json',
  patch: [{ op: 'add', path: '/ui/frames/-', value: { id: 'f1', title: 'X' } }],
  rationale: 'bad geometry edit',
  metadata: { sourceExtension: '@frameforge/ext-compiler' }
});
const pf = kernel.proposals.preflight(id);
assert.equal(pf.ok, false, 'preflight should fail for geometry from non-UI extension');
assert.ok((pf.errors || []).some(e => String(e).includes('GEOMETRY_WRITE_FORBIDDEN')));
console.log('kernel geometry isolation ok');

