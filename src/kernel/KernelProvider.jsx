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
    try { registerExtensions(kernel); } catch {}
  }, [kernel]);
  useEffect(() => {
    try { window.__ff_kernel_api = createKernelApi(kernel); } catch {}
  }, [kernel]);
  // Dev auto-approve
  useEffect(() => {
    const isAuto = (() => {
      try {
        const envFlag = (import.meta && import.meta.env && import.meta.env.VITE_FF_DEV_AUTO_APPROVE) || '';
        const lc = (typeof localStorage !== 'undefined' && localStorage.getItem('FF_DEV_AUTO_APPROVE')) || '';
        return String(envFlag || lc).toLowerCase() === 'true';
      } catch { return false; }
    })();
    if (!isAuto) return;
    const off = kernel.bus.on('proposal:submitted', ({ id }) => {
      try { kernel.proposals.preflight(id); } catch {}
      try { kernel.proposals.approve(id, { by: 'dev-auto', user }); } catch {}
      try { kernel.proposals.apply(id, { user }); } catch {}
    });
    return () => { try { off(); } catch {} };
  }, [kernel]);
  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}

export function useKernel() {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within KernelProvider');
  return ctx;
}
