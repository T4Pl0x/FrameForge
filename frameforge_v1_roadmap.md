# FrameForge v1.0 Roadmap: Top 12 Fixes with Workflows

## Executive Summary

This roadmap outlines the critical fixes and improvements needed to reach FrameForge v1.0, organized by workflow priority. Each fix includes specific implementation details, code snippets, and acceptance criteria.

## Workflow Mapping

| Workflow | Focus Areas | Priority |
|----------|-------------|----------|
| **WF-1: Decomposition** | Component architecture, SRP | High |
| **WF-2: TypeScript** | Type safety, migration strategy | Medium |
| **WF-3: AppState** | State consolidation, reducer pattern | High |
| **WF-4: Testing/Security** | Contract tests, token security | High |
| **WF-5: Performance** | Memoization, lazy loading | Medium |
| **WF-7: SDK/Registry** | Dynamic extensions, build optimization | Medium |
| **WF-8: Publishing** | PR integration, report normalization | High |

---

## WF-1: Decomposition (Component Architecture)

### Objective
Break down the 2,288-line monolithic [`App-Refactored.jsx`](frameforge/src/App-Refactored.jsx:1) into Single Responsibility Principle modules.

### Implementation Plan

#### 1. Create Core App Structure
```javascript
// src/app/AppCore.jsx
import React, { useReducer } from 'react';
import { appReducer, initialState } from '../appState/appReducer';
import ChatPanel from './panels/ChatPanel';
import TaskPanel from './panels/TaskPanel';
import PublishPanel from './panels/PublishPanel';
import CanvasView from './canvas/CanvasView';

export default function AppCore() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <div className="app-shell">
      <StatusBar state={state} />
      <div className="app-main">
        <ChatPanel state={state} dispatch={dispatch} />
        <CanvasView state={state} dispatch={dispatch} />
        <TaskPanel state={state} dispatch={dispatch} />
      </div>
      <PublishPanel state={state} dispatch={dispatch} />
    </div>
  );
}
```

#### 2. Extract Panel Components
```javascript
// src/app/panels/ChatPanel.jsx
import React from 'react';
import { chatActions } from '../../appState/appActions';

export default function ChatPanel({ state, dispatch }) {
  const { chatMessages, chatInput, isChatGenerating } = state;
  
  const handleSendMessage = () => {
    dispatch(chatActions.sendMessage(chatInput));
  };
  
  return (
    <div className="panel left">
      <ChatHistory messages={chatMessages} />
      <ChatComposer onSend={handleSendMessage} />
    </div>
  );
}
```

#### 3. Update Main Entry Point
```javascript
// src/App-Refactored.jsx (now a thin loader)
export { default } from './app/AppCore.jsx';
```

### Acceptance Criteria
- [ ] No component exceeds 300 LOC
- [ ] All functions have cyclomatic complexity ≤ 10
- [ ] App boots successfully with new structure
- [ ] All existing functionality preserved

---

## WF-3: AppState (State Consolidation)

### Objective
Replace 40+ useState hooks with a unified reducer pattern and facade API.

### Implementation Plan

#### 1. Create App State Facade
```typescript
// src/appState/index.ts
import { useReducer, useCallback } from 'react';
import { appReducer, initialState } from './appReducer';
import * as appActions from './appActions';

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const io = {
    propose: useCallback((patch: any, rationale?: string) => {
      dispatch(appActions.proposePatch(patch, rationale));
    }, []),
    
    updateFrame: useCallback((frameId: string, updates: any) => {
      dispatch(appActions.updateFrame(frameId, updates));
    }, []),
    
    // ... other facade methods
  };
  
  return { ...state, io, dispatch };
}
```

#### 2. Implement Reducer
```typescript
// src/appState/appReducer.ts
import { Draft, produce } from 'immer';

export interface AppState {
  doc: DocumentState;
  activeScreenId: string;
  selectedFrameId: string | null;
  chatMessages: ChatMessage[];
  tasks: Task[];
  // ... 30+ other state properties
}

export const appReducer = produce((draft: Draft<AppState>, action: any) => {
  switch (action.type) {
    case 'UPDATE_FRAME':
      const frame = draft.doc.frames.find(f => f.id === action.payload.frameId);
      if (frame) {
        Object.assign(frame, action.payload.updates);
      }
      break;
      
    case 'ADD_TASK':
      draft.tasks.push(action.payload.task);
      break;
      
    // ... 20+ more action types
  }
}, initialState);
```

