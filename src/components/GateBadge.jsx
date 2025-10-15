import React from 'react';

export default function GateBadge({ label, state, tooltip }) {
  const color = state === 'pass' ? '#DCFCE7' : state === 'fail' ? '#FEE2E2' : '#E5E7EB';
  const text = state === 'pass' ? '#166534' : state === 'fail' ? '#991B1B' : '#374151';
  const title = state === 'unknown' ? `${label}: unknown — artifact missing or unreadable` : tooltip;
  return (
    <span className="gate-badge" title={title} style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: color, color: text, border: '1px solid rgba(0,0,0,0.05)' }}>
      {label}: {state}
    </span>
  );
}

