import React from 'react';
import GateBadge from '../../GateBadge';

const TaskAutomation = ({
  preflight,
  publishStatus,
  gates,
  gatesMeta,
  overrideState,
  isOwner,
  setOverrideState,
  appendAudit,
  publishInfo,
  refactorAutomation,
  handleAutomationToggle,
  showAutomationSettings,
  setShowAutomationSettings,
  isAutomationConfigured,
  automationStatus,
  handleAutomationStringChange,
  handleAutomationHotspotChange,
  handleAutomationCheckboxChange,
  handleAutomationResetToken,
}) => {
  return (
    <div className="task-automation">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span className="preflight-badge" style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: preflight?.overallPass ? '#DCFCE7' : '#FEE2E2', color: preflight?.overallPass ? '#065F46' : '#991B1B' }}>
          Preflight: {preflight?.overallPass ? 'Pass' : 'Needs fixes'}
        </span>
        {publishStatus && (
          <span className="publish-badge" style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1E40AF' }}>
            Publish: {publishStatus}
          </span>
        )}
      </div>
      <div className="publish-gates" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, max-content)', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12 }}>Gates:</span>
        <span style={{ fontSize: 12 }}>preflight: <strong>{gates.preflight}</strong></span>
        <GateBadge
          label="Tests"
          state={gates.tests}
          tooltip={gatesMeta.tests ? `✓ ${gatesMeta.tests.passed} · ✗ ${gatesMeta.tests.failed} · ~ ${gatesMeta.tests.skipped}` : undefined}
        />
        <GateBadge
          label="A11y"
          state={gates.a11y}
          tooltip={gatesMeta.a11y ? `violations: ${gatesMeta.a11y.violations}` : undefined}
        />
        <GateBadge
          label="Lint/Build"
          state={gates.lintBuild}
          tooltip={gatesMeta.lintBuild ? `build ${gatesMeta.lintBuild.buildErrors}e/${gatesMeta.lintBuild.buildWarnings}w · lint ${gatesMeta.lintBuild.lintErrors}e/${gatesMeta.lintBuild.lintWarnings}w` : undefined}
        />
      </div>
      {(!(gates.preflight === 'pass' && gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass' && gates.risk === 'low')) && (
        <div style={{ fontSize: 12, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', padding: 8, borderRadius: 6, marginBottom: 8 }}>
          PR blocked. Resolve failing gates or request an owner override with reason.
        </div>
      )}
      <div className="publish-override" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Override</strong>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={overrideState.enabled} disabled={!isOwner} onChange={(e) => {
              const enabled = e.target.checked;
              const ts = new Date().toISOString();
              setOverrideState((prev) => ({ ...prev, enabled, timestamp: ts }));
              if (enabled) {
                const failing = ['preflight', 'tests', 'a11y', 'lintBuild'].filter((k) => (gates?.[k] !== 'pass'));
                if ((gates?.risk || 'low') !== 'low') failing.push('risk');
                appendAudit('override.enabled', { failingGates: failing });
              }
            }} />
            <span style={{ fontSize: 12 }}>{isOwner ? 'Owner' : 'Owner required'}</span>
          </label>
        </div>
        {overrideState.enabled && (
          <>
            <div style={{ marginTop: 6 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 12 }}>Reason (min 15 chars)</span>
                <textarea value={overrideState.reason} onChange={(e) => setOverrideState((p) => ({ ...p, reason: e.target.value }))} rows={3} />
              </label>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 12 }}>Expires</span>
                <input type="date" value={overrideState.expires} onChange={(e) => setOverrideState((p) => ({ ...p, expires: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={overrideState.accepted} onChange={(e) => setOverrideState((p) => ({ ...p, accepted: e.target.checked }))} />
                <span style={{ fontSize: 12 }}>I accept responsibility for this override.</span>
              </label>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', padding: 8, borderRadius: 6 }}>
              This PR will be tagged override-required and blocked for non-owners.
            </div>
          </>
        )}
      </div>
      {publishInfo && (
        <div className="publish-card" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>{(publishInfo && publishInfo.pr && publishInfo.pr.title) ? publishInfo.pr.title : `publish: FrameForge UI @ ${publishInfo && publishInfo.versionId ? publishInfo.versionId : ''}`}</div>
            <div style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: publishStatus === 'Passed' ? '#DCFCE7' : (publishStatus === 'Failed' ? '#FEE2E2' : '#FEF9C3'), color: publishStatus === 'Passed' ? '#065F46' : (publishStatus === 'Failed' ? '#991B1B' : '#92400E') }}>{publishStatus || 'Queued'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {(publishInfo && publishInfo.pr && publishInfo.pr.url) ? (<a href={publishInfo.pr.url} target="_blank" rel="noreferrer" className="panel-secondary">View PR</a>) : null}
            {(publishInfo && publishInfo.run && publishInfo.run.url) ? (<a href={publishInfo.run.url} target="_blank" rel="noreferrer" className="panel-secondary">View Checks</a>) : null}
            {publishInfo?.artifacts?.['tests-report.json'] ? (<a href={publishInfo.artifacts['tests-report.json'].url} target="_blank" rel="noreferrer" className="panel-secondary">View Tests</a>) : null}
            {publishInfo?.artifacts?.['a11y-report.json'] ? (<a href={publishInfo.artifacts['a11y-report.json'].url} target="_blank" rel="noreferrer" className="panel-secondary">View A11y</a>) : null}
            {publishInfo?.artifacts?.['preflight.json'] ? (<a href={publishInfo.artifacts['preflight.json'].url} target="_blank" rel="noreferrer" className="panel-secondary">View Preflight</a>) : null}
            {publishInfo?.artifacts?.['lint.json'] ? (<a href={publishInfo.artifacts['lint.json'].url} target="_blank" rel="noreferrer" className="panel-secondary">View Lint</a>) : null}
            {publishInfo?.artifacts?.['sbom.json'] ? (<a href={publishInfo.artifacts['sbom.json'].url} target="_blank" rel="noreferrer" className="panel-secondary">View SBOM</a>) : null}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            <div>Preflight snapshot: {preflight ? `${preflight.counts?.blocking || 0} blocking, ${preflight.counts?.major || 0} major, ${Math.max(0, (preflight.counts?.total || 0) - (preflight.counts?.blocking || 0) - (preflight.counts?.major || 0))} minor` : 'n/a'}</div>
          </div>
        </div>
      )}
      <div className="task-automation__header">
        <label className="task-automation__toggle">
          <input
            type="checkbox"
            checked={refactorAutomation.enabled}
            onChange={(event) => handleAutomationToggle(event.target.checked)}
          />
          <span>Auto-run refactor agent when tasks finish</span>
        </label>
        <button
          type="button"
          className="panel-secondary"
          onClick={() => setShowAutomationSettings(prev => !prev)}
        >
          {showAutomationSettings ? 'Hide' : 'Configure'}
        </button>
      </div>
      <p className="task-automation__hint">
        {isAutomationConfigured
          ? 'Configured. I’ll dispatch the GitHub workflow each time a task is marked done.'
          : 'Provide your GitHub workflow details so I can kick off the refactor agent automatically.'}
      </p>
      {automationStatus && (
        <p className="task-automation__status">{automationStatus}</p>
      )}
      {showAutomationSettings && (
        <div className="task-automation__form">
          <label>
            <span>Repository owner</span>
            <input
              type="text"
              placeholder="acme-corp"
              value={refactorAutomation.repoOwner}
              onChange={handleAutomationStringChange('repoOwner')}
            />
          </label>
          <label>
            <span>Repository name</span>
            <input
              type="text"
              placeholder="frameforge"
              value={refactorAutomation.repoName}
              onChange={handleAutomationStringChange('repoName')}
            />
          </label>
          <label>
            <span>Workflow file</span>
            <input
              type="text"
              placeholder="copilot-refactor.yml"
              value={refactorAutomation.workflowId}
              onChange={handleAutomationStringChange('workflowId')}
            />
          </label>
          <label>
            <span>Target branch</span>
            <input
              type="text"
              placeholder="main"
              value={refactorAutomation.branch}
              onChange={handleAutomationStringChange('branch')}
            />
          </label>
          <label>
            <span>Hotspot threshold</span>
            <input
              type="number"
              min="50"
              step="10"
              value={refactorAutomation.hotspotThreshold}
              onChange={handleAutomationHotspotChange}
            />
          </label>
          <label className="task-automation__checkbox">
            <input
              type="checkbox"
              checked={refactorAutomation.dryRun}
              onChange={handleAutomationCheckboxChange('dryRun')}
            />
            <span>Run in dry-run mode (analysis only)</span>
          </label>
          <label className="task-automation__checkbox">
            <input
              type="checkbox"
              checked={refactorAutomation.apply}
              onChange={handleAutomationCheckboxChange('apply')}
            />
            <span>Emit JSON reports (requires `--apply`)</span>
          </label>
          <label>
            <span>GitHub token (workflow dispatch scope)</span>
            <input
              type="password"
              value={refactorAutomation.token}
              onChange={handleAutomationStringChange('token')}
              placeholder="ghp_..."
              autoComplete="off"
            />
          </label>
          <div className="task-automation__actions">
            <button type="button" className="panel-secondary" onClick={handleAutomationResetToken}>
              Clear token
            </button>
            <span>Token is stored locally in your browser. Use a PAT with <code>workflow</code> scope.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAutomation;