#### 3. Create Action Creators
```typescript
// src/appState/appActions.ts
export const chatActions = {
  sendMessage: (content: string) => ({
    type: 'SEND_MESSAGE',
    payload: { content, timestamp: Date.now() }
  }),
  
  setModel: (modelId: string) => ({
    type: 'SET_CHAT_MODEL',
    payload: { modelId }
  })
};

export const frameActions = {
  updateFrame: (frameId: string, updates: any) => ({
    type: 'UPDATE_FRAME',
    payload: { frameId, updates }
  }),
  
  addFrame: (frameData: any) => ({
    type: 'ADD_FRAME',
    payload: { frame: frameData }
  })
};
```

### Acceptance Criteria
- [ ] All state mutations go through AppState.io.propose()
- [ ] useReducer successfully replaces all useState hooks
- [ ] AppState facade provides clean API surface
- [ ] No direct state mutations outside reducer

---

## WF-4: Testing/Security (Critical Fixes)

### Objective
Implement environment-gated auto-approval and secure token handling.

#### A. Environment-Gated Auto-Approval

```javascript
// src/kernel/KernelProvider.jsx
export function KernelProvider({ children }) {
  const user = getUserFromStorage();
  const kernel = createKernel({ 
    user, 
    store: { initialSpec: { ui: loadInitialUi(), ... } } 
  });

  // Only auto-approve in explicit dev mode
  const isDevAuto = import.meta?.env?.VITE_FF_DEV_AUTOAPPROVE === 'true';

  useEffect(() => {
    if (!isDevAuto) return; // Skip if not in dev auto-approval mode
    
    const off = kernel.bus.on('proposal:submitted', async ({ id }) => {
      try {
        await kernel.proposals.preflight(id);
        await kernel.proposals.approve(id, { by: 'dev-auto', user });
        await kernel.proposals.apply(id, { user });
      } catch (e) {
        console.error('Preflight/approval failed', e);
      }
    });
    return off;
  }, [kernel, isDevAuto, user]);

  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}
```

**Contract Test:**
```javascript
// tests/kernel/auto-approval.test.js
test('auto-approval disabled in production', async () => {
  const originalEnv = import.meta.env.VITE_FF_DEV_AUTOAPPROVE;
  import.meta.env.VITE_FF_DEV_AUTOAPPROVE = undefined;
  
  const { kernel } = createTestKernel();
  const proposalId = await kernel.proposals.propose({
    target: '/ui',
    patch: [{ op: 'add', path: '/frames/-', value: { id: 'test' } }]
  });
  
  // Should remain pending without explicit approval
  const status = await kernel.proposals.getStatus(proposalId);
  expect(status).toBe('pending');
  
  import.meta.env.VITE_FF_DEV_AUTOAPPROVE = originalEnv;
});
```

#### B. Secure Token Storage

```typescript
// src/security/tokenStore.ts
const KEY = 'ff.tokens.v1';
const SALT = 'ff-os'; // Replace with build-time secret

export function saveToken(name: 'openrouter' | 'github', token: string) {
  const payload = crypto.getRandomValues(new Uint8Array(12));
  const encoded = btoa(unescape(encodeURIComponent(token + '|' + Date.now())));
  const blob = `${name}:${encoded}:${Array.from(payload).join('.')}`;
  sessionStorage.setItem(KEY, blob); // Session only
}

export function loadToken(name: 'openrouter' | 'github') {
  const blob = sessionStorage.getItem(KEY);
  if (!blob?.startsWith(name + ':')) return null;
  
  const [, encoded] = blob.split(':');
  const [token, ts] = decodeURIComponent(escape(atob(encoded))).split('|');
  const maxAgeMs = 1000 * 60 * 60 * 12; // 12 hours
  
  if (Date.now() - Number(ts) > maxAgeMs) {
    sessionStorage.removeItem(KEY);
    return null;
  }
  return token;
}

export function clearTokens() {
  sessionStorage.removeItem(KEY);
}
```

