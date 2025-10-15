import React from 'react';

export function Input(props) {
  const { node } = props;
  return (
    <div className="component input">
      <label style={{ fontSize: 12, color: '#89a1d4' }}>{node.props.label || 'Label'}</label>
      <input
        style={{
          width: '100%',
          marginTop: 6,
          background: '#0e1423',
          border: '1px solid #2b3856',
          padding: '8px 10px',
          borderRadius: node.props.radius ?? 8,
          color: '#dbe4ff',
          outline: 'none',
        }}
        placeholder={node.props.placeholder || 'Enter text'}
      />
    </div>
  );
}

export function TextArea(props) {
  const { node } = props;
  return (
    <div className="component input">
      <label style={{ fontSize: 12, color: '#89a1d4' }}>{node.props.label || 'Label'}</label>
      <textarea
        style={{
          width: '100%',
          marginTop: 6,
          background: '#0e1423',
          border: '1px solid #2b3856',
          padding: '8px 10px',
          borderRadius: node.props.radius ?? 8,
          color: '#dbe4ff',
          outline: 'none',
          resize: 'vertical',
          minHeight: '60px'
        }}
        rows={node.props.rows || 3}
        placeholder={node.props.placeholder || 'Enter text'}
      />
    </div>
  );
}

export function Checkbox(props) {
  const { node, onProp } = props;
  return (
    <div className="component" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={node.props.checked || false}
        onChange={(e) => onProp('checked', e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: '#6aa4ff'
        }}
      />
      <label style={{ fontSize: 14, color: '#dbe4ff', cursor: 'pointer' }}>
        {node.props.label || 'Checkbox label'}
      </label>
    </div>
  );
}

export function Radio(props) {
  const { node, onProp } = props;
  return (
    <div className="component" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="radio"
        name={node.props.name || 'radio-group'}
        checked={node.props.checked || false}
        onChange={(e) => onProp('checked', e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: '#6aa4ff'
        }}
      />
      <label style={{ fontSize: 14, color: '#dbe4ff', cursor: 'pointer' }}>
        {node.props.label || 'Radio option'}
      </label>
    </div>
  );
}

export function Select(props) {
  const { node } = props;
  const options = node.props.options || ['Option 1', 'Option 2', 'Option 3'];
  return (
    <div className="component input">
      {node.props.label && (
        <label style={{ fontSize: 12, color: '#89a1d4', marginBottom: 6, display: 'block' }}>
          {node.props.label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          background: '#0e1423',
          border: '1px solid #2b3856',
          padding: '8px 10px',
          borderRadius: node.props.radius ?? 8,
          color: '#dbe4ff',
          outline: 'none'
        }}
      >
        {options.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

export function Switch(props) {
  const { node, onProp } = props;
  return (
    <div className="component" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{ fontSize: 14, color: '#dbe4ff', cursor: 'pointer' }}>
        {node.props.label || 'Toggle switch'}
      </label>
      <label className="switch">
        <input
          type="checkbox"
          checked={node.props.checked || false}
          onChange={(e) => onProp('checked', e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}
