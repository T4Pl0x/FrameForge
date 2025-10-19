import { useEffect, useMemo, useState } from 'react';
import type { AiProvider } from './useSettings';
import { loadAiSettings, saveAiSettings, loadPolicySettings, savePolicySettings } from './useSettings';

function Row({ children }:{ children: any }){ return <label style={{ display:'grid', gap:4 }}>{children}</label>; }
function Title({ children }:{ children: any }){ return <div className="widget-title">{children}</div>; }

export default function SettingsPanel(){
  const [provider, setProvider] = useState<AiProvider>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [rules, setRules] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [extra, setExtra] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const ai = loadAiSettings();
    setProvider(ai.provider);
    setApiKey(ai.apiKey || '');
    setBaseUrl(ai.baseUrl || '');
    setModel(ai.model || '');
    const pol = loadPolicySettings();
    setRules(pol.rules || '');
    setWorkflow(pol.workflow || '');
    setExtra(pol.extraParamsJson || '');
  }, []);

  const showBase = useMemo(() => provider === 'openrouter', [provider]);

  function save(){
    saveAiSettings({ provider, apiKey, baseUrl, model });
    savePolicySettings({ rules, workflow, extraParamsJson: extra });
    setStatus('Settings saved');
    setTimeout(() => setStatus(''), 1500);
  }

  return (
    <div className="widget" style={{ maxWidth: 720 }}>
      <Title>AI Settings</Title>
      <div style={{ display:'grid', gap: 10 }}>
        <Row>
          <span>Provider</span>
          <select value={provider} onChange={(e)=>setProvider(e.target.value as AiProvider)}>
            <option value="codex">Codex</option>
            <option value="claude">Claude</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </Row>
        <Row>
          <span>API Key</span>
          <input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="sk-..." type="password" />
        </Row>
        {showBase && (
          <Row>
            <span>Base URL</span>
            <input value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} placeholder="https://openrouter.ai/api/v1" />
          </Row>
        )}
        <Row>
          <span>Model</span>
          <input value={model} onChange={(e)=>setModel(e.target.value)} placeholder="gpt-4o, claude-3.5, deepseek-coder, ..." />
        </Row>
      </div>

      <div className="widget" style={{ marginTop: 16 }}>
        <Title>Rules & Workflow Policies</Title>
        <Row>
          <span>Rules</span>
          <textarea value={rules} onChange={(e)=>setRules(e.target.value)} rows={4} placeholder="Describe operating rules and boundaries" />
        </Row>
        <Row>
          <span>Workflow</span>
          <textarea value={workflow} onChange={(e)=>setWorkflow(e.target.value)} rows={4} placeholder="Describe workflow, approval gates, and expectations" />
        </Row>
        <Row>
          <span>Extra Parameters (JSON)</span>
          <textarea value={extra} onChange={(e)=>setExtra(e.target.value)} rows={4} placeholder='{ "temperature": 0.4, "max_tokens": 2000 }' />
        </Row>
      </div>

      <div style={{ display:'flex', gap:8, marginTop: 12 }}>
        <button className="btn" onClick={save}>Save</button>
        {status && <span className="muted">{status}</span>}
      </div>
    </div>
  );
}

