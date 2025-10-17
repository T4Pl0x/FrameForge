import React, { useState, useEffect } from 'react';
import Palette from './palette';
import Inspector from './inspector';

export default function ExtUI() {
  return (
    <div className="text-sm" style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>UI Tools</h2>
        <p style={{ margin: 4, fontSize: 12, color: '#6B7280' }}>
          Edit spec/ui.json changes with proposal flow (no direct writes)
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', height: 'calc(100% - 80px)' }}>
        <div style={{ flex: '1 0 300px' }}>
          <Palette />
        </div>

        <div style={{ flex: '1 0 400px' }}>
          <Inspector />
        </div>
      </div>
    </div>
  );
}
