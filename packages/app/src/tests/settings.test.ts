import { describe, it, expect, beforeEach } from 'vitest';
import { loadAiSettings, saveAiSettings, loadPolicySettings, savePolicySettings } from '../settings/useSettings';

describe('Settings roundtrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads AI settings', () => {
    const ai = { provider: 'openrouter' as const, apiKey: 'sk-test', baseUrl: 'https://openrouter.ai/api/v1', model: 'gpt-4o-mini' };
    saveAiSettings(ai);
    const got = loadAiSettings();
    expect(got).toMatchObject(ai);
  });

  it('saves and loads policy settings', () => {
    const pol = { rules: 'be safe', workflow: 'review -> approve', extraParamsJson: '{"temperature":0.2}' };
    savePolicySettings(pol);
    const got = loadPolicySettings();
    expect(got).toMatchObject(pol);
  });
});

