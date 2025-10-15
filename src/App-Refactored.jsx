import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { bmadMethodology } from './bmadMethodology.js';
import { MenuCatalog } from './componentRegistry/index.js';
import { aiIntegration, AVAILABLE_MODELS } from './aiIntegration.js';

// Custom hooks
import { useAppState } from './hooks/useAppState.js';
import { useDocumentOperations } from './hooks/useDocumentOperations.js';
import { useDragAndResize } from './hooks/useDragAndResize.js';
// Removed panel resize hook and handles for a simpler, compact layout

// Components
import Toolbar from './components/Toolbar.jsx';
import Canvas from './components/Canvas.jsx';
const WorkflowEditor = React.lazy(() => import('./components/WorkflowEditor.jsx'));
import ModelPicker from './components/ModelPicker.jsx';
import ScreenTabs from './components/ScreenTabs.jsx';
import GateBadge from './components/GateBadge.jsx';
import { buildMermaidDefinition } from './utils/mermaid.js';
import { broker } from './tools/broker.js';

// GitHub Actions artifact helpers and gates computation
const ARTIFACTS = {
  tests: 'tests-report.json',
  a11y: 'a11y-report.json',
  lintBuild: 'lint-build.json',
};

async function ghGET(path, token) {
  throw new Error('legacy GH access disabled; use broker');
}

async function listArtifacts(owner, repo, runId, token) {
  return { artifacts: [] };
}

async function downloadArtifactJson() { return null; }

function computeGatesFromReports(reports) {
  const testsRep = reports[ARTIFACTS.tests] ?? null;
  const a11yRep = reports[ARTIFACTS.a11y] ?? null;
  const lbRep = reports[ARTIFACTS.lintBuild] ?? null;
  const gates = {
    tests: 'unknown',
    a11y: 'unknown',
    lintBuild: 'unknown',
    risk: 'low',
  };

  // tests: support various shapes
  if (testsRep) {
    const failed = (testsRep.summary && (testsRep.summary.failed ?? testsRep.summary.numFailedTests))
      ?? testsRep.numFailedTests
      ?? testsRep.failed
      ?? 0;
    gates.tests = Number(failed) === 0 ? 'pass' : 'fail';
  }

  // a11y: support array or number of violations; allow unwaivedViolations
  if (a11yRep) {
    const vio = Array.isArray(a11yRep.violations) ? a11yRep.violations.length : (a11yRep.violations ?? 0);
    const unwaived = a11yRep.unwaivedViolations ?? vio;
    gates.a11y = Number(unwaived) === 0 ? 'pass' : 'fail';
  }

  // lint + build summary
  if (lbRep) {
    const be = lbRep.buildErrors ?? 0;
    const le = lbRep.lintErrors ?? 0;
    const bw = lbRep.buildWarnings ?? 0;
    const lw = lbRep.lintWarnings ?? 0;
    gates.lintBuild = (Number(be) === 0 && Number(le) === 0) ? 'pass' : 'fail';
    const warnCount = Number(bw) + Number(lw);
    if (warnCount > 100) gates.risk = 'high';
    else if (warnCount > 20) gates.risk = 'medium';
  }

  return gates;
}

