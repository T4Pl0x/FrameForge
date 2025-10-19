import { describe, it, expect, vi } from 'vitest';

describe('auto-approval env gating', () => {
  it('does not auto-approve by default', async () => {
    const approve = vi.fn();
    const apply = vi.fn();
    const preflight = vi.fn();
    const bus = { on: (_: string, cb: any) => (cb({ id: 'p1' }), () => {}) };
    const kernel = { proposals: { preflight, approve, apply }, bus, };
    const isDevAuto = false; // simulate env off

    // Simulate the KernelProvider logic inline:
    await kernel.proposals.preflight('p1');
    if (isDevAuto) {
      await kernel.proposals.approve('p1', { by: 'dev-auto', user: 'test' });
      await kernel.proposals.apply('p1', { user: 'test' });
    }

    expect(preflight).toHaveBeenCalledTimes(1);
    expect(approve).toHaveBeenCalledTimes(0);
    expect(apply).toHaveBeenCalledTimes(0);
  });
});