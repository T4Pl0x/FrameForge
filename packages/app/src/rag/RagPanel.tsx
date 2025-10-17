import React, { useEffect, useMemo, useState } from 'react';

export function RagPanel() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read-only view of spec/data.json for RAG health
    async function loadData() {
      try {
        setLoading(true);
        // In a browser context, we'd load from the spec
        // For now, simulate loading spec data
        const mockData = {
          metadata: { lastIndexed: '2025-10-17T02:00:00Z' },
          indices: {
            documents: { status: '🟢', count: 1250 },
            components: { status: '🟢', count: 89 },
            patterns: { status: '🔴', count: 0 }
          }
        };
        setData(mockData);
      } catch (error) {
        console.error('Failed to load RAG data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const healthSummary = useMemo(() => {
    if (loading) return 'Loading...';

    const indices = data.indices || {};
    const total = Object.keys(indices).length;
    const online = Object.values(indices).filter((idx: any) => idx.status === '🟢').length;
    const red = Object.values(indices).filter((idx: any) => idx.status === '🔴').length;

    return `${online}/${total} healthy${red ? `, ${red} down` : ''}`;
  }, [data, loading]);

  const hasRedIndices = useMemo(() => {
    if (loading) return false;
    const indices = data.indices || {};
    return Object.values(indices).some((idx: any) => idx.status === '🔴');
  }, [data, loading]);

  return (
    <div className="text-sm">
      <div className="widget-title">RAG Health</div>
      <div className="muted" style={{marginBottom:8}}>{healthSummary}</div>

      {!loading && (
        <>
          <ul style={{display:'grid', gap:6, paddingLeft:16}}>
            {data.indices && Object.entries(data.indices).map(([name, info]: [string, any]) => (
              <li key={name} style={{opacity: info.status === '🔴' ? 0.6 : 1}}>
                {name} — {info.status} ({info.count} items)
              </li>
            ))}
          </ul>

          <div style={{marginTop: 16, padding: 12, border: '1px solid var(--panel-border)', borderRadius: 4}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
              <strong>RAG Attach Status</strong>
              {hasRedIndices ? (
                <span style={{color: '#ef4444', fontSize: '12px'}}>⚠️ Unhealthy</span>
              ) : (
                <span style={{color: '#22c55e', fontSize: '12px'}}>✅ Ready</span>
              )}
            </div>

            <p style={{fontSize: '12px', marginBottom: 12, opacity: 0.8}}>
              This read-only panel shows RAG index health from spec/data.json.
              Attachments are {hasRedIndices ? 'blocked' : 'available'} when all indices are healthy.
            </p>

            <button
              className="btn"
              disabled={hasRedIndices}
              style={{
                width: '100%',
                opacity: hasRedIndices ? 0.5 : 1,
                cursor: hasRedIndices ? 'not-allowed' : 'pointer'
              }}
            >
              {hasRedIndices ? 'Fix RAG Issues First' : 'RAG Attachment Available'}
            </button>
          </div>
        </>
      )}

      <div style={{marginTop: 12, fontSize: '11px', opacity: 0.6, textAlign: 'center'}}>
        Read-only health monitor • spec/data.json
      </div>
    </div>
  );
}
