# FrameForge v1.0 Implementation Snippets

This document contains ready-to-use code snippets for the highest-impact fixes identified in the roadmap.

---

## A. Environment-Gated Auto-Approval

### File: `src/kernel/KernelProvider.jsx`

```javascript
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createKernel } from '@frameforge/kernel';
import { registerExtensions } from '../extensionHost.js';
import { createKernelApi } from '../../packages/kernel/src/api.js';

const KernelContext = createContext(null);

function loadInitialUi() {
  if (typeof window === 'undefined') return { screens: [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }], frames: [] };
  try {
    const raw = window.localStorage.getItem('frameforge-doc');
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.frames)) {
      const screens = Array.isArray(parsed.screens) && parsed.screens.length > 0
        ? parsed.screens
        : [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }];
      return { screens, frames: parsed.frames };
    }
  } catch {}
  return { screens: [{ id: 'screen-main', name: 'Main', order: 0, isDefault: true }], frames: [] };
}

export function KernelProvider({ children }) {
  const user = (() => {
    try {
      const id = (typeof localStorage !== 'undefined' && localStorage.getItem('frameforge-user-id')) || 'u_dev';
      const role = (typeof localStorage !== 'undefined' && localStorage.getItem('frameforge-user-role')) || 'owner';
      return { id, roles: [role] };
    } catch { return { id: 'u_dev', roles: ['owner'] }; }
  })();
  
  const kernel = useMemo(() => createKernel({ 
    user, 
    store: { initialSpec: { ui: loadInitialUi(), logic: { policies: { requireApproval: true } }, data: { rag: { indices: [] } }, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } 
  }), []);

  useEffect(() => {
    try {
      const exts = registerExtensions(kernel);
      try { kernel.extensions = exts; } catch {}
    } catch {}
  }, [kernel]);

  useEffect(() => {
    try { window.__ff_kernel_api = createKernelApi(kernel); } catch {}
  }, [kernel]);

  // Only auto-approve in explicit dev mode
  const isDevAuto = import.meta?.env?.VITE_FF_DEV_AUTOAPPROVE === 'true';

  useEffect(() => {
    if (!isDevAuto) return; // Skip if not in dev auto-approval mode
    
    const off = kernel.bus.on('proposal:submitted', async ({ id }) => {
      try {
        await kernel.proposals.preflight(id);
        if (isDevAuto) {
          await kernel.proposals.approve(id, { by: 'dev-auto', user });
          await kernel.proposals.apply(id, { user });
        }
      } catch (e) {
        console.error('Preflight/approval failed', e);
      }
    });
    return () => { try { off(); } catch {} };
  }, [kernel, isDevAuto, user]);

  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}

export function useKernel() {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within KernelProvider');
  return ctx;
}
```

### Contract Test: `tests/kernel/auto-approval.test.js`

```javascript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createKernel } from '@frameforge/kernel';

describe('Kernel Auto-Approval', () => {
  let kernel;
  
  beforeEach(() => {
    kernel = createKernel({ 
      user: { id: 'test-user', roles: ['owner'] },
      store: { initialSpec: { ui: { screens: [], frames: [] } } }
    });
  });

  afterEach(() => {
    if (kernel) kernel.destroy?.();
  });

  test('auto-approval disabled in production', async () => {
    const originalEnv = import.meta.env.VITE_FF_DEV_AUTOAPPROVE;
    import.meta.env.VITE_FF_DEV_AUTOAPPROVE = undefined;
    
    const proposalId = await kernel.proposals.propose({
      target: '/ui',
      patch: [{ op: 'add', path: '/frames/-', value: { id: 'test-frame' } }],
      rationale: 'Test proposal'
    });
    
    // Should remain pending without explicit approval
    const status = await kernel.proposals.getStatus(proposalId);
    expect(status).toBe('pending');
    
    import.meta.env.VITE_FF_DEV_AUTOAPPROVE = originalEnv;
  });

  test('auto-approval enabled in dev mode', async () => {
    const originalEnv = import.meta.env.VITE_FF_DEV_AUTOAPPROVE;
    import.meta.env.VITE_FF_DEV_AUTOAPPROVE = 'true';
    
    const proposalId = await kernel.proposals.propose({
      target: '/ui',
      patch: [{ op: 'add', path: '/frames/-', value: { id: 'test-frame' } }],
      rationale: 'Test proposal'
    });
    
    // Wait a tick for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should be auto-approved and applied
    const status = await kernel.proposals.getStatus(proposalId);
    expect(status).toBe('applied');
    
    import.meta.env.VITE_FF_DEV_AUTOAPPROVE = originalEnv;
  });
});
```