### Acceptance Criteria
- [ ] Auto-approval only when `VITE_FF_DEV_AUTOAPPROVE === 'true'`
- [ ] Contract test proves auto-approval off by default
- [ ] Tokens stored in sessionStorage with 12-hour expiry
- [ ] Settings UI available to re-enter tokens
- [ ] No localStorage usage for sensitive tokens

---

## WF-5: Performance (Optimization)

### Objective
Implement memoization, lazy loading, and reduce bundle size.

#### A. Memoization for Heavy Operations

```javascript
// src/app/panels/TaskPanel.jsx
import React, { useMemo } from 'react';

export default function TaskPanel({ state, dispatch }) {
  const { tasks, selectedFrameId } = state;
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      !selectedFrameId || task.frameId === selectedFrameId
    );
  }, [tasks, selectedFrameId]);
  
  const taskStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status === 'pending').length
  }), [tasks]);
  
  return (
    <div className="panel right">
      <TaskStats stats={taskStats} />
      <TaskList tasks={filteredTasks} />
    </div>
  );
}
```

#### B. React.memo for Heavy Components

```javascript
// src/components/Frame.jsx
import React, { memo } from 'react';

const Frame = memo(({ frame, isSelected, ...props }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.frame.id === nextProps.frame.id &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.frame.x === nextProps.frame.x &&
         prevProps.frame.y === nextProps.frame.y;
});

export default Frame;
```

#### C. Lazy Loading for Heavy Dependencies

```javascript
// src/app/panels/MermaidPanel.jsx
import React, { Suspense, lazy } from 'react';

const MermaidCanvas = lazy(() => import('../components/MermaidCanvas'));

export default function MermaidPanel({ state, dispatch }) {
  return (
    <Suspense fallback={<div>Loading diagram...</div>}>
      <MermaidCanvas definition={state.mermaidDefinition} />
    </Suspense>
  );
}
```

#### D. Vite Configuration Updates

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200, // Realistic limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('mermaid')) return 'mermaid';
          if (id.includes('katex')) return 'katex';
          if (id.includes('reactflow')) return 'reactflow';
          return 'vendor';
        }
      }
    }
  }
});
```

### Acceptance Criteria
- [ ] Critical lists/components wrapped in useMemo/React.memo
- [ ] Mermaid/Katex lazy-loaded on demand
- [ ] Chunk size warning limit ≤ 1200 KB
- [ ] No performance regressions in Core Web Vitals

---

## WF-7: SDK/Registry (Dynamic Extensions)

### Objective
Replace hardcoded view mapping with dynamic registration system.

#### A. Extension Registry

```typescript
// src/os/registry/extensionRegistry.ts
export type ExtensionEntry = {
  id: string;
  name: string;
  icon?: string;
  version: string;
  activate: (kernel: any) => { 
    routes?: Record<string, React.ReactNode>, 
    commands?: any[] 
  };
};

const _extensions: Record<string, ExtensionEntry> = {};

export function registerExtension(ext: ExtensionEntry) {
  if (_extensions[ext.id]) {
    console.warn(`Extension ${ext.id} already registered`);
    return;
  }
  _extensions[ext.id] = ext;
}

export function listExtensions() {
  return Object.values(_extensions);
}

export function getExtension(id: string) {
  return _extensions[id];
}
```

#### B. View Registry

```typescript
// src/os/registry/viewRegistry.ts
const _views: Record<string, React.ReactNode> = {};

export function registerView(key: string, node: React.ReactNode) {
  _views[key] = node;
}

export function getViews() {
  return { ..._views }; // Return copy
}

export function getView(key: string) {
  return _views[key];
}
```

#### C. Updated Shell Component

```javascript
// src/os/Shell.jsx
import React, { useEffect, useMemo } from 'react';
import { getViews } from './registry/viewRegistry';
import { listExtensions } from './registry/extensionRegistry';

