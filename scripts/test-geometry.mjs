#!/usr/bin/env node
import { Kernel } from '../packages/kernel/src/index.mjs';

try {
  const k = new Kernel({});
  k.host.proposals.submit({
    title: 'Illicit layout change',
    rationale: 'should fail',
    labels: ['ui'],
    scope: ['ui'],
    sourceExtension: '@frameforge/ext-compiler',
    diffs: [ { op: 'replace', path: '/layout/activeExtension', value: 'foo' } ]
  });
  console.error('Expected rejection did not occur');
  process.exit(1);
} catch (e) {
  console.log('Rejection OK:', e.code || e.message);
}

