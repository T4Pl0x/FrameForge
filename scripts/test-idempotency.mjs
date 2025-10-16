#!/usr/bin/env node
import { Kernel } from '../packages/kernel/src/index.mjs';

const k = new Kernel({});
const key = 'demo-key-123';
const a = k.host.proposals.submit({
  title: 'Idem test',
  rationale: 'A',
  labels: [],
  scope: ['data'],
  sourceExtension: '@frameforge/ext-ui',
  idempotencyKey: key,
  diffs: [ { op: 'add', path: '/__tmp', value: true } ]
});
const b = k.host.proposals.submit({
  title: 'Idem test again',
  rationale: 'B',
  labels: [],
  scope: ['data'],
  sourceExtension: '@frameforge/ext-ui',
  idempotencyKey: key,
  diffs: [ { op: 'add', path: '/__tmp2', value: true } ]
});
console.log('sameTicket', a.id === b.id);

