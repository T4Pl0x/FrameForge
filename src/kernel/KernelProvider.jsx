import React, { createContext, useContext, useMemo } from 'react';
import { createKernel } from '@frameforge/kernel';

const KernelContext = createContext(null);

export function KernelProvider({ children }) {
  const kernel = useMemo(() => createKernel({ store: { initialSpec: { ui: {}, logic: {}, data: {}, theme: {}, overlays: {}, tests: {}, meta: {}, analysis: {} } } }), []);
  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
}

export function useKernel() {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within KernelProvider');
  return ctx;
}

