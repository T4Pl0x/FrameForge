import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';
import { getIndexStatus } from '../tools/ragAdapters.js';
import registry from '../../tools/registry.json';
import { call as toolCall } from '../tools/broker.js';

export default function AgentPanel({ open, onClose }) {
  const kernel = useKernel();
  const policies = useMemo(() => kernel.store.get('logic')?.policies || { requireApproval: true }, [kernel]);
  const [indexHealth, setIndexHealth] = useState('unknown');
  const [tools, setTools] = useState([]);
  const [localPolicies, setLocalPolicies] = useState({
    askWhenUncertain: Boolean(policies.askWhenUncertain),
    maxRisk: policies.maxRisk || 'low',
    cot: policies.cot || 'off',
    cove: policies.cove || 'off',
    rateLimit: policies.rateLimit || { rpm: 60, burst: 10 },
    selfHeal: policies.selfHeal || { retries: 0, backoffMs: 0, fallback: 'none' },
    memory: policies.memory || { window: '15m', persist: false },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getIndexStatus();
      if (mounted) setIndexHealth(s.status);
    })();
    // Tools registry (mock heartbeats)
    (async () => {
      const entries = registry.tools || [];
      const statuses = await Promise.all(entries.map(async (t) => {
        try {
          const res = await toolCall(t.name, t.permissions[0] || 'status', {});
          const status = res.status || 'online';
          return { id: t.name, status };
        } catch {
          return { id: t.name, status: 'offline' };
        }
      }));
      if (mounted) setTools(statuses);
    })();
    return () => { mounted = false; };
  }, []);

  const proposeToggle = (key, value) => {
    const patch = [{ op: 'replace', path: `/logic/policies/${key}`, value }];
    try {
      kernel.proposals.preflight(
        kernel.proposals.propose({ target: 'logic.json', patch, rationale: `Toggle policy ${key} -> ${String(value)}` })
      );
      // Do not auto-approve/apply in MVP
    } catch {}
  };

  const proposeBatch = (ops, title) => {
    if (!ops.length) return;
    try {
      const id = kernel.proposals.propose({ target: 'logic.json', patch: ops, rationale: title || 'Update policies' });
      kernel.proposals.preflight(id);
    } catch {}
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}>
      <div style={{ position: 'absolute', right: 12, bottom: 52, width: 420, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Agent Panel</strong>
          <button className="panel-icon-button" onClick={onClose} aria-label="Close">A-</button>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Policies (proposals only — approval required)</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!policies.requireApproval} disabled />
              <span>Require approval for changes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!localPolicies.askWhenUncertain} onChange={(e) => { setLocalPolicies(p => ({ ...p, askWhenUncertain: e.target.checked })); proposeToggle('askWhenUncertain', e.target.checked); }} />
              <span>Ask when uncertain</span>
            </label>
            <div>
              <span style={{ marginRight: 8 }}>Max risk:</span>
              {['low','medium','high'].map(r => (
                <label key={r} style={{ marginRight: 8 }}>
                  <input type="radio" name="maxRisk" checked={localPolicies.maxRisk===r} onChange={() => { setLocalPolicies(p => ({ ...p, maxRisk: r })); proposeToggle('maxRisk', r); }} /> {r}
                </label>
              ))}
            </div>
            <div>
              <span style={{ marginRight: 8 }}>CoT:</span>
              {['off','brief','verbose'].map(v => (
                <label key={v} style={{ marginRight: 8 }}>
                  <input type="radio" name="cot" checked={localPolicies.cot===v} onChange={() => { setLocalPolicies(p => ({ ...p, cot: v })); proposeToggle('cot', v); }} /> {v}
                </label>
              ))}
            </div>
            <div>
              <span style={{ marginRight: 8 }}>CoVe:</span>
              {['off','strict','very_strict'].map(v => (
                <label key={v} style={{ marginRight: 8 }}>
                  <input type="radio" name="cove" checked={localPolicies.cove===v} onChange={() => { setLocalPolicies(p => ({ ...p, cove: v })); proposeToggle('cove', v); }} /> {v}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Rate limit:</span>
              <input type="number" min="1" value={localPolicies.rateLimit.rpm} onChange={(e) => setLocalPolicies(p => ({ ...p, rateLimit: { ...p.rateLimit, rpm: Number(e.target.value) } }))} style={{ width: 64 }} /> rpm
              <input type="number" min="1" value={localPolicies.rateLimit.burst} onChange={(e) => setLocalPolicies(p => ({ ...p, rateLimit: { ...p.rateLimit, burst: Number(e.target.value) } }))} style={{ width: 64 }} /> burst
              <button type="button" onClick={() => proposeBatch([
                { op: (policies.rateLimit ? 'replace':'add'), path: '/logic/policies/rateLimit', value: localPolicies.rateLimit }
              ], 'Update rate limit')}>Apply</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Self-heal:</span>
              <input type="number" min="0" value={localPolicies.selfHeal.retries} onChange={(e) => setLocalPolicies(p => ({ ...p, selfHeal: { ...p.selfHeal, retries: Number(e.target.value) } }))} style={{ width: 56 }} /> retries
              <input type="number" min="0" value={localPolicies.selfHeal.backoffMs} onChange={(e) => setLocalPolicies(p => ({ ...p, selfHeal: { ...p.selfHeal, backoffMs: Number(e.target.value) } }))} style={{ width: 80 }} /> ms
              <select value={localPolicies.selfHeal.fallback} onChange={(e) => setLocalPolicies(p => ({ ...p, selfHeal: { ...p.selfHeal, fallback: e.target.value } }))}>
                <option value="none">none</option>
                <option value="use_mock">use_mock</option>
              </select>
              <button type="button" onClick={() => proposeBatch([
                { op: (policies.selfHeal ? 'replace':'add'), path: '/logic/policies/selfHeal', value: localPolicies.selfHeal }
              ], 'Update self-heal')}>Apply</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Memory:</span>
              <input value={localPolicies.memory.window} onChange={(e) => setLocalPolicies(p => ({ ...p, memory: { ...p.memory, window: e.target.value } }))} style={{ width: 80 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={!!localPolicies.memory.persist} onChange={(e) => setLocalPolicies(p => ({ ...p, memory: { ...p.memory, persist: e.target.checked } }))} /> persist
              </label>
              <button type="button" onClick={() => proposeBatch([
                { op: (policies.memory ? 'replace':'add'), path: '/logic/policies/memory', value: localPolicies.memory }
              ], 'Update memory')}>Apply</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Index health: <strong style={{ color: indexHealth === 'green' ? '#059669' : indexHealth === 'red' ? '#dc2626' : '#6b7280' }}>{indexHealth}</strong></div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Tools</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {tools.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: (t.status==='online'||t.status==='green') ? '#059669' : t.status==='offline' ? '#dc2626' : '#f59e0b', display: 'inline-block' }} />
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12 }}>{t.id}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>({t.status})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
