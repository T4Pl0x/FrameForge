import React, { useState } from 'react';
import AgentPanel from './AgentPanel.jsx';

export default function AgentsEntry() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 1100, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setOpen(true)} style={{
          background: '#111827', color: 'white', border: '1px solid #111827', borderRadius: 6, padding: '8px 12px', fontSize: 12
        }}>
          Agents
        </button>
      </div>
      <AgentPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

