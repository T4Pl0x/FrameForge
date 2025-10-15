import React from 'react';

export function Card(props) {
  const { node } = props;
  return (
    <div className="component card" style={{ padding: 12, borderRadius: node.props.radius ?? 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          background: '#0f1627',
          border: '1px solid #2b3856',
          borderRadius: 12
        }} />
        <div>
          <div style={{ fontWeight: 600 }}>{node.props.title || 'Card title'}</div>
          <div style={{ fontSize: 12, color: '#93a4c9' }}>{node.props.subtitle || 'Subtitle'}</div>
        </div>
      </div>
    </div>
  );
}

export function Grid(props) {
  const { node } = props;
  const columns = node.props.columns || 3;
  const rows = node.props.rows || 2;

  return (
    <div className="component" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: '8px',
      padding: '12px',
      border: '2px dashed #2b3856',
      borderRadius: '8px',
      minHeight: '100px'
    }}>
      {Array.from({ length: columns * rows }, (_, i) => (
        <div key={i} style={{
          background: '#0f1627',
          border: '1px solid #2b3856',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          Cell {i + 1}
        </div>
      ))}
    </div>
  );
}

export function Flex(props) {
  const { node } = props;
  return (
    <div className="component" style={{
      display: 'flex',
      flexDirection: node.props.direction || 'row',
      alignItems: node.props.alignItems || 'center',
      justifyContent: node.props.justifyContent || 'flex-start',
      gap: '8px',
      padding: '12px',
      border: '2px dashed #2b3856',
      borderRadius: '8px',
      minHeight: '60px'
    }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: '#0f1627',
          border: '1px solid #2b3856',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          Item {i}
        </div>
      ))}
    </div>
  );
}
