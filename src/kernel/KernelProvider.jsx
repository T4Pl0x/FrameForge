import React, { createContext, useMemo } from 'react';
import { Kernel } from '../../packages/kernel/src/index.mjs';

export const KernelContext = createContext(null);

export function KernelProvider({ children }){
  const kernel = useMemo(() => new Kernel({}), []);
  return (
    <KernelContext.Provider value={kernel}>
      {children}
    </KernelContext.Provider>
  );
}

