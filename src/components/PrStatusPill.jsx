import React, { useEffect, useState } from 'react';
import { startGatesTap, subscribeGates, getGatesInfo } from '../state/gates.js';

export default function PrStatusPill() {
  const [st, setSt] = useState(() => getGatesInfo());
  useEffect(() => { startGatesTap(); const off = subscribeGates(setSt); return () => off?.(); }, []);
  const status = st?.info?.status || 'unknown';
  const hint = st?.info?.firstHint;
  const link = st?.info?.prUrl || st?.info?.reportsUrl || st?.info?.dashboardUrl;
  const color = status === 'green' ? '#10B981' : status === 'red' ? '#EF4444' : '#6B7280';
  const bg = status === 'green' ? '#ECFDF5' : status === 'red' ? '#FEF2F2' : '#F3F4F6';
  const label = status === 'green' ? 'Checks Passing' : status === 'red' ? 'Checks Failing' : 'Checks Unknown';
  const prNum = (() => {
    try {
      const u = new URL(link);
      const parts = u.pathname.split('/');
      const n = parts.includes('pull') ? parts[parts.indexOf('pull') + 1] : '';
      return n && /^\d+$/.test(n) ? ` #${n}` : '';
    } catch { return ''; }
  })();
  const title = [label, prNum ? `PR${prNum}` : null, hint ? `Hint: ${hint}` : null].filter(Boolean).join(' | ');
  const pill = (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color, background: bg, border: `1px solid ${color}22`, padding: '2px 8px', borderRadius: 9999 }}>
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: color }} />
      {label}{prNum}
    </span>
  );
  if (link) return (<a href={link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{pill}</a>);
  return pill;
}
