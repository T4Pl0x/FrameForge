export function Avatar(props) {
  const { node } = props;
  const size = node.props.size || 'md';
  const sizes = { sm: 32, md: 40, lg: 48, xl: 64 };
  const dimension = sizes[size] || 40;

  return (
    <div className="component" style={{
      width: dimension,
      height: dimension,
      borderRadius: '50%',
      background: '#6aa4ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: dimension * 0.4,
      fontWeight: '600'
    }}>
      {node.props.initials || 'JD'}
    </div>
  );
}

export function Badge(props) {
  const { node } = props;
  const variants = {
    primary: { bg: '#6aa4ff', color: 'white' },
    secondary: { bg: '#6b7280', color: 'white' },
    success: { bg: '#10b981', color: 'white' },
    warning: { bg: '#f59e0b', color: 'white' },
    error: { bg: '#ef4444', color: 'white' }
  };
  const style = variants[node.props.variant || 'primary'];

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: style.bg,
      color: style.color,
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500'
    }}>
      {node.props.text || 'Badge'}
    </span>
  );
}

export function Chip(props) {
  const { node } = props;
  const variants = {
    filled: { bg: '#6aa4ff', color: 'white', border: 'none' },
    outlined: { bg: 'transparent', color: '#6aa4ff', border: '1px solid #6aa4ff' }
  };
  const style = variants[node.props.variant || 'outlined'];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      background: style.bg,
      color: style.color,
      border: style.border,
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500'
    }}>
      {node.props.text || 'Chip'}
    </span>
  );
}

export function List(props) {
  const { node } = props;
  const items = node.props.items || ['Item 1', 'Item 2', 'Item 3'];

  return (
    <div className="component" style={{ border: '1px solid #2b3856', borderRadius: '8px', overflow: 'hidden' }}>
      {items.map((item, index) => (
        <div key={index} style={{
          padding: '12px 16px',
          borderBottom: index < items.length - 1 ? '1px solid #2b3856' : 'none',
          color: '#dbe4ff',
          fontSize: '13px'
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}