---

## B. Dynamic Extension + View Registry

### File: `src/os/registry/extensionRegistry.ts`

```typescript
export type ExtensionEntry = {
  id: string;
  name: string;
  icon?: string;
  version: string;
  description?: string;
  activate: (kernel: any) => { 
    routes?: Record<string, React.ReactNode>, 
    commands?: any[],
    menus?: any[]
  };
  deactivate?: () => void;
};

const _extensions: Record<string, ExtensionEntry> = {};

export function registerExtension(ext: ExtensionEntry) {
  if (_extensions[ext.id]) {
    console.warn(`Extension ${ext.id} already registered, overwriting`);
  }
  _extensions[ext.id] = ext;
  console.log(`Extension registered: ${ext.name} v${ext.version}`);
}

export function unregisterExtension(id: string) {
  const ext = _extensions[id];
  if (ext) {
    ext.deactivate?.();
    delete _extensions[id];
    console.log(`Extension unregistered: ${ext.name}`);
  }
}

export function listExtensions() {
  return Object.values(_extensions);
}

export function getExtension(id: string) {
  return _extensions[id];
}

export function hasExtension(id: string) {
  return id in _extensions;
}
```

### File: `src/os/registry/viewRegistry.ts`

```typescript
import React from 'react';

type ViewEntry = {
  component: React.ReactNode;
  title?: string;
  icon?: string;
  description?: string;
  category?: string;
};

const _views: Record<string, ViewEntry> = {};

export function registerView(key: string, entry: ViewEntry) {
  if (_views[key]) {
    console.warn(`View ${key} already registered, overwriting`);
  }
  _views[key] = entry;
  console.log(`View registered: ${key}`);
}

export function unregisterView(key: string) {
  if (_views[key]) {
    delete _views[key];
    console.log(`View unregistered: ${key}`);
  }
}

export function getViews() {
  return { ..._views }; // Return copy to prevent mutation
}

export function getView(key: string) {
  return _views[key];
}

export function hasView(key: string) {
  return key in _views;
}

export function getViewsByCategory(category: string) {
  return Object.entries(_views)
    .filter(([, entry]) => entry.category === category)
    .reduce((acc, [key, entry]) => {
      acc[key] = entry;
      return acc;
    }, {} as Record<string, ViewEntry>);
}
```

### Updated File: `src/os/Shell.jsx`

