import React from 'react';

export function Tabs(props) {
  const { node } = props;
  const tabs = node.props.tabs || ['Tab 1', 'Tab 2', 'Tab 3'];
  const active = node.props.active || 0;

  return (
    <div className="component">
      <div style={{ display: 'flex', borderBottom: '1px solid #2b3856' }}>
        {tabs.map((tab, index) => (
          <div key={index} style={{
            padding: '8px 16px',
            borderBottom: index === active ? '2px solid #6aa4ff' : '2px solid transparent',
            color: index === active ? '#6aa4ff' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            {tab}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px', color: '#dbe4ff', fontSize: '12px' }}>
        Tab {active + 1} content
      </div>
    </div>
  );
}

export function Breadcrumb(props) {
  const { node } = props;
  const items = node.props.items || ['Home', 'Products', 'Details'];

  return (
    <div className="component" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span style={{ color: '#6b7280' }}>›</span>}
          <span style={{
            color: index === items.length - 1 ? '#6aa4ff' : '#94a3b8',
            fontSize: '12px'
          }}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function Pagination(props) {
  const { node } = props;
  const current = node.props.current || 1;
  const total = node.props.total || 10;

  return (
    <div className="component" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px' }}>
      <button style={{ padding: '4px 8px', background: '#0f1627', border: '1px solid #2b3856', color: '#94a3b8', borderRadius: '4px' }}>‹</button>
      {Array.from({ length: Math.min(5, total) }, (_, i) => {
        const page = i + 1;
        return (
          <button key={page} style={{
            padding: '4px 8px',
            background: page === current ? '#6aa4ff' : '#0f1627',
            border: '1px solid #2b3856',
            color: page === current ? 'white' : '#94a3b8',
            borderRadius: '4px'
          }}>
            {page}
          </button>
        );
      })}
      <button style={{ padding: '4px 8px', background: '#0f1627', border: '1px solid #2b3856', color: '#94a3b8', borderRadius: '4px' }}>›</button>
    </div>
  );
}
