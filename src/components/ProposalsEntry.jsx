import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../kernel/KernelProvider.jsx';
import ProposalsDrawer from './ProposalsDrawer.jsx';

export default function ProposalsEntry() {
  const kernel = useKernel();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onToggle = () => setOpen(v => !v);
    window.addEventListener('ff:proposals:toggle', onToggle);
    return () => window.removeEventListener('ff:proposals:toggle', onToggle);
  }, []);
  const count = useMemo(() => {
    try {
      const arr = kernel.proposals.list ? kernel.proposals.list() : [];
      return arr.filter((p) => p.status === 'submitted' || p.status === 'ready').length;
    } catch { return 0; }
  }, [kernel]);
  return (
    <>
      <div style={{ position: 'fixed', left: 90, bottom: 12, zIndex: 1100, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setOpen(true)} style={{
          background: '#111827', color: 'white', border: '1px solid #111827', borderRadius: 6, padding: '8px 12px', fontSize: 12
        }}>
          Proposals{count ? ` (${count})` : ''}
        </button>
      </div>
      <ProposalsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
