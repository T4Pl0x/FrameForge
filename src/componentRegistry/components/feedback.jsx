export function Alert(props) {
  const { node } = props;
  const types = {
    info: { bg: '#0f1627', border: '#6aa4ff', color: '#6aa4ff', icon: 'ℹ️' },
    success: { bg: '#0f1627', border: '#10b981', color: '#10b981', icon: '✅' },
    warning: { bg: '#0f1627', border: '#f59e0b', color: '#f59e0b', icon: '⚠️' },
    error: { bg: '#0f1627', border: '#ef4444', color: '#ef4444', icon: '❌' }
  };
  const style = types[node.props.type || 'info'];

  return (
    <div style={{
      padding: '12px 16px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '8px',
      color: style.color,
      fontSize: '13px'
    }}>
      <span style={{ marginRight: '8px' }}>{style.icon}</span>
      {node.props.message || 'This is an alert message'}
    </div>
  );
}

export function Tooltip(props) {
  const { node } = props;
  return (
    <div className="component" style={{ position: 'relative', display: 'inline-block' }}>
      <button style={{
        padding: '8px 16px',
        background: '#0f1627',
        border: '1px solid #2b3856',
        color: '#dbe4ff',
        borderRadius: '6px',
        cursor: 'pointer'
      }}>
        Hover me
      </button>
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1f2e',
        color: '#e2e8f0',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        opacity: 0.9,
        pointerEvents: 'none',
        zIndex: 10
      }}>
        {node.props.text || 'Tooltip text'}
      </div>
    </div>
  );
}

export function Modal(props) {
  const { node } = props;
  return (
    <div style={{
      position: 'relative',
      width: '300px',
      height: '200px',
      border: '2px dashed #2b3856',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      fontSize: '12px'
    }}>
      Modal: {node.props.title || 'Modal Title'}
    </div>
  );
}

export function Progress(props) {
  const { node } = props;
  const value = node.props.value || 75;
  const max = node.props.max || 100;
  const percentage = (value / max) * 100;

  return (
    <div className="component" style={{ width: '200px' }}>
      <div style={{
        width: '100%',
        height: '8px',
        background: '#2b3856',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: '#6aa4ff',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
        {value}/{max}
      </div>
    </div>
  );
}
