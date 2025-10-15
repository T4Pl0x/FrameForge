import React, { useState } from 'react';

export default function OverrideForm({ defaultScope, onSubmit }) {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16);
    return iso;
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ scope: defaultScope, reason, expires_at: new Date(expiresAt).toISOString() }); }} className="ff-override-form" style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 12 }}>Reason</label>
      <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
      <label style={{ fontSize: 12 }}>Expires (UTC)</label>
      <input type="datetime-local" required value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit">Apply with Override</button>
      </div>
    </form>
  );
}

