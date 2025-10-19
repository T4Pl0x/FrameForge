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
  const kernel = useMemo(() => createKernel({ user, store: { initialSpec: { ui: loadInitialUi(), logic: { policies: { requireApproval: true } }, data: { rag: { indices: [] } }, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } }), []);
  useEffect(() => {
    try {
      const exts = registerExtensions(kernel);
      try { kernel.extensions = exts; } catch {}
    } catch {}
  }, [kernel]);
  useEffect(() => {
    try { window.__ff_kernel_api = createKernelApi(kernel); } catch {}
  }, [kernel]);
  // Only auto-approve when explicitly enabled via env
  useEffect(() => {
    const isDevAuto = import.meta?.env?.VITE_FF_DEV_AUTOAPPROVE === 'true' || false;

    const off = kernel.bus.on('proposal:submitted', async ({ id }) => {
      try {
        await kernel.proposals.preflight(id);
        if (isDevAuto) {
          await kernel.proposals.approve(id, { by: 'dev-auto', user });
          await kernel.proposals.apply(id, { user });
        }
      } catch (err) {
        console.error('Preflight/approval failed', err);
      }
    });
    return () => { try { off(); } catch {} };
  }, [kernel, user]);
  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}

export function useKernel() {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within KernelProvider');
  return ctx;
}