```javascript
import React, { useEffect, useMemo, useState } from 'react';
import { getViews } from './registry/viewRegistry';
import { listExtensions } from './registry/extensionRegistry';
import StatusBar from './StatusBar.jsx';
import AgentsEntry from '../components/AgentsEntry.jsx';
import ProposalsEntry from '../components/ProposalsEntry.jsx';
import RunHistoryPanel from '../components/RunHistoryPanel.jsx';
import Toasts from '../components/Toasts.jsx';
import GhostLayer from '../components/GhostLayer.jsx';
import ToolsOverlay from '../components/ToolsOverlay.jsx';

function Dock({ active, onSelect, items }) {
  return (
    <div style={{ 
      width: 72, 
      background: '#1f2937', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '12px 0',
      gap: 8
    }}>
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: active === item.key ? '#3b82f6' : '#374151',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}
          title={item.label}
        >
          {item.icon || item.label[0]}
        </button>
      ))}
    </div>
  );
}

export default function Shell() {
  const [active, setActive] = useState('ui');
  const [toolsOpen, setToolsOpen] = useState(false);
  
  const views = useMemo(() => getViews(), []);
  const extensions = useMemo(() => listExtensions(), []);
  
  const dockItems = useMemo(() => [
    { key: 'ui', label: 'UI', icon: '🎨' },
    { key: 'promptlab', label: 'Prompt Lab', icon: '🧪' },
    { key: 'compiler', label: 'Compiler', icon: '⚙️' },
    { key: 'sandbox', label: 'Sandbox', icon: '🛡️' },
    { key: 'publish', label: 'Publish', icon: '🚀' },
    ...extensions.map(ext => ({ 
      key: ext.id, 
      label: ext.name, 
      icon: ext.icon || '📦' 
    }))
  ], [extensions]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && ['1','2','3','4','5'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const item = dockItems[idx];
        if (item) setActive(item.key);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'p')) {
        window.dispatchEvent(new CustomEvent('ff:proposals:toggle'));
      }
      if (e.altKey && (e.key.toLowerCase() === 'j')) {
        window.dispatchEvent(new CustomEvent('ff:agents:toggle'));
      }
      if (e.altKey && (e.key.toLowerCase() === 't')) {
        window.dispatchEvent(new CustomEvent('ff:tools:toggle'));
      }
    };
    
    const onToolsToggle = () => setToolsOpen((v) => !v);
    
    window.addEventListener('keydown', onKey);
    window.addEventListener('ff:tools:toggle', onToolsToggle);
    
    return () => { 
      window.removeEventListener('keydown', onKey); 
      window.removeEventListener('ff:tools:toggle', onToolsToggle); 
    };
  }, [dockItems]);

  const activeView = views[active]?.component || (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      color: '#6b7280'
    }}>
      View '{active}' not found
    </div>
  );

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      display: 'grid', 
      gridTemplateColumns: '72px 1fr', 
      gridTemplateRows: '1fr 36px', 
      background: '#fff' 
    }}>
      <Dock active={active} onSelect={setActive} items={dockItems} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {activeView}
      </div>
      <div style={{ gridColumn: '1 / span 2' }}>
        <StatusBar />
      </div>
      
      {/* Overlays */}
      <AgentsEntry />
      <ProposalsEntry />
      <RunHistoryPanel />
      <Toasts />
      <GhostLayer />
      {toolsOpen && <ToolsOverlay onClose={() => setToolsOpen(false)} />}
    </div>
  );
}
```

---

## C. Proposal Micro-Queue (Debounce/Batch)

### File: `src/kernel/proposalQueue.ts`

```typescript
interface ProposalQueue {
  enqueue: (id: string, kernel: any) => void;
  flush: () => Promise<void>;
  clear: () => void;
  size: () => number;
}

export function createProposalQueue(): ProposalQueue {
  const queue: string[] = [];
  let ticking = false;
  let kernel: any = null;

  const processQueue = async () => {
    if (!kernel || queue.length === 0) return;
    
    ticking = true;
    const proposalsToProcess = queue.splice(0, queue.length);
    
    try {
      // Preflight all proposals sequentially
      for (const proposalId of proposalsToProcess) {
        try {
          await kernel.proposals.preflight(proposalId);
        } catch (error) {
          console.error(`Preflight failed for proposal ${proposalId}:`, error);
          // Continue with other proposals even if one fails
        }
      }
      
      // Check if auto-approval is enabled
      const isDevAuto = import.meta?.env?.VITE_FF_DEV_AUTOAPPROVE === 'true';
      
      if (isDevAuto) {
        // Batch approve and apply
        for (const proposalId of proposalsToProcess) {
          try {
            await kernel.proposals.approve(proposalId, { by: 'dev-auto-batch', user: { id: 'system' } });
            await kernel.proposals.apply(proposalId, { user: { id: 'system' } });
          } catch (error) {
            console.error(`Apply failed for proposal ${proposalId}:`, error);
          }
        }
      }
    } finally {
      ticking = false;
    }
  };

  return {
    enqueue: (id: string, k: any) => {
      kernel = k;
      queue.push(id);
      
      if (!ticking) {
        // Use queueMicrotask for non-blocking processing
        queueMicrotask(processQueue);
      }
    },
    
    flush: async () => {
      if (queue.length > 0) {
        await processQueue();
      }
    },
    
    clear: () => {
      queue.length = 0;
      ticking = false;
    },
    
    size: () => queue.length
  };
}

// Global queue instance
export const proposalQueue = createProposalQueue();
```

### Integration in KernelProvider:

```javascript
// Add to KernelProvider.jsx
import { proposalQueue } from '../kernel/proposalQueue';

// Replace the existing proposal handler
useEffect(() => {
  const isDevAuto = import.meta?.env?.VITE_FF_DEV_AUTOAPPROVE === 'true';
  
  const off = kernel.bus.on('proposal:submitted', ({ id }) => {
    // Enqueue for batch processing instead of immediate processing
    proposalQueue.enqueue(id, kernel);
  });
  
  return () => { try { off(); } catch {} };
}, [kernel, isDevAuto]);
```

---

## D. Secure Token Storage

### File: `src/security/tokenStore.ts`

```typescript
interface TokenData {
  token: string;
  timestamp: number;
  payload: Uint8Array;
}

const KEY = 'ff.tokens.v1';
const SALT = 'ff-os'; // Replace with build-time secret if possible
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 hours

function generatePayload(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

function encodeToken(token: string, timestamp: number, payload: Uint8Array): string {
  const data = token + '|' + timestamp + '|' + Array.from(payload).join('.');
  return btoa(unescape(encodeURIComponent(data)));
}

function decodeToken(encoded: string): { token: string; timestamp: number; payload: Uint8Array } | null {
  try {
    const data = decodeURIComponent(escape(atob(encoded)));
    const [token, timestampStr, payloadStr] = data.split('|');
    
    if (!token || !timestampStr || !payloadStr) return null;
    
    const payloadArray = payloadStr.split('.').map(Number);
    if (payloadArray.some(isNaN)) return null;
    
    return {
      token,
      timestamp: parseInt(timestampStr, 10),
      payload: new Uint8Array(payloadArray)
    };
  } catch {
    return null;
  }
}

export function saveToken(name: 'openrouter' | 'github', token: string): void {
  try {
    const payload = generatePayload();
    const timestamp = Date.now();
    const encoded = encodeToken(token, timestamp, payload);
    const blob = `${name}:${encoded}`;
    
    // Use sessionStorage for session-only storage
    sessionStorage.setItem(KEY, blob);
    
    console.log(`Token saved for ${name}`);
  } catch (error) {
    console.error('Failed to save token:', error);
    throw new Error('Token storage failed');
  }
}

export function loadToken(name: 'openrouter' | 'github'): string | null {
  try {
    const blob = sessionStorage.getItem(KEY);
    if (!blob?.startsWith(name + ':')) return null;
    
    const [, encoded] = blob.split(':');
    const decoded = decodeToken(encoded);
    
    if (!decoded) return null;
    
    // Check expiration
    if (Date.now() - decoded.timestamp > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    
    return decoded.token;
  } catch (error) {
    console.error('Failed to load token:', error);
    return null;
  }
}

export function removeToken(name: 'openrouter' | 'github'): void {
  try {
    const blob = sessionStorage.getItem(KEY);
    if (blob?.startsWith(name + ':')) {
      sessionStorage.removeItem(KEY);
    }
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

export function clearAllTokens(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

export function getTokenInfo(name: 'openrouter' | 'github'): { exists: boolean; expired: boolean } | null {
  try {
    const blob = sessionStorage.getItem(KEY);
    if (!blob?.startsWith(name + ':')) return null;
    
    const [, encoded] = blob.split(':');
    const decoded = decodeToken(encoded);
    
    if (!decoded) return null;
    
    const expired = Date.now() - decoded.timestamp > MAX_AGE_MS;
    
    return { exists: true, expired };
  } catch {
    return null;
  }
}
```

### Settings UI Component:

```jsx
// src/components/TokenSettings.jsx
import React, { useState, useEffect } from 'react';
import { saveToken, loadToken, removeToken, getTokenInfo } from '../security/tokenStore';

export default function TokenSettings() {
  const [openrouterToken, setOpenrouterToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    // Load existing tokens (masked)
    const orInfo = getTokenInfo('openrouter');
    const ghInfo = getTokenInfo('github');
    
    if (orInfo?.exists && !orInfo.expired) {
      setOpenrouterToken('••••••••••••••••');
    }
    if (ghInfo?.exists && !ghInfo.expired) {
      setGithubToken('••••••••••••••••');
    }
  }, []);

  const handleSaveToken = (type: 'openrouter' | 'github', value: string) => {
    if (!value || value.startsWith('••••')) return;
    
    try {
      saveToken(type, value);
      if (type === 'openrouter') {
        setOpenrouterToken('••••••••••••••••');
      } else {
        setGithubToken('••••••••••••••••');
      }
      alert(`${type} token saved successfully`);
    } catch (error) {
      alert(`Failed to save ${type} token`);
    }
  };

  const handleRemoveToken = (type: 'openrouter' | 'github') => {
    removeToken(type);
    if (type === 'openrouter') {
      setOpenrouterToken('');
    } else {
      setGithubToken('');
    }
  };

  return (
    <div className="token-settings">
      <h3>API Token Settings</h3>
      
      <div className="token-field">
        <label>OpenRouter API Token:</label>
        <input
          type={showTokens ? 'text' : 'password'}
          value={openrouterToken}
          onChange={(e) => setOpenrouterToken(e.target.value)}
          placeholder="Enter OpenRouter API token"
        />
        <div className="token-actions">
          <button onClick={() => handleSaveToken('openrouter', openrouterToken)}>
            Save
          </button>
          <button onClick={() => handleRemoveToken('openrouter')}>
            Remove
          </button>
        </div>
      </div>

      <div className="token-field">
        <label>GitHub Personal Access Token:</label>
        <input
          type={showTokens ? 'text' : 'password'}
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="Enter GitHub token"
        />
        <div className="token-actions">
          <button onClick={() => handleSaveToken('github', githubToken)}>
            Save
          </button>
          <button onClick={() => handleRemoveToken('github')}>
            Remove
          </button>
        </div>
      </div>

      <label>
        <input
          type="checkbox"
          checked={showTokens}
          onChange={(e) => setShowTokens(e.target.checked)}
        />
        Show tokens (be careful!)
      </label>

      <p className="token-help">
        Tokens are stored in browser session and expire after 12 hours for security.
      </p>
    </div>
  );
}
```

---

## E. Performance Optimizations

### Memoization Hook:

```jsx
// src/hooks/useMemoizedFrames.js
import { useMemo } from 'react';

export function useMemoizedFrames(doc, activeScreenId, screens) {
  return useMemo(() => {
    const screenId = activeScreenId || screens[0]?.id || 'screen-main';
    return doc.frames.filter(frame => 
      (frame.screenId || 'screen-main') === screenId
    );
  }, [doc.frames, activeScreenId, screens]);
}

export function useMemoizedFrameStats(frames) {
  return useMemo(() => ({
    total: frames.length,
    withChanges: frames.filter(f => f.changeFlags).length,
    modals: frames.filter(f => f.kind === 'modal').length,
    minimized: frames.filter(f => f.minimized).length
  }), [frames]);
}
```

### Lazy Loading Panel:

```jsx
// src/app/panels/MermaidPanel.jsx
import React, { Suspense, lazy } from 'react';

const MermaidCanvas = lazy(() => import('../../components/MermaidCanvas'));

export default function MermaidPanel({ state, dispatch }) {
  const { mermaidDefinition, isLoadingMermaid } = state;

  if (isLoadingMermaid) {
    return (
      <div className="panel loading">
        <div className="spinner"></div>
        <p>Loading diagram editor...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="panel loading">
        <div className="spinner"></div>
        <p>Loading Mermaid...</p>
      </div>
    }>
      <MermaidCanvas 
        definition={mermaidDefinition}
        onChange={(def) => dispatch({ type: 'SET_MERMAID_DEFINITION', payload: def })}
      />
    </Suspense>
  );
}
```

### Optimized Frame Component:

