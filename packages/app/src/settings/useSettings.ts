export type AiProvider = 'codex' | 'claude' | 'deepseek' | 'openrouter';

export type AiSettings = {
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export type PolicySettings = {
  rules?: string;
  workflow?: string;
  extraParamsJson?: string;
};

const AI_KEY = 'ff.settings.ai';
const POL_KEY = 'ff.settings.policies';

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(AI_KEY);
    const json = raw ? JSON.parse(raw) : {};
    return {
      provider: (json.provider as AiProvider) || 'openrouter',
      apiKey: json.apiKey || '',
      baseUrl: json.baseUrl || '',
      model: json.model || '',
    };
  } catch {
    return { provider: 'openrouter', apiKey: '', baseUrl: '', model: '' };
  }
}

export function saveAiSettings(s: AiSettings){
  localStorage.setItem(AI_KEY, JSON.stringify(s));
}

export function loadPolicySettings(): PolicySettings{
  try {
    const raw = localStorage.getItem(POL_KEY);
    const json = raw ? JSON.parse(raw) : {};
    return {
      rules: json.rules || '',
      workflow: json.workflow || '',
      extraParamsJson: json.extraParamsJson || '',
    };
  } catch {
    return { rules: '', workflow: '', extraParamsJson: '' };
  }
}

export function savePolicySettings(s: PolicySettings){
  localStorage.setItem(POL_KEY, JSON.stringify(s));
}

