import React, { useState, useEffect } from 'react';

export default function Inspector() {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [proposedChanges, setProposedChanges] = useState<any>({});

  const uiElements = [
    'Header',
    'Sidebar',
    'Main Canvas',
    'Toolbar',
    'Status Bar',
    'Components Panel'
  ];

  function addProposedChange(element: string, property: string, value: any) {
    setProposedChanges((prev: any) => ({
      ...prev,
      [element]: { ...prev[element], [property]: value }
    }));
  }

  function generateFullProposal() {
    const patches = [];

    // Convert proposed changes to RFC6902 patches
    for (const [element, changes] of Object.entries(proposedChanges)) {
      for (const [property, value] of Object.entries(changes as any)) {
        const path = `/elements/${element.toLowerCase().replace(' ', '-')}/${property}`;
        patches.push({ op: 'replace', path, value });
      }
    }

    if (patches.length === 0) {
      alert('No changes to propose!');
      return;
    }

    // Mock proposal creation - in real implementation this would integrate with kernel
    console.log('Generating UI proposal:', patches);

    alert(`Proposed UI changes (${patches.length} modifications):
${JSON.stringify(patches, null, 2)}

In real implementation, this would create a proposal with provenance '@frameforge/ext-ui' for approvals.`);

    setProposedChanges({});
  }

  return (
    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: '#F3F4F6', padding: '12px', fontSize: '14px', fontWeight: '600' }}>
        UI Inspector
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
            Select Element
          </label>
          <select
            value={selectedElement || ''}
            onChange={(e) => setSelectedElement(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="">Choose element...</option>
            {uiElements.map(element => (
              <option key={element} value={element}>{element}</option>
            ))}
          </select>
        </div>

        {selectedElement && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>{selectedElement} Properties</h4>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Background Color</label>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  onChange={(e) => addProposedChange(selectedElement, 'backgroundColor', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Text Color</label>
                <input
                  type="color"
                  defaultValue="#000000"
                  onChange={(e) => addProposedChange(selectedElement, 'color', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Border Radius (px)</label>
                <input
                  type="number"
                  defaultValue="0"
                  min="0"
                  max="20"
                  onChange={(e) => addProposedChange(selectedElement, 'borderRadius', `${e.target.value}px`)}
                  style={{ width: '100%', padding: '6px' }}
                />
              </div>
            </div>
          </div>
        )}

        {Object.keys(proposedChanges).length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#F0F9FF', borderRadius: '4px' }}>
            <h4 style={{ fontSize: '12px', margin: '0 0 8px 0', color: '#0369A1' }}>
              Pending Changes ({Object.keys(proposedChanges).length} elements)
            </h4>
            <div style={{ fontSize: '11px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '10px' }}>
                {JSON.stringify(proposedChanges, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '8px' }}>
          <button
            className="btn"
            onClick={generateFullProposal}
            disabled={Object.keys(proposedChanges).length === 0}
            style={{
              width: '100%',
              background: '#059669',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              color: 'white'
            }}
          >
            Generate UI Proposal
          </button>

          <p style={{ fontSize: '10px', color: '#6B7280', textAlign: 'center', margin: 0 }}>
            Proposals get provenance '@frameforge/ext-ui' and require approvals
          </p>
        </div>
      </div>
    </div>
  );
}
