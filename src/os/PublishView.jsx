import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';
import PrStatusPill from '../components/PrStatusPill.jsx';
import { startGatesTap, subscribeGates, getGatesInfo } from '../state/gates.js';
import { broker } from '../tools/broker.js';
import { evaluateGates } from '../tools/gates/evaluateGates.js';
import { usePublishReadiness } from '../hooks/usePublishReadiness.js';
import PublishCheckerPopover from './PublishCheckerPopover.jsx';

export default function PublishView() {
  const kernel = useKernel();
  const publish = useMemo(() => kernel?.extensions?.publish || null, [kernel]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [gi, setGi] = useState(() => getGatesInfo());
  const [refreshNote, setRefreshNote] = useState('');
  const [cfgTick, setCfgTick] = useState(0);
  const { ready, blocking, warnings, reasons, details, brokerHealth, env, retryHealth, refreshArtifacts, healthMeta, artifacts } = usePublishReadiness();
  const [showChecker, setShowChecker] = useState(false);

  useEffect(() => {
    startGatesTap();
    const off = subscribeGates(setGi);
    const onCfg = () => setCfgTick((x) => x + 1);
    window.addEventListener('ff:automation:updated', onCfg);
    return () => { off?.(); window.removeEventListener('ff:automation:updated', onCfg); };
  }, []);

  const onOpenPR = async () => {
    if (!publish?.openPR) return;
    setBusy(true); setError('');
    try {
      const r = await publish.openPR();
      setResult(r);
    } catch (e) {
      setError(e?.message || String(e));
    } finally { setBusy(false); }
  };

  const reportsHref = gi?.info?.reportsUrl || gi?.info?.dashboardUrl || gi?.info?.prUrl;

  const missingHuman = useMemo(() => {
    const map = {
      BROKER_BASE_URL: 'Broker base URL',
      BROKER_TOKEN: 'Broker token',
      PUBLISH_WORKFLOW: 'Publish workflow',
      SANDBOX_WORKFLOW: 'Sandbox workflow',
      GITHUB_REPO: 'GitHub repository',
      GITHUB_REF: 'GitHub ref',
      'tools.registry: repository_dispatch': 'Tool registry: repository_dispatch',
      'repository_dispatch.permissions.callableBy must include @frameforge/ext-publish': 'Tool registry permissions',
    };
    return blocking.map(m => map[m] || m);
  }, [blocking]);

  useEffect(() => {
    if (missing.length > 0) {
      try {
        const api = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
        api?.events?.publish?.('telemetry', { type: 'publish_config_hint_shown', missing });
      } catch {}
    }
  }, [missing.join('|')]);

  const deepLinks = useMemo(() => {
    const arts = gi?.info?.artifacts || {};
    const names = Object.keys(arts || {});
    const find = (cands) => {
      for (const c of cands) {
        const exact = names.find(n => n === c);
        if (exact) return arts[exact];
      }
      for (const c of cands) {
        const like = names.find(n => n.toLowerCase().includes(c.toLowerCase()));
        if (like) return arts[like];
      }
      return undefined;
    };
    const s = gi?.info?.summary || {};
    return {
      tests: {
        href: find(['tests-report.json','tests.json','tests','junit','jest']),
        summary: s.tests || { passed: 0, failed: 0, skipped: 0, total: 0 }
      },
      a11y: {
        href: find(['a11y-report.json','a11y.json','a11y','axe']),
        summary: s.a11y || { violations: 0, unwaived: 0 }
      },
      lintBuild: {
        href: find(['lint-build.json','lint.json','build.json','lint','build']),
        summary: { lint: s.lint || { errors: 0, warnings: 0 }, build: s.build || { errors: 0, warnings: 0 } }
      }
    };
  }, [gi]);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', overflow: 'hidden' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Publish</strong>
        <button onClick={onOpenPR} disabled={!publish || busy || !ready} title={!ready ? `Fix required items in Settings → Task Automation` : undefined} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {busy ? 'Opening…' : 'Open PR'}
        </button>
        <button onClick={async () => {
          setRefreshNote('');
          try {
            const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('frameforge-refactor-automation') : '';
            const cfg = raw ? JSON.parse(raw) : {};
            const owner = cfg.repoOwner || '';
            const repo = cfg.repoName || '';
            const branch = cfg.branch || '';
            const token = cfg.token || '';
            if (!owner || !repo || !token) {
              setRefreshNote('Configure owner/repo/token in Task Automation to refresh.');
              return;
            }
            const run = await broker.sandbox.latestRun({ owner, repo, workflow: 'frameforge_sandbox.yml', branch, token });
            if (!run) { setRefreshNote('No recent workflow run found.'); return; }
            await evaluateGates({ owner, repo, runId: run.id, token, trace_id: 'tr_manual_refresh', dashboardUrl: run.html_url });
            setRefreshNote('Refreshed from CI.');
          } catch (e) {
            setRefreshNote(`Refresh failed: ${e?.message || e}`);
          }
        }} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          Refresh from CI
        </button>
        {!publish && <span style={{ color: '#dc2626', fontSize: 12 }}>extension not registered</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {reportsHref && (
            <a href={reportsHref} target="_blank" rel="noreferrer" style={{ fontSize: 12, textDecoration: 'underline', color: '#2563EB' }}>Open Reports</a>
          )}
          {ready && warnings.length > 0 && (
            <button type="button" onClick={() => setShowChecker(true)} title={reasons.filter(r=>r.kind==='warning').map(r=>r.message).join('\n')} style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 9999, padding: '2px 8px', cursor: 'pointer' }}>
              Warnings ({warnings.length})
            </button>
          )}
          <button type="button" onClick={() => setShowChecker(true)} style={{ fontSize: 12, textDecoration: 'underline', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer' }}>View checker details</button>
          <PrStatusPill />
        </div>
      </div>
      <div style={{ padding: 12, overflow: 'auto' }}>
        {(!ready && blocking.length > 0) && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 12, padding: 8, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Publish configuration incomplete</strong>
              <button type="button" onClick={() => {
                try {
                  const api = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
                  api?.events?.publish?.('telemetry', { type: 'publish_config_hint_clicked' });
                } catch {}
                try {
                  // Focus first missing field in settings where possible
                  const first = blocking[0] || '';
                  const fieldMap = {
                    GITHUB_REPO: 'repoOwner',
                    'Repository owner': 'repoOwner',
                    'Repository name': 'repoName',
                    'Workflow file': 'workflowId',
                    PUBLISH_WORKFLOW: 'workflowId',
                    'Target branch': 'branch',
                    GITHUB_REF: 'branch',
                    'GitHub token': 'token',
                  };
                  const focusField = fieldMap[first] || undefined;
                  window.dispatchEvent(new CustomEvent('ff:automation:open', { detail: { focusField } }));
                } catch {}
              }} style={{ fontSize: 12, textDecoration: 'underline', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer' }}>Open settings</button>
            </div>
            <div style={{ marginTop: 6 }}>Set up Task Automation to enable PR creation and status checks.</div>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {reasons.filter(r => r.kind==='blocking').map((r, i) => (<li key={i}>{r.message}</li>))}
            </ul>
            {blocking.some(m => String(m).startsWith('broker.health')) && (
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={() => retryHealth()} style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}>Retry</button>
                <span style={{ marginLeft: 8, color: '#6B7280' }}>(publish: {brokerHealth.publish}, sandbox: {brokerHealth.sandbox})</span>
              </div>
            )}
          </div>
        )}
        {(ready && warnings.length > 0) && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: 12, padding: 8, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Publish ready, but reports have warnings ({warnings.length})</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reasons.filter(r => r.kind==='warning').map((r, i) => (<li key={i}>{r.message}</li>))}
            </ul>
            {warnings.some(w => w.startsWith('missing ')) && (
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={() => refreshArtifacts()} style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}>Refresh</button>
              </div>
            )}
          </div>
        )}
        {refreshNote && (
          <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', color: '#1E40AF', fontSize: 12, padding: 6, borderRadius: 6, marginBottom: 12 }}>{refreshNote}</div>
        )}
        {gi?.info?.status === 'red' && gi?.info?.firstHint && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 12, padding: 8, borderRadius: 6, marginBottom: 12 }}>
            {gi.info.firstHint}
          </div>
        )}
        <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Reports</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 12 }}>Tests</strong>
                {deepLinks.tests.href ? (
                  <a href={deepLinks.tests.href} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Open</a>
                ) : (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>unavailable</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                passed {deepLinks.tests.summary.passed ?? 0} • failed {deepLinks.tests.summary.failed ?? 0} • skipped {deepLinks.tests.summary.skipped ?? 0} • total {deepLinks.tests.summary.total ?? 0}
              </div>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 12 }}>A11y</strong>
                {deepLinks.a11y.href ? (
                  <a href={deepLinks.a11y.href} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Open</a>
                ) : (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>unavailable</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                violations {deepLinks.a11y.summary.violations ?? 0}{(deepLinks.a11y.summary.unwaived !== undefined) ? ` • unwaived ${deepLinks.a11y.summary.unwaived}` : ''}
              </div>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 12 }}>Lint/Build</strong>
                {deepLinks.lintBuild.href ? (
                  <a href={deepLinks.lintBuild.href} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Open</a>
                ) : (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>unavailable</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                lint {deepLinks.lintBuild.summary.lint.errors ?? 0}e/{deepLinks.lintBuild.summary.lint.warnings ?? 0}w • build {deepLinks.lintBuild.summary.build.errors ?? 0}e/{deepLinks.lintBuild.summary.build.warnings ?? 0}w
              </div>
            </div>
          </div>
        </div>
        {!result && <div style={{ fontSize: 12, color: '#6b7280' }}>Open a PR with statuses from normalized artifacts (stubbed locally).</div>}
        {result && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 600 }}>Result</div>
            <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <PublishCheckerPopover
        open={showChecker}
        onClose={() => setShowChecker(false)}
        result={{ ready, blocking, warnings, reasons, details }}
        onRefresh={() => { retryHealth(); refreshArtifacts(); setShowChecker(false); }}
        onOpenSettings={() => { window.dispatchEvent(new CustomEvent('ff:automation:open')); setShowChecker(false); }}
        onOpenRegistry={() => { window.dispatchEvent(new CustomEvent('ff:tools:toggle')); setShowChecker(false); }}
        onOpenReports={() => { const href = gi?.info?.reportsUrl || gi?.info?.dashboardUrl || gi?.info?.prUrl; if (href) window.open(href, '_blank'); setShowChecker(false); }}
        onRetryHealth={() => { retryHealth(); }}
      />
    </div>
  );
}