```jsx
// src/components/Frame.jsx (optimized version)
import React, { memo, useMemo, useCallback } from 'react';
import { ContrastBadge } from '../inspector/ContrastBadge';
import PropTypes from 'prop-types';

const Frame = memo(({
  frame,
  rootEl,
  isSelected,
  selectedNodeId,
  onFrameMouseDown,
  onResizeMouseDown,
  onComponentMouseDown,
  onShowMenu,
  onUpdateFrame,
  onUpdateNode,
  onShowComponentMenu,
  // ... other props
}) => {
  // Memoize expensive calculations
  const frameStyle = useMemo(() => ({
    position: 'absolute',
    left: frame.x,
    top: frame.y,
    width: frame.minimized ? 180 : frame.width,
    height: frame.minimized ? 32 : frame.height,
    background: frame.background || (frame.kind === 'modal' ? 'rgba(255,255,255,0.98)' : 'white'),
    borderRadius: 0,
    border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
    overflow: 'hidden',
    cursor: 'move',
    boxShadow: frame.kind === 'modal' ? '0 12px 28px rgba(15,23,42,0.25)' : (frame.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'),
    zIndex: frame.kind === 'modal' ? 20 : 1,
  }), [frame.x, frame.y, frame.width, frame.height, frame.background, frame.kind, frame.minimized, frame.shadow, isSelected]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleFrameMouseDown = useCallback((event) => {
    onFrameMouseDown(event, frame.id, frame);
  }, [onFrameMouseDown, frame.id, frame]);

  const handleResizeMouseDown = useCallback((event) => {
    onResizeMouseDown(event, frame.id, frame);
  }, [onResizeMouseDown, frame.id, frame]);

  const handleShowMenu = useCallback((event) => {
    onShowMenu(event, frame.id);
  }, [onShowMenu, frame.id]);

  // Memoize nodes to prevent unnecessary re-renders
  const renderedNodes = useMemo(() => {
    return frame.nodes.map((node) => (
      <FrameNode
        key={node.id}
        node={node}
        frameId={frame.id}
        selectedNodeId={selectedNodeId}
        onComponentMouseDown={onComponentMouseDown}
        onUpdateNode={onUpdateNode}
        onShowComponentMenu={onShowComponentMenu}
      />
    ));
  }, [frame.nodes, frame.id, selectedNodeId, onComponentMouseDown, onUpdateNode, onShowComponentMenu]);

  return (
    <div
      className={`frame ${isSelected ? 'selected' : ''} ${frame.kind === 'modal' ? 'frame--modal' : ''} ${frame.minimized ? 'frame--minimized' : ''}`}
      style={frameStyle}
      onMouseDown={handleFrameMouseDown}
    >
      <FrameHeader
        frame={frame}
        isSelected={isSelected}
        onShowMenu={handleShowMenu}
        onUpdateFrame={onUpdateFrame}
        onDeleteFrame={onDeleteFrame}
      />
      
      {!frame.minimized && (
        <div className="frame-content">
          {renderedNodes}
        </div>
      )}
      
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.frame.id === nextProps.frame.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedNodeId === nextProps.selectedNodeId &&
    prevProps.frame.x === nextProps.frame.x &&
    prevProps.frame.y === nextProps.frame.y &&
    prevProps.frame.width === nextProps.frame.width &&
    prevProps.frame.height === nextProps.frame.height &&
    prevProps.frame.minimized === nextProps.frame.minimized
  );
});

Frame.propTypes = {
  frame: PropTypes.object.isRequired,
  rootEl: PropTypes.any,
  isSelected: PropTypes.bool.isRequired,
  selectedNodeId: PropTypes.string,
  onFrameMouseDown: PropTypes.func.isRequired,
  onResizeMouseDown: PropTypes.func.isRequired,
  onComponentMouseDown: PropTypes.func.isRequired,
  onShowMenu: PropTypes.func.isRequired,
  onUpdateFrame: PropTypes.func,
  onUpdateNode: PropTypes.func.isRequired,
  onShowComponentMenu: PropTypes.func.isRequired,
  onDeleteFrame: PropTypes.func.isRequired,
};

export default Frame;
```

### Updated Vite Config:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@frameforge/kernel': fileURLToPath(new URL('./packages/kernel/src/index.js', import.meta.url)),
      '@': resolve(__dirname, 'src'),
      'packages': resolve(__dirname, 'packages'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200, // Realistic limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('mermaid')) {
            return 'mermaid';
          }
          if (id.includes('katex')) {
            return 'katex';
          }
          if (id.includes('reactflow')) {
            return 'reactflow';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Split large components
          if (id.includes('panels/')) {
            return 'panels';
          }
          if (id.includes('components/')) {
            return 'components';
          }
        },
      },
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Enable source maps for debugging
  sourcemap: true,
});
```

These snippets provide immediate, high-impact improvements that can be implemented incrementally without breaking existing functionality.