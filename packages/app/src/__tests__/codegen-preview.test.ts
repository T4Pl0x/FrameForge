import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('ff:codegen preview', () => {
  it('prints planned files', () => {
    const repo = path.resolve(__dirname, '../../../..');
    const spec = path.join(repo, 'builder-output.json');
    // minimal spec
    const specJson = { version:'v1', appId:'demoapp', extensions:[{ name:'@frameforge/ext-demoapp', entry:'packages/ext-demoapp/src/entry.tsx', widgets:[] }] };
    const fs = require('node:fs');
    fs.writeFileSync(spec, JSON.stringify(specJson));
    const res = spawnSync('node', [path.join(repo, 'packages/shared/codegen/ff-codegen.mjs'), '--target', 'web', '--spec', spec, '--out', 'packages/ext-demoapp-web', '--mode', 'preview'], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Would create:');
  });
});

