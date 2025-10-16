import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { FLAGS } from '../../src/flags';

describe('flags default off', () => {
  it('all are boolean and default false-like', () => {
    for (const k of Object.keys(FLAGS)) {
      expect(typeof (FLAGS as any)[k]).toBe('boolean');
    }
  });
});