async function foldArtifactsIntoGatesBroker({ owner, repo, runId, token }) {
  const kapi = (typeof window !== 'undefined' && window.__ff_kernel_api) || null;
  const tr = 'tr_gate_' + Math.random().toString(36).slice(2, 8);
  try { kapi?.events?.publish('gate.started', { trace_id: tr, status: 'unknown', target: { file: 'reports' } }); } catch {}
  try {
    const tests = await broker.artifacts.getJson({ owner, repo, runId, name: ARTIFACTS.tests, token });
    const a11y = await broker.artifacts.getJson({ owner, repo, runId, name: ARTIFACTS.a11y, token });
    const lb = await broker.artifacts.getJson({ owner, repo, runId, name: ARTIFACTS.lintBuild, token });
    const reports = { [ARTIFACTS.tests]: tests, [ARTIFACTS.a11y]: a11y, [ARTIFACTS.lintBuild]: lb };
    const gates = computeGatesFromReports(reports);
    const allPass = (gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass');
    if (allPass) {
      const details = {
        tests: { passed: tests?.summary?.passed ?? 0, failed: tests?.summary?.failed ?? 0 },
        a11y: { violations: Array.isArray(a11y?.violations) ? a11y.violations.length : a11y?.violations ?? 0 },
        lint: { errors: lb?.lintErrors ?? 0, warnings: lb?.lintWarnings ?? 0 },
        build: { errors: lb?.buildErrors ?? 0, warnings: lb?.buildWarnings ?? 0 },
      };
      try { kapi?.events?.publish('gate.passed', { trace_id: tr, status: 'green', details }); } catch {}
    } else {
      // pick a first hint
      let reportType = 'unknown';
      let firstHint = '';
      if (gates.tests !== 'pass' && tests) { reportType = 'tests'; firstHint = `failed: ${tests?.summary?.failed ?? 1}`; }
      else if (gates.a11y !== 'pass' && a11y) { reportType = 'a11y'; firstHint = `violations: ${Array.isArray(a11y?.violations) ? a11y.violations.length : a11y?.violations ?? 1}`; }
      else if (gates.lintBuild !== 'pass' && lb) { reportType = 'lintBuild'; firstHint = `lint ${lb?.lintErrors ?? 0}e/${lb?.lintWarnings ?? 0}w · build ${lb?.buildErrors ?? 0}e/${lb?.buildWarnings ?? 0}w`; }
      try { kapi?.events?.publish('gate.failed', { trace_id: tr, status: 'red', details: { firstHint, reportType } }); } catch {}
    }
    return gates;
  } catch {
    return { tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' };
  }
}

async function foldArtifactsIntoGates({ owner, repo, runId, token }) {
  try {
    const arts = await listArtifacts(owner, repo, runId, token);
    const reports = {};
    const artifactList = Array.isArray(arts?.artifacts) ? arts.artifacts : [];
    for (const key of Object.keys(ARTIFACTS)) {
      const wanted = ARTIFACTS[key];
      const a = artifactList.find(
        (art) => art.name === wanted || art.name.includes((wanted || '').replace('.json', ''))
      );
      if (!a) continue;
      const json = await downloadArtifactJson(owner, repo, a.id, token);
      if (json) reports[wanted] = json;
    }
    // Prefer pre-normalized lint-build.json; fallback to raw lint/build artifacts
    if (!reports['lint-build.json']) {
      const rawLint = artifactList.find((a) => a.name === 'lint.json');
      const rawBuild = artifactList.find((a) => a.name === 'build.json');
      let lintRaw = null, buildRaw = null;
      if (rawLint) lintRaw = await downloadArtifactJson(owner, repo, rawLint.id, token);
      if (rawBuild) buildRaw = await downloadArtifactJson(owner, repo, rawBuild.id, token);
      if (lintRaw || buildRaw) {
        // Reconstruct minimal normalized summary
        let lintErrors = 0, lintWarnings = 0;
        if (Array.isArray(lintRaw)) {
          for (const f of lintRaw) {
            lintErrors += Number(f?.errorCount || 0);
            lintWarnings += Number(f?.warningCount || 0);
          }
        } else if (lintRaw && (typeof lintRaw.errors === 'number' || typeof lintRaw.warnings === 'number')) {
          lintErrors += Number(lintRaw.errors || 0);
          lintWarnings += Number(lintRaw.warnings || 0);
        }
        let buildErrors = 0, buildWarnings = 0;
        if (buildRaw) {
          if (Array.isArray(buildRaw.errors)) buildErrors += buildRaw.errors.length;
          if (Array.isArray(buildRaw.warnings)) buildWarnings += buildRaw.warnings.length;
          if (typeof buildRaw.errorsCount === 'number') buildErrors += Number(buildRaw.errorsCount);
          if (typeof buildRaw.warningsCount === 'number') buildWarnings += Number(buildRaw.warningsCount);
        }
        reports['lint-build.json'] = { lintErrors, lintWarnings, buildErrors, buildWarnings };
      }
    }
    return computeGatesFromReports(reports);
  } catch {
    return { tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' };
  }
}

/**
 * Main App Component - Refactored for better structure and maintainability
 * 
 * Key improvements:
 * - Separated concerns into custom hooks
 * - Extracted components for better reusability
 * - Added PropTypes for type safety
 * - Reduced component size and complexity
 * - Better error handling and code organization
 */
export default function App() {
    const canvasRef = useRef(null);
    const chatHistoryRef = useRef(null);
    const chatInputRef = useRef(null);
    const tasksHeaderRef = useRef(null);

    const [chatInput, setChatInput] = useState('');
    const [taskInput, setTaskInput] = useState('');
    const [isChatGenerating, setIsChatGenerating] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [availableModels, setAvailableModels] = useState(AVAILABLE_MODELS);
    const [modelsUpdatedAt, setModelsUpdatedAt] = useState(null);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [modelsError, setModelsError] = useState(null);
    const modelsAbortRef = useRef(null);
  const [showAutomationSettings, setShowAutomationSettings] = useState(false);
  const [automationStatus, setAutomationStatus] = useState('');

    const state = useAppState();
    const {
      doc,
      setDoc,
      activeScreenId,
      setActiveScreenId,
      selectedFrameId,
      setSelectedFrameId,
      selectedNodeId,
      setSelectedNodeId,
      menu,
      setMenu,
  designAnalysis,
      setDesignAnalysis,
      zoom,
      showGrid,
      snapToGrid,
      componentMenus,
      setComponentMenus,
      componentComments,
      setComponentComments,
  centerViewMode,
  setCenterViewMode,
      chatPanelMode,
      setChatPanelMode,
      chatMessages,
      setChatMessages,
  mermaidDefinition,
  setMermaidDefinition,
      chatLLMConfig,
      setChatLLMConfig,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
      chatPolicies,
      setChatPolicies,
      agentWorkflowRules,
      setAgentWorkflowRules,
      tasks,
      setTasks,
      frameTitleOptions,
      setFrameTitleOptions,
      refactorAutomation,
      setRefactorAutomation,
    } = state;

  const recommendedModel = availableModels[0] || null;
  const selectedModelRef = useRef(selectedModel);

/*        const handleApplyEdits = () => {
      const changed = doc.frames.filter((f) => f.changeFlags);
      if (!changed.length) {
        setChatMessages((prev) => [
          ...prev,
          createMessage('assistant', 'No pending edits to apply.'),
        ]);
        return;
      }
      const makeId = () => 	ask--;
      const tasksToAdd = [];
      changed.forEach((f) => {
        const flags = f.changeFlags || {};
        const label = f.title || f.id.slice(0, 6);
        if (flags.moved) tasksToAdd.push({ id: makeId(), title: Frame : moved, status: 'pending', category: 'Apply' });
        if (flags.resized) tasksToAdd.push({ id: makeId(), title: Frame : resized, status: 'pending', category: 'Apply' });
        if (flags.added) tasksToAdd.push({ id: makeId(), title: Frame : component added, status: 'pending', category: 'Apply' });
        if (flags.removed) tasksToAdd.push({ id: makeId(), title: Frame : component removed, status: 'pending', category: 'Apply' });
        if (flags.edited) tasksToAdd.push({ id: makeId(), title: Frame : component edited, status: 'pending', category: 'Apply' });
      });
      if (tasksToAdd.length) {
        setTasks((prev) => [...prev, ...tasksToAdd]);
        setChatMessages((prev) => [
          ...prev,
          createMessage('assistant', I created  task(s) from recent edits. Review and approve when ready.),
        ]);
      }
    };*/
/*        const label = f.title || f.id.slice(0,6);
        if (flags.moved) newTasks.push({ id: 	ask--, title: Frame : moved, status: 'pending', category: 'Apply' });
        if (flags.resized) newTasks.push({ id: 	ask--, title: Frame : resized, status: 'pending', category: 'Apply' });
        if (flags.added) newTasks.push({ id: 	ask--, title: Frame : component added, status: 'pending', category: 'Apply' });
        if (flags.removed) newTasks.push({ id: 	ask--, title: Frame : component removed, status: 'pending', category: 'Apply' });
        if (flags.edited) newTasks.push({ id: 	ask--, title: Frame : component edited, status: 'pending', category: 'Apply' });
      });
      if (newTasks.length) {
        setTasks(prev => [...prev, ...newTasks]);
        setChatMessages(prev => [...prev, createMessage('assistant', I created  task(s) from recent edits. Review and approve when ready.)]);
      }
    };*/

  const handleApplyEdits = () => {
    const changed = doc.frames.filter((f) => f.changeFlags);
    if (!changed.length) {
      setChatMessages((prev) => [
        ...prev,
        createMessage('assistant', 'No pending edits to apply.'),
      ]);
      return;
    }

    const makeId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const tasksToAdd = [];

    changed.forEach((f) => {
      const flags = f.changeFlags || {};
      const label = f.title || f.id.slice(0, 6);
      if (flags.moved)   tasksToAdd.push({ id: makeId(), frameId: f.id, title: `${label}: moved`,             status: 'pending', category: 'Apply' });
      if (flags.resized) tasksToAdd.push({ id: makeId(), frameId: f.id, title: `${label}: resized`,           status: 'pending', category: 'Apply' });
      if (flags.added)   tasksToAdd.push({ id: makeId(), frameId: f.id, title: `${label}: component added`,   status: 'pending', category: 'Apply' });
      if (flags.removed) tasksToAdd.push({ id: makeId(), frameId: f.id, title: `${label}: component removed`, status: 'pending', category: 'Apply' });
      if (flags.edited)  tasksToAdd.push({ id: makeId(), frameId: f.id, title: `${label}: component edited`,  status: 'pending', category: 'Apply' });
    });

    if (tasksToAdd.length) {
      setTasks((prev) => [...prev, ...tasksToAdd]);
      setChatMessages((prev) => [
        ...prev,
        createMessage('assistant', `I created ${tasksToAdd.length} task(s) from recent edits. Review and approve when ready.`),
      ]);
    }
  };

  // Auto-clear Δ flags when all "Apply" tasks for a frame are done
  useEffect(() => {
    const framesNeedingClear = new Set();
    doc.frames.forEach((f) => {
      if (!f.changeFlags) return;
      const applyTasks = tasks.filter((t) => t.category === 'Apply' && t.frameId === f.id);
      if (applyTasks.length === 0) return;
      const allDone = applyTasks.every((t) => t.status === 'done');
      if (allDone) framesNeedingClear.add(f.id);
    });

    if (framesNeedingClear.size > 0) {
      setDoc((prev) => ({
        ...prev,
        frames: prev.frames.map((f) => (framesNeedingClear.has(f.id) ? { ...f, changeFlags: undefined } : f)),
      }));
      const clearedCount = framesNeedingClear.size;
      setChatMessages((prev) => ([
        ...prev,
        createMessage('assistant', `Cleared Δ on ${clearedCount} frame(s) after approvals.`),
      ]));
    }
  }, [tasks]);

  // Build preview + preflight
  const [isBuildPreviewOpen, setBuildPreviewOpen] = useState(false);
  const [preflight, setPreflight] = useState(null);
  const [preflightReport, setPreflightReport] = useState(null);
  const [preflightWaivers, setPreflightWaivers] = useState({});
  const [publishStatus, setPublishStatus] = useState('');
  const [publishInfo, setPublishInfo] = useState(null);
  const publishVersionRef = useRef(null);
  const publishPollRef = useRef(null);
  const [gates, setGates] = useState({ preflight: 'fail', tests: 'unknown', a11y: 'unknown', lintBuild: 'unknown', risk: 'low' });
  const [gatesMeta, setGatesMeta] = useState({ tests: null, a11y: null, lintBuild: null });
  const [overrideState, setOverrideState] = useState({ enabled: false, reason: '', expires: '', accepted: false, byUserId: '', timestamp: '' });
  const [specMeta, setSpecMeta] = useState(() => {
    try { const raw = localStorage.getItem('frameforge-spec-meta'); return raw ? JSON.parse(raw) : { audit: [] }; } catch { return { audit: [] }; }
  });
  const isOwner = (() => {
    try { return (localStorage.getItem('frameforge-user-role') || 'user') === 'owner'; } catch { return false; }
  })();

  useEffect(() => {
    // Only set preflight here; other gates come from artifacts
    const preflightPass = Boolean(preflight?.overallPass);
    setGates((prev) => ({
      ...prev,
      preflight: preflightPass ? 'pass' : 'fail',
    }));
  }, [preflight]);

  useEffect(() => {
    try { localStorage.setItem('frameforge-spec-meta', JSON.stringify(specMeta)); } catch { /* ignore */ }
  }, [specMeta]);

  const appendAudit = (action, context = {}) => {
    const entry = {
      time: new Date().toISOString(),
      userId: overrideState.byUserId || 'unknown',
      action,
      payloadHash: Math.random().toString(36).slice(2, 10),
      context,
    };
    setSpecMeta((prev) => ({ audit: [...(prev.audit || []), entry] }));
  };

  const _startPublishPolling = useCallback(() => {
    if (publishPollRef.current) {
      clearInterval(publishPollRef.current);
      publishPollRef.current = null;
    }
    const { repoOwner, repoName, workflowId, branch, token } = refactorAutomation || {};
    if (!repoOwner || !repoName || !workflowId || !branch || !token) return;
    const versionId = publishVersionRef.current;
    if (!versionId) return;
    setPublishStatus('Queued');
    let intervalMs = 5000;
    const interval = setInterval(async () => {
      try {
        // Check PR existence via broker
        try {
          const pr = await broker.vcs.findPRForHead({ owner: repoOwner, repo: repoName, head: `${repoOwner}:publish/${versionId}`, token });
          if (pr) {
            setPublishStatus('PR opened');
            setPublishInfo(prev => ({
              ...(prev || {}),
              versionId,
              pr: { id: pr.number, url: pr.html_url, title: pr.title },
            }));
          }
        } catch { /* ignore */ }
        // Check workflow run status (latest on branch) via broker
        const run = await broker.sandbox.latestRun({ owner: repoOwner, repo: repoName, workflow: workflowId, branch, event: 'workflow_dispatch', token });
        if (run) {
          const st = run.status; // queued, in_progress, completed
          if (st === 'queued') setPublishStatus('Queued');
          else if (st === 'in_progress') setPublishStatus('In progress');
          else if (st === 'completed') {
            if (run.conclusion === 'success') setPublishStatus('Passed');
            else setPublishStatus('Failed');
            // Fold artifacts into gates once completed
            try {
              const owner = repoOwner; const repo = repoName;
              const computed = await foldArtifactsIntoGatesBroker({ owner, repo, runId: run.id, token });
              setGates((prev) => ({ ...prev, ...computed }));
              // Meta for tooltips
              try {
                const [t, a, l] = await Promise.all([
                  broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.tests, token }).catch(() => null),
                  broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.a11y, token }).catch(() => null),
                  broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.lintBuild, token }).catch(() => null),
                ]);
                setGatesMeta({
                  tests: t?.summary || null,
                  a11y: a ? { violations: a.violations ?? (Array.isArray(a.violations) ? a.violations.length : 0) } : null,
                  lintBuild: l ? { lintErrors: l.lintErrors ?? 0, lintWarnings: l.lintWarnings ?? 0, buildErrors: l.buildErrors ?? 0, buildWarnings: l.buildWarnings ?? 0 } : null,
                });
              } catch { /* ignore meta */ }
            } catch {/* ignore */}
            clearInterval(interval);
            publishPollRef.current = null;
          }
          setPublishInfo(prev => ({
            ...(prev || {}),
            versionId,
            run: { id: run.id, url: run.html_url, status: st, conclusion: run.conclusion },
          }));
          // Artifacts via broker (for UI links)
          try {
            const arts = await broker.artifacts.list({ owner: repoOwner, repo: repoName, runId: run.id, token });
            const map = {};
            (arts || []).forEach(a => { map[a.name] = { id: a.id, name: a.name, url: a.url }; });
            setPublishInfo(prev => ({ ...(prev || {}), artifacts: map }));
          } catch { /* ignore */ }
          // Backoff after 60s
          intervalMs = Math.min(intervalMs * 1.5, 30000);
        }
      } catch {
        // keep polling
      }
    }, 5000);
    publishPollRef.current = interval;
  }, [refactorAutomation]);

  const handleRunSandbox = useCallback(async () => {
    const { repoOwner, repoName, branch, token, enabled } = refactorAutomation || {};
    if (!enabled || !repoOwner || !repoName || !branch || !token) {
      setChatMessages(prev => ([...prev, createMessage('assistant', 'Configure repository owner/repo/branch/token in Task Automation to run sandbox checks.')]));
      return;
    }
    publishVersionRef.current = generateVersionId();
    setPublishStatus('Queued');
    const dispatchTs = Date.now();
    const endpoint = `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/dispatches`;
    const payload = {
      event_type: 'frameforge_sandbox',
      client_payload: {
        versionId: publishVersionRef.current,
        options: { runTests: true, runA11y: true, runLint: true, runBuild: true },
        labels: ['frameforge-sandbox'],
        meta: {
          initiator: (typeof localStorage !== 'undefined' && localStorage.getItem('frameforge-user-handle')) || '@user',
          ticketId: ''
        }
      }
    };
    try {
      await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      // Poll for the latest sandbox workflow run
      const wfFile = 'frameforge_sandbox.yml';
      let delay = 2000;
      const maxWait = 10 * 60 * 1000;
      const start = Date.now();
      const poll = async () => {
        try {
          const run = await broker.sandbox.latestRun({ owner: repoOwner, repo: repoName, workflow: wfFile, since: dispatchTs, token });
          if (run) {
            // Expose run link early
            setPublishInfo(prev => ({ ...(prev || {}), run: { id: run.id, url: run.html_url, status: run.status, conclusion: run.conclusion } }));
            if (run.status === 'queued') setPublishStatus('Queued');
            else if (run.status === 'in_progress') setPublishStatus('In progress');
            else if (run.status === 'completed') {
              setPublishStatus(run.conclusion === 'success' ? 'Passed' : 'Failed');
              // Pull artifacts for links and then compute gates from contents
              try {
                const arts = await broker.artifacts.list({ owner: repoOwner, repo: repoName, runId: run.id, token });
                const map = {};
                (arts || []).forEach(a => { map[a.name] = { id: a.id, name: a.name, url: a.url }; });
                setPublishInfo(prev => ({ ...(prev || {}), artifacts: map }));
              } catch {}
              // Fold artifacts into gates based on JSON contents
              try {
                const owner = repoOwner; const repo = repoName;
                const computed = await foldArtifactsIntoGatesBroker({ owner, repo, runId: run.id, token });
                setGates(prev => ({ ...prev, ...computed }));
                // Meta for tooltips
                try {
                  const [t, a, l] = await Promise.all([
                    broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.tests, token }).catch(() => null),
                    broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.a11y, token }).catch(() => null),
                    broker.artifacts.getJson({ owner, repo, runId: run.id, name: ARTIFACTS.lintBuild, token }).catch(() => null),
                  ]);
                  setGatesMeta({
                    tests: t?.summary || null,
                    a11y: a ? { violations: a.violations ?? (Array.isArray(a.violations) ? a.violations.length : 0) } : null,
                    lintBuild: l ? { lintErrors: l.lintErrors ?? 0, lintWarnings: l.lintWarnings ?? 0, buildErrors: l.buildErrors ?? 0, buildWarnings: l.buildWarnings ?? 0 } : null,
                  });
                } catch { /* ignore meta */ }
              } catch { /* ignore */ }
              return; // stop polling
            }
          }
        } catch { /* ignore and keep polling */ }
        if (Date.now() - start > maxWait) {
          setPublishStatus('Failed');
          setChatMessages(prev => ([...prev, createMessage('assistant', 'Sandbox timed out after 10 minutes.')]));
          return;
        }
        setTimeout(poll, delay);
        delay = Math.min(10000, Math.round(delay * 1.5));
      };
      setChatMessages(prev => ([...prev, createMessage('assistant', 'Sandbox checks dispatched. I’ll update status here.')]))
      ;(poll)();
    } catch (e) {
      setPublishStatus('Failed');
      setChatMessages(prev => ([...prev, createMessage('assistant', `Sandbox dispatch failed: ${e?.message || e}`)]));
    }
  }, [refactorAutomation, setChatMessages, setPublishInfo, setGates]);

  const generateVersionId = () => `v${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;

  const handleApproveAndCreatePR = useCallback(async () => {
    const allPass = (gates.preflight === 'pass' && gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass' && gates.risk === 'low');
    const hasFailing = (gates.preflight === 'fail' || gates.tests === 'fail' || gates.a11y === 'fail' || gates.lintBuild === 'fail' || gates.risk !== 'low');
    const overrideOk = (overrideState.enabled && isOwner && hasFailing && (overrideState.reason.trim().length >= 15) && overrideState.accepted);
    if (!(allPass || overrideOk)) {
      setChatMessages(prev => ([...prev, createMessage('assistant', 'PR blocked: Resolve failing gates or request an owner override with reason (15+ chars).')]));
      return;
    }
    const { repoOwner, repoName, token, enabled } = refactorAutomation || {};
    if (!enabled || !repoOwner || !repoName || !token) {
      setChatMessages(prev => ([...prev, createMessage('assistant', 'GitHub settings incomplete. Configure owner/repo/token in Task Automation.')]));
      return;
    }
    const versionId = publishVersionRef.current || generateVersionId();
    const artifactId = `artifact-${Date.now().toString(36)}`;
    const reports = publishInfo?.artifacts || {};
    const actor = (typeof localStorage !== 'undefined' && localStorage.getItem('frameforge-user-handle')) || 'owner';
    const isOverrideOnly = (!allPass && overrideOk);
    const payload = isOverrideOnly
      ? {
          event_type: 'frameforge_override_publish',
          client_payload: {
            versionId,
            reason: overrideState.reason || '',
            actor,
            reports: {
              tests: reports['tests-report.json']?.url || '',
              a11y: reports['a11y-report.json']?.url || '',
              preflight: (publishInfo?.run?.url) || '',
              lint: reports['lint.json']?.url || '',
            },
          },
        }
      : {
          event_type: 'frameforge_publish',
          client_payload: {
            versionId,
            artifactId,
            reports: {
              testsUrl: reports['tests-report.json']?.url || '',
              a11yUrl: reports['a11y-report.json']?.url || '',
              lintUrl: reports['lint.json']?.url || '',
              buildUrl: (publishInfo?.run?.url) || '',
              sbomUrl: reports['sbom.json']?.url || '',
              secretScanUrl: '',
            },
            gates,
            risk: gates.risk || 'low',
            waivers: Object.entries(preflightWaivers || {}).map(([k, reason]) => ({ id: k, reason, expires: '' })),
            override: { enabled: Boolean(overrideState.enabled), reason: overrideState.reason || '', expires: overrideState.expires || '', byUser: overrideState.byUserId || '' },
            labels: ['frameforge-publish'].concat(overrideOk ? ['override-required'] : []).concat(gates.risk ? ['risk-' + gates.risk] : []),
          },
        };
    try {
      const endpoint = `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/dispatches`;
      const resp = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `GitHub responded with ${resp.status}`);
      }
      setChatMessages(prev => ([...prev, createMessage('assistant', `Repository dispatch sent (${isOverrideOnly ? 'frameforge_override_publish' : 'frameforge_publish'}). GitHub will open the PR.`)]));
      setBuildPreviewOpen(false);
    } catch (e) {
      setChatMessages(prev => ([...prev, createMessage('assistant', `Repository dispatch failed: ${e.message}`)]));
    }
  }, [preflight, publishStatus, refactorAutomation, publishInfo, preflightWaivers, setChatMessages]);

  const handleDownloadZip = useCallback(async () => {
    try {
      const [{ default: JSZip }, specMod] = await Promise.all([
        import('jszip'),
        import('../docs/FrameForge_System_Specification_Codex_Edition.md?raw').catch(() => ({ default: '# FrameForge Specification (not found at build time)\n' })),
      ]);
      const zip = new JSZip();
      // Spec bundle
      zip.folder('spec')?.file('FrameForge_System_Specification_Codex_Edition.md', (specMod?.default || '').toString());
      // Proposals placeholder
      zip.folder('proposals')?.file('README.txt', 'Pending spec diffs (RFC 6902) would appear here.');
      // Reports (persist full preflight report schema if available)
      const preflightJson = preflightReport || { preflight: { versionId: generateVersionId(), summary: preflight?.counts || {}, entries: [] } };
      zip.folder('reports')?.file('preflight.json', JSON.stringify(preflightJson, null, 2));
      // README.publish
      const readme = `How to run sandbox locally\n\n- npm install\n- npm run build\n\nChecksums: N/A\n`;
      zip.file('README.publish.txt', readme);
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `frameforge-publish-${Date.now().toString(36)}.zip`;
      a.click();
      setChatMessages(prev => ([...prev, createMessage('assistant', 'Downloaded ZIP with spec and preflight report.')]));
    } catch (error) {
      console.error('ZIP generation failed:', error);
      setChatMessages(prev => ([...prev, createMessage('assistant', `ZIP failed: ${error.message}`)]));
    }
  }, [preflight, preflightReport, setChatMessages]);

  // Base (synchronous) checks
  const runPreflightBase = useCallback(() => {
    const issues = [];
    const addIssue = (issue) => issues.push({ ...issue, key: issue.key || ((issue.code || '') + ':' + (issue.frameId || '') + ':' + (issue.nodeId || '')) });

    // A) Apply tasks and Δ flags
    const outstandingApply = tasks.filter((t) => t.category === 'Apply' && t.status !== 'done');
    if (outstandingApply.length > 0) {
      outstandingApply.forEach((t) => addIssue({ code: 'apply.pending', severity: 'block', message: `Apply task pending: ${t.title}`, frameId: t.frameId }));
    }
    const framesWithDelta = doc.frames.filter((f) => f.changeFlags);
    framesWithDelta.forEach((f) => addIssue({ code: 'delta.present', severity: 'block', message: `Frame has Δ changes: ${f.title || f.id.slice(0,6)}`, frameId: f.id }));

    // B) Link validation
    const screenIds = new Set((doc.screens || []).map((s) => s.id));
    const framesById = new Map(doc.frames.map(f => [f.id, f]));
    doc.frames.forEach((f) => {
      (f.nodes || []).forEach((n) => {
        const nav = n?.props?.navigateTo;
        if (nav?.type === 'screen') {
          if (!nav.targetId || !screenIds.has(nav.targetId)) {
            addIssue({ code: 'link.missingScreen', severity: 'block', message: 'Navigation points to missing screen', frameId: f.id, nodeId: n.id });
          }
        }
        if (nav?.type === 'modal') {
          const target = nav.targetId ? framesById.get(nav.targetId) : null;
          if (!target || target.kind !== 'modal') {
            addIssue({ code: 'link.missingModal', severity: 'block', message: 'Navigation points to missing modal', frameId: f.id, nodeId: n.id });
          }
        }
        const openPopup = n?.props?.openPopup;
        if (openPopup) {
          const target = openPopup.targetId ? framesById.get(openPopup.targetId) : null;
          if (!target) {
            addIssue({ code: 'link.missingPopup', severity: 'block', message: 'openPopup target does not exist', frameId: f.id, nodeId: n.id });
          }
        }
      });
    });

    // C) Modal-to-parent (ensure at least one trigger in same screen)
    const modalIds = doc.frames.filter(fr => fr.kind === 'modal').map(fr => fr.id);
    modalIds.forEach((mid) => {
      const modal = framesById.get(mid);
      const parentScreen = modal?.screenId;
      let hasTrigger = false;
      doc.frames.forEach((f) => {
        if (f.screenId !== parentScreen) return;
        (f.nodes || []).forEach((n) => {
          const nav = n?.props?.navigateTo;
          const pop = n?.props?.openPopup;
          if ((nav?.type === 'modal' && nav?.targetId === mid) || (pop?.targetId === mid)) {
            hasTrigger = true;
          }
        });
      });
      if (!hasTrigger) addIssue({ code: 'modal.noTrigger', severity: 'major', message: 'Modal has no trigger on its screen', frameId: mid });
    });

    // D) Orphan interactive (Buttons without action)
    doc.frames.forEach((f) => {
      (f.nodes || []).forEach((n) => {
        if (n.type === 'Button') {
          const nav = n?.props?.navigateTo;
          const pop = n?.props?.openPopup;
          if (!nav && !pop) addIssue({ code: 'interactive.orphanButton', severity: 'major', message: 'Button has no action (link or popup)', frameId: f.id, nodeId: n.id });
        }
      });
    });

    // E) Unreachable screens (from default screen via screen links)
    const defaultScreen = (doc.screens || []).find((s) => s.isDefault) || (doc.screens || [])[0];
    if (defaultScreen) {
      const edges = [];
      doc.frames.forEach((f) => {
        (f.nodes || []).forEach((n) => {
          const nav = n?.props?.navigateTo;
          if (nav?.type === 'screen' && nav?.targetId) {
            edges.push([f.screenId, nav.targetId]);
          }
        });
      });
      const adj = new Map();
      (doc.screens || []).forEach((s) => adj.set(s.id, new Set()));
      edges.forEach(([a, b]) => { if (adj.has(a)) adj.get(a).add(b); });
      const seen = new Set();
      const stack = [defaultScreen.id];
      while (stack.length) {
        const s = stack.pop();
        if (seen.has(s)) continue;
        seen.add(s);
        (adj.get(s) || []).forEach((t) => { if (!seen.has(t)) stack.push(t); });
      }
      (doc.screens || []).forEach((s) => {
        if (s.id !== defaultScreen.id && !seen.has(s.id)) {
          addIssue({ code: 'reachability.unreachableScreen', severity: 'block', message: `Screen is unreachable: ${s.name}`, screenId: s.id });
        }
      });
    }

    // Filter waived issues for gating but still show them
    const unwaived = issues.filter((i) => !preflightWaivers[i.key]);
    const blocking = unwaived.filter((i) => i.severity === 'block');
    const majors = unwaived.filter((i) => i.severity === 'major');
    const overallPass = blocking.length === 0 && majors.length === 0;
    const report = {
      issues,
      counts: {
        total: issues.length,
        unwaived: unwaived.length,
        blocking: blocking.length,
        major: majors.length,
      },
      overallPass,
    };
    return { report, issues };
  }, [tasks, doc, preflightWaivers]);

  // Full preflight via Web Worker + base checks
  const runPreflightAsync = useCallback(async () => {
    const base = runPreflightBase();
    const baseIssues = Array.isArray(base.issues) ? base.issues : [];
    let mergedIssues = baseIssues.slice();
    try {
      const worker = new Worker(new URL('./workers/preflightWorker.js', import.meta.url), { type: 'module' });
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { worker.terminate(); reject(new Error('Preflight worker timed out')); }, 5000);
        worker.onmessage = (evt) => { clearTimeout(timer); worker.terminate(); if (evt.data?.ok) resolve(evt.data.result); else reject(new Error(evt.data?.error || 'Worker failed')); };
        worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); reject(new Error(e.message || 'Worker error')); };
        worker.postMessage({ type: 'run', doc, theme: { text: '#111111', textHigh: '#0B0B0B', surface: '#ffffff' }, profiles: ['mobilePortrait', 'desktop'] });
      });
      const workerIssues = Array.isArray(result?.issues) ? result.issues : [];
      mergedIssues = mergedIssues.concat(workerIssues.map((i) => ({ ...i, key: i.key || ((i.code || '') + ':' + (i.frameId || '') + ':' + (i.nodeId || '')) })));
    } catch (e) {
      console.warn('Preflight worker unavailable:', e?.message || e);
    }

    const unwaived = mergedIssues.filter((i) => !preflightWaivers[i.key]);
    const blocking = unwaived.filter((i) => i.severity === 'block');
    const majors = unwaived.filter((i) => i.severity === 'major');
    const overallPass = blocking.length === 0 && majors.length === 0;
    const finalReport = {
      issues: mergedIssues,
      counts: {
        total: mergedIssues.length,
        unwaived: unwaived.length,
        blocking: blocking.length,
        major: majors.length,
      },
      overallPass,
    };
    setPreflight(finalReport);
    const versionId = generateVersionId();
    const json = {
      versionId,
      summary: {
        blocking: blocking.length,
        major: majors.length,
        minor: finalReport.counts.total - (blocking.length + majors.length),
        waived: finalReport.counts.total - unwaived.length,
      },
      entries: mergedIssues.map((i) => ({
        level: i.severity === 'block' ? 'blocking' : i.severity,
        type: i.code,
        targetId: i.nodeId,
        frameId: i.frameId,
        screenId: i.screenId,
        message: i.message,
        ratio: i.ratio,
        required: i.required,
        colors: i.colors,
        ring: i.ring,
        surroundingBand: i.surroundingBand,
        size: i.size,
        requiredSize: i.required,
        context: i.context,
        waiverHint: i.waiverHint,
        suggestedFix: i.suggestedFix,
        opsPreview: i.opsPreview,
        waived: Boolean(preflightWaivers[i.key]),
      })),
    };
    setPreflightReport(json);
    return finalReport;
  }, [doc, preflightWaivers, runPreflightBase]);

    const previousCompletedTasksRef = useRef(new Set(tasks.filter(task => task.status === 'done').map(task => task.id)));

    // Panels use fixed CSS widths; center flex-fills (no drag resize)

    const {
      addFrame,
      addScreen,
      addComponent,
      updateNode,
      updateFrame,
      removeFrame,
      removeComponent,
      exportDoc,
      importDoc,
      startGesture,
      enqueueFrameUpdate,
      enqueueNodeUpdate,
      flushBatch,
      cancelBatch,
    } = useDocumentOperations(doc, setDoc, setMenu, activeScreenId);

    // Wire batched gesture events to proposals (one proposal per gesture)
    useEffect(() => {
      const debounceMs = 250;
      let t = null;
      const onStart = () => {
        try { if (typeof cancelBatch === 'function') cancelBatch(); } catch {}
        try { if (typeof startGesture === 'function') startGesture(); } catch {}
      };
      const onQueue = (ev) => {
        const d = ev?.detail || {};
        try {
          if (d.type === 'frame' && typeof enqueueFrameUpdate === 'function') enqueueFrameUpdate(d.frameId, d.updates);
          else if (d.type === 'node' && typeof enqueueNodeUpdate === 'function') enqueueNodeUpdate(d.frameId, d.nodeId, d.updates);
          if (t) clearTimeout(t);
          t = setTimeout(() => { try { if (typeof flushBatch === 'function') flushBatch(); } catch {} }, debounceMs);
        } catch {}
      };
      const onFlush = () => {
        if (t) { clearTimeout(t); t = null; }
        try { if (typeof flushBatch === 'function') flushBatch(); } catch {}
      };
      window.addEventListener('ff:gesture:start', onStart);
      window.addEventListener('ff:gesture:queue', onQueue);
      window.addEventListener('ff:gesture:flush', onFlush);
      return () => {
        window.removeEventListener('ff:gesture:start', onStart);
        window.removeEventListener('ff:gesture:queue', onQueue);
        window.removeEventListener('ff:gesture:flush', onFlush);
        if (t) clearTimeout(t);
      };
    }, [startGesture, enqueueFrameUpdate, enqueueNodeUpdate, flushBatch, cancelBatch]);

    const {
      handleFrameMouseDown,
      handleResizeMouseDown,
      handleComponentDrag,
    } = useDragAndResize(
      updateFrame,
      updateNode,
      snapToGrid,
      setSelectedFrameId,
      setSelectedNodeId,
      canvasRef
    );

    const selectedFrame = doc.frames.find(frame => frame.id === selectedFrameId);
    const screens = Array.isArray(doc.screens) && doc.screens.length ? doc.screens : [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }];
    const framesForActiveScreen = doc.frames.filter(f => (f.screenId || 'screen-main') === (activeScreenId || screens[0]?.id));

    const handleAddFrame = () => {
      const newFrameId = addFrame();
      setSelectedFrameId(newFrameId);
    };

    // Create a new screen tab and return its id
    const handleCreateScreen = (name) => {
      const id = `screen-${Date.now().toString(36)}`;
      const order = (doc.screens?.length ?? screens.length) > 0
        ? Math.max(...(doc.screens || screens).map(s => s.order ?? 0)) + 1
        : 0;
      const scrName = name && name.trim() ? name.trim() : `Screen ${(doc.screens?.length ?? screens.length) + 1}`;
      addScreen({ id, name: scrName, order, isDefault: false });
      return id;
    };

    // Create a modal frame on the given screen and return its id
    const handleCreateModalFrame = (screenId, title) => {
      const id = addFrame({
        x: 120,
        y: 100,
        width: 360,
        height: 220,
        radius: 12,
        padding: 12,
        gap: 8,
        shadow: '',
        cornerStyle: 'rounded',
        title: title || 'Modal',
        screenId: screenId || activeScreenId || screens[0]?.id || 'screen-main',
        kind: 'modal',
      });
      return id;
    };

    const handleAddFrameTitleOption = (title) => {
      const normalized = title?.trim();
      if (!normalized) return;

      setFrameTitleOptions(prev => {
        if (prev.some(option => option.toLowerCase() === normalized.toLowerCase())) {
          return prev;
        }
        return [...prev, normalized];
      });
    };

    const handleSelectFrameTitle = (frameId, title) => {
      const normalized = title?.trim();
      if (!normalized) return;

      setFrameTitleOptions(prev => {
        if (prev.some(option => option.toLowerCase() === normalized.toLowerCase())) {
          return prev;
        }
        return [...prev, normalized];
      });

      setDoc(prev => ({
        ...prev,
        frames: prev.frames.map(frame => (
          frame.id === frameId
            ? { ...frame, title: normalized }
            : frame
        )),
      }));
    };

    const _handleRefreshMermaidDefinition = useCallback(() => {
      setMermaidDefinition(buildMermaidDefinition(doc.frames, tasks));
    }, [doc.frames, setMermaidDefinition, tasks]);

    const _handleMermaidDefinitionChange = (value) => {
      setMermaidDefinition(value);
    };

    const handleCenterViewChange = (mode) => {
      setCenterViewMode(mode);
    };

    const handleDeleteFrame = (frameId) => {
      removeFrame(frameId);
      setComponentMenus(prev => {
        if (!Object.keys(prev).some(key => key.startsWith(`${frameId}-`))) {
          return prev;
        }
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => !key.startsWith(`${frameId}-`))
        );
      });
      setComponentComments(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`${frameId}-`)) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      if (selectedFrameId === frameId) {
        setSelectedFrameId(null);
        setSelectedNodeId(null);
      }
      setMenu(null);
    };

    const handleDeleteComponent = (frameId, nodeId) => {
      removeComponent(frameId, nodeId);
      const componentKey = `${frameId}-${nodeId}`;
      setComponentMenus(prev => {
        if (!(componentKey in prev)) return prev;
        const { [componentKey]: _removed, ...rest } = prev;
        return rest;
      });
      setComponentComments(prev => {
        if (!(componentKey in prev)) return prev;
        const { [componentKey]: _removed, ...rest } = prev;
        return rest;
      });
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    };

    const handleToggleChatSettings = () => {
      setChatPanelMode(prev => {
        const nextMode = prev === 'chat' ? 'settings' : 'chat';
        if (nextMode === 'settings') {
          setModelsUpdatedAt(null);
        }
        return nextMode;
      });
    };

    const handleChatLLMConfigChange = (field, value) => {
      setChatLLMConfig(prev => {
        if (field === 'temperature') {
          const parsed = parseFloat(value);
          const bounded = Number.isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), 2);
          return { ...prev, temperature: bounded };
        }
        if (field === 'maxTokens') {
          const parsed = parseInt(value, 10);
          const positive = Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
          return { ...prev, maxTokens: positive };
        }
        if (field === 'model') {
          setSelectedModel(value);
        }
        return { ...prev, [field]: value };
      });
    };

    const handleChatPoliciesChange = (value) => {
      setChatPolicies(value);
    };

    const handleAgentWorkflowRulesChange = (value) => {
      setAgentWorkflowRules(value);
    };

    const handleApiKeyInputChange = (value) => {
      setApiKey(value);
      setModelsUpdatedAt(null);
    };

    useEffect(() => {
      selectedModelRef.current = selectedModel;
    }, [selectedModel]);

  const fetchModels = useCallback(async (forceRefresh = false) => {
      if (modelsAbortRef.current) {
        modelsAbortRef.current.abort();
      }

      const controller = new AbortController();
      modelsAbortRef.current = controller;
      setIsFetchingModels(true);

      try {
        const models = await aiIntegration.fetchAvailableModels({ signal: controller.signal, forceRefresh });
        setAvailableModels(models);
        setModelsError(null);
        setModelsUpdatedAt(new Date());

        const activeModel = selectedModelRef.current;
        if (models.length && !models.some(model => model.id === activeModel)) {
          const fallbackId = models[0].id;
          setSelectedModel(fallbackId);
          setChatLLMConfig(prev => ({ ...prev, model: fallbackId }));
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Failed to load OpenRouter models:', error);
        setModelsError(error.message || 'Unable to load OpenRouter model list. Using defaults.');
        setAvailableModels(AVAILABLE_MODELS);
        setModelsUpdatedAt(new Date());

        const activeModel = selectedModelRef.current;
        if (AVAILABLE_MODELS.length && !AVAILABLE_MODELS.some(model => model.id === activeModel)) {
          const fallbackId = AVAILABLE_MODELS[0].id;
          setSelectedModel(fallbackId);
          setChatLLMConfig(prev => ({ ...prev, model: fallbackId }));
        }
      } finally {
        setIsFetchingModels(false);
        if (modelsAbortRef.current === controller) {
          modelsAbortRef.current = null;
        }
      }
  }, [setSelectedModel, setChatLLMConfig]);

    const handleRefreshModels = () => {
      fetchModels(true);
    };

    useEffect(() => {
      if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
      }
    }, [chatMessages]);

    useEffect(() => {
      if (centerViewMode === 'mermaid' && !mermaidDefinition.trim()) {
        setMermaidDefinition(buildMermaidDefinition(doc.frames, tasks));
      }
    }, [centerViewMode, doc.frames, mermaidDefinition, setMermaidDefinition, tasks]);

    useEffect(() => () => {
      modelsAbortRef.current?.abort();
    }, []);

    useEffect(() => {
      if (chatPanelMode === 'settings' && modelsUpdatedAt === null && !isFetchingModels) {
        fetchModels(true);
      }
      if (chatPanelMode !== 'settings') {
        modelsAbortRef.current?.abort();
      }
    }, [chatPanelMode, modelsUpdatedAt, isFetchingModels, fetchModels]);

    useEffect(() => {
      if (chatPanelMode === 'settings') {
        fetchModels(true);
      }
    }, [apiKey, chatPanelMode, fetchModels]);

    const createMessage = (role, content) => ({
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    const formatTimestamp = (isoString) => {
      try {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    };

    const generateFallbackReply = (message) => {
      if (!message) {
        return "I'm here whenever you need a design nudge.";
      }

      if (!selectedFrame) {
        return 'Select a frame so I can tailor the advice to your layout.';
      }

      const nodeCount = selectedFrame.nodes?.length || 0;
      const frameLabel = selectedFrameId ? selectedFrameId.slice(0, 6) : 'current frame';

      if (/button|cta/i.test(message)) {
        return `Let’s balance the CTA on frame ${frameLabel} with clear supporting text and enough breathing room around the ${nodeCount} existing elements.`;
      }
      if (/text|copy|heading|headline/i.test(message)) {
        return `Try pairing a punchy headline with a short subhead so the hierarchy on frame ${frameLabel} stays crisp.`;
      }
      if (/color|palette|contrast/i.test(message)) {
        return `Keep contrast strong and reuse one accent color so the interface feels cohesive despite the ${nodeCount} pieces on frame ${frameLabel}.`;
      }

      return `Noted! I can help break that into tasks or mock copy for frame ${frameLabel} whenever you're ready.`;
    };

  const handleSendMessage = async () => {
    if (chatPanelMode !== 'chat' || isChatGenerating) return;

    const trimmed = chatInput.trim();
    if (!trimmed) return;

    // Intercept special commands
    if (/^finalize\s+build$/i.test(trimmed)) {
      const report = await runPreflightAsync();
      setBuildPreviewOpen(true);
      setChatMessages(prev => ([
        ...prev,
        createMessage('assistant', report.overallPass
          ? 'Preflight passed. Opening Build Preview. Review and proceed to PR or ZIP.'
          : `Preflight found ${report.counts.unwaived} issue(s): ${report.counts.blocking} blocking, ${report.counts.major} major. Opened Build Preview to review.`),
      ]));
      setChatInput('');
      return;
    }

    const userMessage = createMessage('user', trimmed);
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatError(null);

      if (!apiKey?.trim()) {
        const guidance = 'Add your OpenRouter API key in Chat Settings (⚙) to enable live responses.';
        setChatMessages(prev => [...prev, createMessage('assistant', guidance)]);
        setChatError(guidance);
        return;
      }

      try {
        setIsChatGenerating(true);
        const reply = await aiIntegration.generateDesignSuggestion(trimmed, {
          selectedFrame,
          designAnalysis,
          doc,
        }, {
          model: selectedModel || chatLLMConfig.model,
          temperature: chatLLMConfig.temperature,
          maxTokens: chatLLMConfig.maxTokens,
        });

        setChatMessages(prev => [...prev, createMessage('assistant', reply)]);
      } catch (error) {
        console.error('AI chat request failed:', error);
        const fallback = generateFallbackReply(trimmed);
        const errorMessage = error?.message || 'OpenRouter request failed. Using a heuristic response instead.';
        setChatMessages(prev => [...prev, createMessage('assistant', fallback)]);
        setChatError(errorMessage);
      } finally {
        setIsChatGenerating(false);
      }
    };

    const handleChatKeyDown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!isChatGenerating) {
          handleSendMessage();
        }
      }
    };

    const cycleStatus = (status) => {
      if (status === 'pending') return 'in-progress';
      if (status === 'in-progress') return 'done';
      return 'pending';
    };

    const handleToggleTask = (taskId) => {
      setTasks(prev => prev.map(task => (
        task.id === taskId
          ? { ...task, status: cycleStatus(task.status) }
          : task
      )));
    };

    const handleDeleteTask = (taskId) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    const handleAddTask = () => {
      const trimmed = taskInput.trim();
      if (!trimmed) return;

      setTasks(prev => ([
        ...prev,
        {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: trimmed,
          status: 'pending',
          category: 'Backlog',
        },
      ]));
      setTaskInput('');
    };

    const updateRefactorAutomation = (updates) => {
      setRefactorAutomation(prev => ({ ...prev, ...updates }));
    };

    const isAutomationConfigured = Boolean(
      refactorAutomation.repoOwner &&
      refactorAutomation.repoName &&
      refactorAutomation.workflowId &&
      refactorAutomation.token
    );

    const handleAutomationToggle = (enabled) => {
      updateRefactorAutomation({ enabled });
      if (enabled && !isAutomationConfigured) {
        setShowAutomationSettings(true);
        setAutomationStatus('Add GitHub workflow details so I can trigger the refactor agent automatically.');
      }
    };

    const handleAutomationStringChange = (field) => (event) => {
      const raw = event.target.value;
      const value = field === 'token' ? raw : raw.trim();
      updateRefactorAutomation({ [field]: value });
    };

    const handleAutomationHotspotChange = (event) => {
      const parsed = parseInt(event.target.value, 10);
      updateRefactorAutomation({ hotspotThreshold: Number.isNaN(parsed) ? 250 : Math.max(parsed, 50) });
    };

    const handleAutomationCheckboxChange = (field) => (event) => {
      updateRefactorAutomation({ [field]: event.target.checked });
    };

    const handleAutomationResetToken = () => {
      updateRefactorAutomation({ token: '' });
      setAutomationStatus('Personal access token cleared. Add a new token to re-enable automation.');
    };

    useEffect(() => {
      const currentDoneIds = new Set(tasks.filter(task => task.status === 'done').map(task => task.id));
      const newlyCompleted = tasks.filter(task => task.status === 'done' && !previousCompletedTasksRef.current.has(task.id));

      if (newlyCompleted.length) {
        newlyCompleted.forEach((task) => {
          if (!refactorAutomation.enabled) {
            return;
          }

          if (!isAutomationConfigured) {
            setAutomationStatus('Configure the GitHub workflow details to enable automatic refactor sweeps.');
            setShowAutomationSettings(true);
            setChatMessages(prev => ([
              ...prev,
              createMessage('assistant', `Nice work finishing "${task.title}". Configure refactor automation so I can run a cleanup sweep automatically next time.`)
            ]));
            return;
          }

          const owner = refactorAutomation.repoOwner.trim();
          const repo = refactorAutomation.repoName.trim();
          const workflowFile = (refactorAutomation.workflowId || 'copilot-refactor.yml').trim() || 'copilot-refactor.yml';
          const branch = (refactorAutomation.branch || 'main').trim() || 'main';
          const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`;

          const payload = {
            ref: branch,
            inputs: {
              'dry-run': refactorAutomation.dryRun ? 'true' : 'false',
              'apply': refactorAutomation.apply ? 'true' : 'false',
              'hotspot-threshold': String(refactorAutomation.hotspotThreshold || 250),
              'task-id': task.id,
              'task-title': task.title,
            },
          };

          setAutomationStatus(`Dispatching refactor agent for "${task.title}"...`);

          fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${refactorAutomation.token}`,
              Accept: 'application/vnd.github+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
            .then(async (response) => {
              if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `GitHub responded with ${response.status}`);
              }
              setAutomationStatus(`Refactor agent queued for "${task.title}".`);
              setChatMessages(prev => ([
                ...prev,
                createMessage('assistant', `Task "${task.title}" is complete. I queued the refactor agent to audit the code.`)
              ]));
            })
            .catch((error) => {
              console.error('Refactor automation dispatch failed:', error);
              setAutomationStatus(`Refactor automation failed: ${error.message}`);
              setChatMessages(prev => ([
                ...prev,
                createMessage('assistant', `I tried to run the refactor agent for "${task.title}" but GitHub returned: ${error.message}`)
              ]));
            });
        });
      }

      previousCompletedTasksRef.current = currentDoneIds;
    }, [tasks, refactorAutomation, isAutomationConfigured, setChatMessages]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = totalTasks - completedTasks;
  const activeModel = availableModels.find(model => model.id === selectedModel) || null;
  const primaryMenuItems = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Help'];

    const handleAnalyzeDesign = () => {
      const frame = doc.frames.find(f => f.id === selectedFrameId);
      if (!frame) {
        setChatMessages(prev => [...prev, createMessage('assistant', 'Select a frame first and I’ll turn the audit into actionable tasks.')]);
        return;
      }

      const result = bmadMethodology.generateRecommendations(frame, frame.nodes || []);
      setDesignAnalysis(result);

      const violations = result.analysis?.violations || [];
      const generatedTasks = violations.flatMap(violation =>
        (violation.issues || []).map(issue => ({
          id: `${violation.principle}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: issue,
          status: 'pending',
          category: violation.principle,
        }))
      );

      if (generatedTasks.length === 0) {
        setChatMessages(prev => [...prev, createMessage('assistant', 'Nice! That frame is in great shape—no new tasks to add.')]);
        return;
      }

      setTasks(prev => {
        const existing = new Set(prev.map(task => task.title));
        const deduped = generatedTasks.filter(task => !existing.has(task.title));
        if (deduped.length === 0) return prev;
        return [...prev, ...deduped];
      });

      setChatMessages(prev => [...prev, createMessage('assistant', `I found ${generatedTasks.length} opportunities. They’re now sitting in your task list.`)]);
    };

    const handleCanvasClick = () => {
      setSelectedFrameId(null);
      setSelectedNodeId(null);
    };

    const showMenu = (event, frameId) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      setMenu({
        frameId,
        x: rect.right + 10,
        y: rect.top,
      });
    };

    const showComponentMenu = (event, frameId, nodeId) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setComponentMenus(prev => ({
        ...prev,
        [`${frameId}-${nodeId}`]: {
          frameId,
          nodeId,
          x: rect.right + 10,
          y: rect.top,
          isOpen: true,
        },
      }));
    };

    const closeComponentMenu = (frameId, nodeId) => {
      setComponentMenus(prev => ({
        ...prev,
        [`${frameId}-${nodeId}`]: {
          ...prev[`${frameId}-${nodeId}`],
          isOpen: false,
        },
      }));
    };

    const addComponentComment = (frameId, nodeId, comment) => {
      const commentKey = `${frameId}-${nodeId}`;
      setComponentComments(prev => ({
        ...prev,
        [commentKey]: [...(prev[commentKey] || []), comment],
      }));
    };

    const getComponentComments = (frameId, nodeId) => {
      const commentKey = `${frameId}-${nodeId}`;
      return componentComments[commentKey] || [];
    };

    const getComponent = (frameId, nodeId) => {
      const frame = doc.frames.find(f => f.id === frameId);
      return frame?.nodes?.find(node => node.id === nodeId);
    };

    const handleFocusChat = () => {
      setChatPanelMode('chat');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    };

    const handleFocusTasks = () => {
      tasksHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const isChatSettingsMode = chatPanelMode === 'settings';
    const chatPanelTitle = isChatSettingsMode ? 'Chat Settings' : 'AI Chat';
    const chatPanelSubtitle = isChatSettingsMode
      ? 'Tune the assistant, policies, and workflow instructions.'
      : 'Brainstorm copy, layout, or product flows.';
    const chatSettingsButtonIcon = isChatSettingsMode ? '✕' : '⚙';
    const chatSettingsButtonLabel = isChatSettingsMode ? 'Return to chat' : 'Open chat settings';

    // Add a message to the chat panel
  const addToChat = useCallback((role, content) => {
    const message = {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, message]);
  }, [setChatMessages]);

    return (<>
      <div className="app-shell">
        <header className="menu-bar" role="menubar" aria-label="Application command menus">
          <div className="menu-bar__identity" role="menuitem" tabIndex={0}>
            <span className="menu-bar__product">UI Designer</span>
            <span className="menu-bar__workspace">Focused session</span>
          </div>
          <nav className="menu-bar__items" aria-label="Primary commands">
            {primaryMenuItems.map((label) => (
              <button key={label} type="button" className="menu-bar__item" tabIndex={0}>
                {label}
              </button>
            ))}
            <span className="menu-bar__tab-divider" aria-hidden="true" />
            <button
              type="button"
              className="menu-bar__item"
              tabIndex={0}
              onClick={handleFocusTasks}
            >
              Task Board
            </button>
          </nav>
          <div className="menu-bar__actions">
            <span className="menu-bar__status">
              Model: <strong>{activeModel?.name || selectedModel || 'Not selected'}</strong>
            </span>
            <span className="menu-bar__divider" aria-hidden="true">•</span>
            <span className="menu-bar__status">
              Frames: <strong>{doc.frames.length}</strong>
            </span>
            <span className="menu-bar__divider" aria-hidden="true">•</span>
            <span className="menu-bar__status">
              Tasks left: <strong>{pendingTasks}</strong>
            </span>
            <button type="button" className="menu-bar__action" onClick={handleFocusChat}>
              Focus Chat
            </button>
            <button type="button" className="menu-bar__action" onClick={handleFocusTasks}>
              Focus Tasks
            </button>
          </div>
        </header>
        <div className="app">
        <div className="panel left">
          <div className="panel-header">
            <div>
              <h4>{chatPanelTitle}</h4>
              <p className="panel-subtitle">{chatPanelSubtitle}</p>
            </div>
            <div className="panel-header-actions">
              <span className="status-dot">● online</span>
            <button
              type="button"
              className={`panel-icon-button${isChatSettingsMode ? ' panel-icon-button--active' : ''}`}
              onClick={handleToggleChatSettings}
              aria-pressed={isChatSettingsMode}
              aria-label={state.uiHintsEnabled ? chatSettingsButtonLabel : undefined}
              title={state.uiHintsEnabled ? chatSettingsButtonLabel : undefined}
            >
              {chatSettingsButtonIcon}
            </button>
            </div>
          </div>
          <div className="chat-panel">
            {isChatSettingsMode ? (
              <div className="chat-settings">
                <section className="chat-settings__section">
                  <header>
                    <h5>LLM Configuration</h5>
                    <p>Choose the provider, model, and generation parameters for the assistant.</p>
                  </header>
                  <label className="chat-settings__field chat-settings__field--stack">
                    <span>OpenRouter API Key</span>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(event) => handleApiKeyInputChange(event.target.value)}
                      placeholder="sk-or-v1-..."
                      autoComplete="off"
                    />
                    <small className="chat-settings__hint">Stored locally in this browser. Create keys at openrouter.ai.</small>
                  </label>
                  <div className="chat-settings__grid">
                    <label className="chat-settings__field">
                      <span>Provider</span>
                      <input type="text" value="OpenRouter" readOnly />
                    </label>
                    <label className="chat-settings__field">
                      <span>Model</span>
                      <div className="chat-settings__model-row">
                        <ModelPicker
                          models={availableModels}
                          value={selectedModel}
                          onChange={(modelId) => handleChatLLMConfigChange('model', modelId)}
                          isLoading={isFetchingModels}
                          onRefresh={handleRefreshModels}
                          error={modelsError}
                          updatedAt={modelsUpdatedAt}
                          recommendedModel={recommendedModel}
                        />
                      </div>
                      {!modelsError && recommendedModel && (
                        <small className="chat-settings__hint">Suggested starter: {recommendedModel.name}</small>
                      )}
                      {modelsError && (
                        <small className="chat-settings__hint chat-settings__hint--error">{modelsError}</small>
                      )}
                    </label>
                    <label className="chat-settings__field">
                      <span>Temperature</span>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={chatLLMConfig.temperature}
                        onChange={(event) => handleChatLLMConfigChange('temperature', event.target.value)}
                      />
                    </label>
                    <label className="chat-settings__field">
                      <span>Max Tokens</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={chatLLMConfig.maxTokens}
                        onChange={(event) => handleChatLLMConfigChange('maxTokens', event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="chat-settings__section">
                  <header>
                    <h5>AI Rules &amp; Policies</h5>
                    <p>Define the guardrails the assistant must follow in every response.</p>
                  </header>
                  <textarea
                    value={chatPolicies}
                    onChange={(event) => handleChatPoliciesChange(event.target.value)}
                    placeholder="Outline the acceptable guidance, tone, and compliance requirements."
                  />
                </section>

                <section className="chat-settings__section">
                  <header>
                    <h5>Agent Workflow Instructions</h5>
                    <p>Set the multi-step workflow or escalation rules for the assistant.</p>
                  </header>
                  <textarea
                    value={agentWorkflowRules}
                    onChange={(event) => handleAgentWorkflowRulesChange(event.target.value)}
                    placeholder="Describe how the agent should break down tasks, hand off actions, or request clarification."
                  />
                </section>

                <section className="chat-settings__section">
                  <header>
                    <h5>UI Settings</h5>
                    <p>Toggle helper hints like tooltips and aria labels.</p>
                  </header>
                  <label className="chat-settings__field">
                    <input
                      type="checkbox"
                      checked={state.uiHintsEnabled}
                      onChange={(e) => state.setUiHintsEnabled(e.target.checked)}
                    />
                    <span style={{ marginLeft: 8 }}>Show hints/tooltips</span>
                  </label>
                </section>
              </div>
            ) : (
              <>
                <div ref={chatHistoryRef} className="chat-history">
                  {chatMessages.map(message => (
                    <div key={message.id} className={`chat-message chat-message--${message.role}`}>
                      <div className="chat-message__meta">
                        <span className="chat-message__author">{message.role === 'assistant' ? 'FrameForge Copilot' : 'You'}</span>
                        <span className="chat-message__time">{formatTimestamp(message.timestamp)}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))}
                  {isChatGenerating && (
                    <div className="chat-message chat-message--assistant chat-message--pending">
                      <div className="chat-message__meta">
                        <span className="chat-message__author">FrameForge Copilot</span>
                        <span className="chat-message__time">{formatTimestamp(new Date().toISOString())}</span>
                      </div>
                      <p>Thinking through your layout…</p>
                    </div>
                  )}
                  {chatMessages.length === 0 && (
                    <div className="chat-empty">Start a conversation to get tailored guidance.</div>
                  )}
                </div>
                <div className="chat-composer">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask anything about your interface..."
                    aria-busy={isChatGenerating}
                  />
                  <div className="chat-actions">
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatGenerating}
                    >
                      Send
                    </button>
                  </div>
                  {chatError && (
                    <div className="chat-error" role="status" aria-live="polite">
                      {chatError}
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
      </div>

      <div className="panel center">
          <ScreenTabs screens={screens} activeScreenId={activeScreenId} setActiveScreenId={setActiveScreenId} setDoc={setDoc} uiHintsEnabled={state.uiHintsEnabled} />
          <Toolbar
            onAddFrame={handleAddFrame}
            onAnalyzeDesign={handleAnalyzeDesign}
            onApplyEdits={handleApplyEdits}
            onExport={exportDoc}
            onImport={importDoc}
            onShowAIPanel={handleFocusChat}
            onShowAdvancedPanel={handleFocusTasks}
            selectedFrame={selectedFrame}
            viewMode={centerViewMode}
            onChangeView={handleCenterViewChange}
          />

          {centerViewMode === 'design' ? (
            <Canvas
              canvasRef={canvasRef}
              frames={framesForActiveScreen}
              screens={screens}
              selectedFrameId={selectedFrameId}
              selectedNodeId={selectedNodeId}
              showGrid={showGrid}
              zoom={zoom}
              onCanvasClick={handleCanvasClick}
              onFrameMouseDown={handleFrameMouseDown}
              onResizeMouseDown={handleResizeMouseDown}
              onComponentMouseDown={handleComponentDrag}
              onShowMenu={showMenu}
              onUpdateFrame={updateFrame}
              onUpdateNode={updateNode}
              onShowComponentMenu={showComponentMenu}
              onCreateScreen={handleCreateScreen}
              onCreateModalFrame={handleCreateModalFrame}
              componentMenus={componentMenus}
              getComponent={getComponent}
              closeComponentMenu={closeComponentMenu}
              addComponentComment={addComponentComment}
              getComponentComments={getComponentComments}
              frameTitleOptions={frameTitleOptions}
              onSelectFrameTitle={handleSelectFrameTitle}
              onAddFrameTitleOption={handleAddFrameTitleOption}
              onDeleteFrame={handleDeleteFrame}
              onDeleteComponent={handleDeleteComponent}
              uiHintsEnabled={state.uiHintsEnabled}
              onAskCopilot={(frameId, nodeId) => {
                const frame = doc.frames.find(f => f.id === frameId);
                const node = frame?.nodes?.find(n => n.id === nodeId);
                const outbound = (frame?.nodes || [])
                  .map(n => n?.props?.navigateTo)
                  .filter(Boolean)
                  .map(n => `${n.type}:${n.targetId || ''}:${n.label || ''}`);
                const context = {
                  frame: frame ? { id: frame.id, title: frame.title, screenId: frame.screenId } : null,
                  node: node ? { id: node.id, type: node.type, props: node.props } : null,
                  outbound,
                };
                addToChat('user', `Ask Copilot about this component. Context:\n${JSON.stringify(context, null, 2)}`);
                setChatPanelMode('chat');
              }}
            />
          ) : (
            <Suspense fallback={<div className="panel-loading">Loading diagram workspace…</div>}>
              <WorkflowEditor backendGraph={state.backendGraph} onChange={state.setBackendGraph} />
            </Suspense>
          )}
        </div>

        <div className="panel right">
          <div className="panel-header" ref={tasksHeaderRef}>
            <div>
              <h4>Task List</h4>
              <p className="panel-subtitle">{completedTasks}/{totalTasks} done · {inProgressTasks} in progress</p>
            </div>
            <button type="button" className="panel-secondary" onClick={handleAnalyzeDesign}>
              Sync
            </button>
          </div>
          <div className="task-panel">
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
                      const failing = ['preflight','tests','a11y','lintBuild'].filter((k) => (gates?.[k] !== 'pass'));
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
            <div className="task-create">
              <input
                type="text"
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
                placeholder="Capture a new to-do"
              />
              <button type="button" onClick={handleAddTask} disabled={!taskInput.trim()}>
                Add
              </button>
            </div>
            <div className="task-list">
              {tasks.length === 0 && (
                <div className="task-empty">No tasks yet. Ask the chat for suggestions or add one manually.</div>
              )}
              {tasks.map(task => (
                <div key={task.id} className={`task-item task-item--${task.status}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleTask(task.id)}
                    />
                    <div>
                      <span className="task-title">{task.title}</span>
                      <span className="task-meta">{task.category || 'General'} · {task.status.replace('-', ' ')}</span>
                    </div>
                  </label>
                  <div className="task-actions">
                    <button type="button" onClick={() => handleToggleTask(task.id)} title="Advance status">
                      ↻
                    </button>
                    <button type="button" onClick={() => handleDeleteTask(task.id)} title="Remove task">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {menu && (
          <div
            style={{
              position: 'absolute',
              left: menu.x,
              top: menu.y,
              background: 'white',
              border: '1px solid #e1e5e9',
              borderRadius: '0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '220px',
              maxHeight: '320px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            <div style={{ padding: '8px 0' }}>
              {Object.entries(MenuCatalog).map(([category, categoryData]) => (
                <div key={category}>
                  <div
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    {category}
                  </div>
                  {categoryData.items.map(item => (
                    <button
                      key={item.type}
                      onClick={() => addComponent(menu.frameId, item.type)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(event) => { event.target.style.background = '#f3f4f6'; }}
                      onMouseLeave={(event) => { event.target.style.background = 'none'; }}
                    >
                      {item.icon} {item.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {isBuildPreviewOpen && (
        <div className="build-preview-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="build-preview" style={{ background: 'white', width: '90vw', height: '80vh', display: 'grid', gridTemplateColumns: '280px 1fr', borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="build-preview__side" style={{ borderRight: '1px solid #e5e7eb', padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Build Preview</strong>
                <button className="panel-icon-button" onClick={() => setBuildPreviewOpen(false)} aria-label={state.uiHintsEnabled ? 'Close' : undefined}>×</button>
              </div>
              <ul style={{ marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12, lineHeight: 1.4 }}>
                <li>src/</li>
                <li style={{ marginLeft: 12 }}>components/</li>
                {(framesForActiveScreen || []).map(f => (
                  <li key={f.id} style={{ marginLeft: 24 }}>A {`${(f.title || 'Frame').replace(/\s+/g,'')}.jsx`}</li>
                ))}
                <li style={{ marginLeft: 12 }}>hooks/</li>
                <li style={{ marginLeft: 12 }}>utils/</li>
                <li>docs/</li>
                <li style={{ marginLeft: 12 }}>FrameForge_System_Specification_Codex_Edition.md</li>
              </ul>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <div><strong>Preflight</strong></div>
                <div>Total issues: <strong>{preflight?.counts?.total ?? 0}</strong></div>
                <div>Unwaived: <strong>{preflight?.counts?.unwaived ?? 0}</strong></div>
                <div>Blocking: <strong>{preflight?.counts?.blocking ?? 0}</strong></div>
                <div>Major: <strong>{preflight?.counts?.major ?? 0}</strong></div>
                <div>Status: <strong style={{ color: preflight?.overallPass ? '#059669' : '#B91C1C' }}>{preflight?.overallPass ? 'PASS' : 'BLOCKED'}</strong></div>
              </div>
            </div>
            <div className="build-preview__main" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600 }}>Read-only Preview</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Planned changes and file layout (mock). Diff markers will appear here.</div>
              </div>
              <div style={{ padding: 0, overflow: 'auto' }}>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Preflight Issues</div>
                  {(!preflight?.issues || preflight.issues.length === 0) && (
                    <div style={{ color: '#059669' }}>No issues found. Ready to publish.</div>
                  )}
                  {(preflight?.issues || []).map((iss) => {
                    const waived = Boolean(preflightWaivers[iss.key]);
                    return (
                      <div key={iss.key} style={{ border: '1px solid #e5e7eb', borderLeft: `4px solid ${iss.severity === 'block' ? '#B91C1C' : iss.severity === 'major' ? '#F59E0B' : '#6B7280'}`, borderRadius: 4, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px' }}>
                          <div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{iss.code} • {iss.severity}{waived ? ' • waived' : ''}</div>
                            <div>{iss.message}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              {iss.screenId ? `screen=${iss.screenId} ` : ''}{iss.frameId ? `frame=${iss.frameId} ` : ''}{iss.nodeId ? `node=${iss.nodeId}` : ''}
                            </div>
                            {waived && (
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Waiver: {preflightWaivers[iss.key]}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!waived && (
                              <>
                                <button
                                  type="button"
                                  className="panel-secondary"
                                  onClick={() => {
                                    // Build a human summary and an opsPreview
                                    let summary = 'Apply suggested fix';
                                    if (iss.code === 'contrast.iconOnly' && iss.suggestedFix?.candidates?.length) {
                                      const cand = iss.suggestedFix.candidates[0];
                                      summary = `Raise icon contrast to ${cand.token.replace('colors.', '').replace(/([A-Z])/g, ' $1').trim()} (${(iss.required || 3.0).toFixed ? (iss.required).toFixed(1) : iss.required}:1)`;
                                    } else if (iss.code === 'contrast.text') {
                                      summary = 'Increase text contrast to meet WCAG';
                                    } else if (iss.code === 'contrast.focusRing') {
                                      summary = 'Increase focus ring contrast/strength';
                                    } else if (iss.code === 'tapTarget.tooSmall') {
                                      summary = 'Increase tap target area (padding or hitSlop)';
                                    } else if (iss.code === 'a11y.missingName') {
                                      summary = 'Set accessible name (aria-label)';
                                    }
                                    const opsPreview = [];
                                    if (iss.code?.startsWith('contrast.iconOnly')) {
                                      opsPreview.push({ op: 'replace', path: `/ui/nodes/byId/${iss.nodeId}/props/iconColor`, value: '{colors.textHigh}' });
                                    } else if (iss.code === 'contrast.text') {
                                      opsPreview.push({ op: 'replace', path: `/ui/nodes/byId/${iss.nodeId}/props/color`, value: '{colors.textHigh}' });
                                    } else if (iss.code === 'contrast.focusRing') {
                                      opsPreview.push({ op: 'replace', path: `/ui/nodes/byId/${iss.nodeId}/props/focusRingColor`, value: '{colors.focusStrong}' });
                                    } else if (iss.code === 'tapTarget.tooSmall') {
                                      opsPreview.push({ op: 'add', path: `/ui/nodes/byId/${iss.nodeId}/props/hitSlop`, value: { top: 6, right: 6, bottom: 6, left: 6 } });
                                    } else if (iss.code === 'a11y.missingName') {
                                      opsPreview.push({ op: 'replace', path: `/ui/nodes/byId/${iss.nodeId}/props/ariaLabel`, value: 'Action' });
                                    }
                                    const payload = {
                                      issueRef: `preflight#${iss.key}`,
                                      suggestedFix: Object.assign({}, iss.suggestedFix || {}, {
                                        applyTo: [{ targetId: iss.nodeId, state: iss.state || 'default' }],
                                        opsPreview,
                                      }),
                                    };
                                    const message = `${summary}\n\nDetails will propose changes to the spec.\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
                                    setChatMessages(prev => ([...prev, createMessage('assistant', message)]));
                                  }}
                                >Fix with AI</button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = prompt('Add waiver reason');
                                    if (reason && reason.trim()) {
                                      setPreflightWaivers(prev => ({ ...prev, [iss.key]: reason.trim() }));
                                      try { await runPreflightAsync(); } catch { /* ignore */ }
                                    }
                                  }}
                                >Add waiver</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="panel-secondary"
                  onClick={handleRunSandbox}
                >Run Sandbox Checks</button>
                <button
                  type="button"
                  className="panel-secondary"
                  onClick={handleApproveAndCreatePR}
                  disabled={(() => {
                    const allPass = (gates.preflight === 'pass' && gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass' && gates.risk === 'low');
                    const hasFailing = (gates.preflight === 'fail' || gates.tests === 'fail' || gates.a11y === 'fail' || gates.lintBuild === 'fail' || gates.risk !== 'low');
                    const overrideOk = (overrideState.enabled && isOwner && hasFailing && (overrideState.reason.trim().length >= 15) && overrideState.accepted);
                    return !(allPass || overrideOk);
                  })()}
                  aria-disabled={(() => {
                    const allPass = (gates.preflight === 'pass' && gates.tests === 'pass' && gates.a11y === 'pass' && gates.lintBuild === 'pass' && gates.risk === 'low');
                    const hasFailing = (gates.preflight === 'fail' || gates.tests === 'fail' || gates.a11y === 'fail' || gates.lintBuild === 'fail' || gates.risk !== 'low');
                    const overrideOk = (overrideState.enabled && isOwner && hasFailing && (overrideState.reason.trim().length >= 15) && overrideState.accepted);
                    return !(allPass || overrideOk);
                  })()}
                >Approve and create PR</button>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                >Download ZIP</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>);
  }









