import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createKernel } from '@frameforge/kernel';
import { registerExtensions } from '../extensionHost.js';

const KernelContext = createContext(null);

export function KernelProvider({ children }) {
  const kernel = useMemo(() => createKernel({ store: { initialSpec: { ui: {}, logic: {}, data: {}, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } }), []);
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
