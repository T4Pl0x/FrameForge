import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createKernel } from '@frameforge/kernel';
import { registerExtensions } from '../extensionHost.js';

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
  const kernel = useMemo(() => createKernel({ store: { initialSpec: { ui: loadInitialUi(), logic: { policies: { requireApproval: true } }, data: { rag: { indices: [] } }, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } }), []);
  useEffect(() => {
    try { registerExtensions(kernel); } catch {}
  }, [kernel]);
  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}

export function useKernel() {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within KernelProvider');
  return ctx;
}
