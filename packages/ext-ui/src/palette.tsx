import React, { useState, useEffect } from 'react';

export default function Palette() {
  const [uiSpec, setUiSpec] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUiSpec();
  }, []);

  async function loadUiSpec() {
    try {
      setLoading(true);
      // In production, this would load from spec/ui.json
      // For now, use mock data
      const mockSpec = {
        themes: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        layouts: {
          sidebar: { width: 280 },
          header: { height: 64 }
        }
      };
      setUiSpec(mockSpec);
    } catch (error) {
      console.error('Failed to load UI spec:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateProposal(changes: any) {
    // This would integrate with kernel.proposals.propose() in the real implementation
    console.log('Generating UI proposal:', changes);

    // Mock proposal creation - in real implementation this would call:
    // kernel.proposals.propose({
    //   target: 'spec/ui.json',
    //   patch: changes,
    //   rationale: 'UI spec updates from palette',
    //   provenance: 'ext-ui'
    // });

    alert(`Proposed UI changes: ${JSON.stringify(changes, null, 2)}\n\nIn real implementation, this would create a proposal for approvals.`);
  }

  if (loading) {
    return <div style={{ padding: '16px' }}>Loading palette...</div>;
  }

  return (
    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: '#F3F4F6', padding: '12px', fontSize: '14px', fontWeight: '600' }}>
        Color Palette
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {uiSpec.themes && Object.entries(uiSpec.themes).map(([name, color]: [string, any]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: color,
                  borderRadius: '4px',
                  border: '1px solid #D1D5DB'
                }}
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' }}>
                  {name}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>{color}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
          <button
            className="btn"
            onClick={() => generateProposal({ themes: { accent: '#8B5CF6' } })}
            style={{ width: '100%', background: '#8B5CF6', border: 'none', padding: '8px' }}
          >
            Propose Color Change
          </button>

          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', textAlign: 'center' }}>
            Changes create proposals, not direct writes
          </p>
        </div>
      </div>
    </div>
  );
}
