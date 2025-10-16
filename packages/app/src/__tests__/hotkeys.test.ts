import { describe, it, expect, vi } from 'vitest';
import { installHotkeys } from '../hotkeys';

describe('hotkeys', () => {
  it('g p navigates to /publish', () => {
    const navigate = vi.fn();
    const dispose = installHotkeys({ navigate, openShortcuts: vi.fn() });
    const ev1 = new KeyboardEvent('keydown', { key: 'g' });
    window.dispatchEvent(ev1);
    const ev2 = new KeyboardEvent('keydown', { key: 'p' });
    window.dispatchEvent(ev2);
    expect(navigate).toHaveBeenCalledWith('/publish');
    dispose();
  });
  it('? opens shortcuts callback', () => {
    const open = vi.fn();
    const dispose = installHotkeys({ navigate: vi.fn(), openShortcuts: open });
    const ev = new KeyboardEvent('keydown', { key: '?' });
    window.dispatchEvent(ev);
    expect(open).toHaveBeenCalled();
    dispose();
  });
});
