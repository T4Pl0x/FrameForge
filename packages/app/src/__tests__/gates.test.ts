import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readGateSummary } from '../gates/readers';

describe('gates readers', () => {
  const g:any = globalThis as any;
  let origFetch: any;
  beforeEach(() => { origFetch = g.fetch; });
  afterEach(() => { g.fetch = origFetch; });

  it('maps ok/warn/fail to passing/warning/failing', async () => {
    g.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tests:'ok', a11y:'warn', lintBuild:'fail' }) });
    const s = await readGateSummary('/dummy');
    expect(s.gates?.tests?.state).toBe('passing');
    expect(s.gates?.a11y?.state).toBe('warning');
    expect(s.gates?.lintBuild?.state).toBe('failing');
  });
});