export default function Shell() {
  const [active, setActive] = useState('ui');
  
  const views = useMemo(() => getViews(), []);
  const extensions = useMemo(() => listExtensions(), []);
  
  const dockItems = useMemo(() => [
    { key: 'ui', label: 'UI' },
    ...extensions.map(ext => ({ 
      key: ext.id, 
      label: ext.name, 
      icon: ext.icon 
    }))
  ], [extensions]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr' }}>
      <Dock active={active} onSelect={setActive} items={dockItems} />
      <div>
        {views[active] || <div>View not found</div>}
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Extensions can register views dynamically
- [ ] Shell reads from registry instead of hardcoded map
- [ ] Extension lifecycle management implemented
- [ ] No breaking changes to existing extensions

---

## WF-8: Publishing (PR Integration)

### Objective
Implement real PR creation with report attachments and normalized reports.

#### A. Normalized Report Structure

```javascript
// scripts/normalize-reports.js
export function normalizeReports(buildDir) {
  const reports = {
    build: null,
    a11y: null,
    tests: null
  };
  
  // Normalize build report
  try {
    const buildRaw = JSON.parse(fs.readFileSync(`${buildDir}/build.json`, 'utf8'));
    reports.build = {
      errors: buildRaw.errors || [],
      warnings: buildRaw.warnings || [],
      summary: {
        totalErrors: buildRaw.errors?.length || 0,
        totalWarnings: buildRaw.warnings?.length || 0
      }
    };
  } catch (e) {
    console.warn('Failed to normalize build report:', e);
  }
  
  // Similar normalization for a11y and tests...
  
  fs.writeFileSync(`${buildDir}/reports/normalized.json`, JSON.stringify(reports, null, 2));
  return reports;
}
```

#### B. PR Creation with Reports

```javascript
// src/tools/githubPublisher.js
export async function createPRWithReports({ owner, repo, token, reports, gates }) {
  const octokit = new Octokit({ auth: token });
  
  // Create PR branch
  const branchName = `publish/${Date.now()}`;
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'reports/summary.json',
    message: 'Add publish reports',
    content: Buffer.from(JSON.stringify({ reports, gates }, null, 2)).toString('base64'),
    branch: branchName
  });
  
  // Create PR
  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `FrameForge Publish ${new Date().toISOString()}`,
    head: branchName,
    base: 'main',
    body: generatePRBody(reports, gates)
  });
  
  return pr.data;
}

function generatePRBody(reports, gates) {
  return `
## FrameForge Publish Summary

### Quality Gates
- **Preflight**: ${gates.preflight}
- **Tests**: ${gates.tests}
- **Accessibility**: ${gates.a11y}
- **Lint/Build**: ${gates.lintBuild}
- **Risk Level**: ${gates.risk}

### Reports
- **Build**: ${reports.build?.summary?.totalErrors || 0} errors, ${reports.build?.summary?.totalWarnings || 0} warnings
- **A11y**: ${reports.a11y?.violations?.length || 0} violations
- **Tests**: ${reports.tests?.summary?.passed || 0} passed, ${reports.tests?.summary?.failed || 0} failed

### Artifacts
See attached reports in \`/reports/\` directory.
  `.trim();
}
```

### Acceptance Criteria
- [ ] Reports normalized to consistent schema
- [ ] PR creation includes gate status and report summaries
- [ ] All report files attached to PR
- [ ] Shell reads only normalized reports
- [ ] PR body includes comprehensive summary

---

## Implementation Timeline

### Phase 1 (Week 1-2): Critical Architecture
- **WF-1**: Component decomposition
- **WF-3**: State consolidation
- **WF-4**: Security fixes

### Phase 2 (Week 3-4): Performance & SDK
- **WF-5**: Performance optimization
- **WF-7**: Dynamic extension registry

### Phase 3 (Week 5-6): Publishing & Polish
- **WF-8**: PR integration
- **WF-2**: TypeScript migration (targeted)
- Testing & documentation

### Phase 4 (Week 7-8): QA & Release
- Comprehensive testing
- Performance validation
- Documentation updates
- v1.0 release preparation

## Success Metrics

### Code Quality
- [ ] No component > 300 LOC
- [ ] Cyclomatic complexity ≤ 10
- [ ] Test coverage ≥ 70% statements, 60% branches

### Performance
- [ ] Bundle size ≤ 1.2MB per chunk
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

### Security
- [ ] No tokens in localStorage
- [ ] Auto-approval gated by environment
- [ ] All mutations via proposal system

### Developer Experience
- [ ] Hot reload working
- [ ] TypeScript coverage for core modules
- [ ] Clear error messages and debugging

This roadmap provides a clear path to v1.0 with measurable outcomes and specific implementation guidance for each workflow.