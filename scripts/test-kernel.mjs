#!/usr/bin/env node
import { Kernel } from '../packages/kernel/src/index.mjs';

async function main(){
  const k = new Kernel({});
  const ticket = k.host.proposals.submit({
    title: 'Test theme accent update',
    rationale: 'demo',
    labels: ['test'],
    scope: ['theme'],
    sourceExtension: '@frameforge/ext-ui',
    diffs: [ { op: 'replace', path: '/colors/accent', value: '#34d399' } ]
  });
  k.kernel.proposals.approve(ticket.id, 'tester');
  const res = await k.kernel.proposals.apply(ticket.id);
  console.log('Applied:', res);
}

main().catch(e => { console.error(e); process.exit(1); });

