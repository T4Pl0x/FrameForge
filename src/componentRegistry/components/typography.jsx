import React from 'react';
import { defaultText } from '../constants.js';

export function Title(props) {
  const { node, onProp, onContent } = props;
  const [isResizing, setIsResizing] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startWidth, setStartWidth] = React.useState(0);

  const style = {
    fontSize: node.props.size || 28,
    fontWeight: node.props.weight || 700,
    fontFamily: node.props.font || 'Inter',
    lineHeight: 1.2,
    color: node.props.color || '#1a1a1a',
    textAlign: node.props.align || 'left',
    letterSpacing: node.props.letterSpacing || 'normal',
    position: 'relative',
    minWidth: '100px',
    width: node.props.width || 'auto',
    padding: '4px 8px',
    border: node.props.editing ? '2px dashed #6aa4ff' : '2px dashed transparent',
    borderRadius: '4px',
    transition: 'border-color 0.2s ease',
    cursor: 'text'
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(node.props.width || 200);

    const handleMouseMove = (event) => {
      if (isResizing) {
        const deltaX = event.clientX - startX;
        const newWidth = Math.max(100, startWidth + deltaX);
        onProp('width', `${newWidth}px`);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="component resizable-component" style={style} onDoubleClick={() => onProp('editing', true)}>
      {node.props.editing ? (
        <input
          className="text-editable"
          autoFocus
          defaultValue={node.content || 'Enter a title'}
          onBlur={(e) => { onContent(e.target.value); onProp('editing', false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
          style={{ width: '100%', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}
        />
      ) : (
        <>
          <span>{node.content || 'Enter a title'}</span>
          <div
            className="resize-handle-right"
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '10px',
              height: '20px',
              background: '#6aa4ff',
              borderRadius: '2px',
              cursor: 'ew-resize',
              opacity: 0.7
            }}
          />
        </>
      )}
    </div>
  );
}

export function Paragraph(props) {
  const { node, onProp, onContent } = props;
  const style = {
    fontSize: node.props.size || 14,
    fontWeight: node.props.weight || 400,
    fontFamily: node.props.font || 'Inter',
    color: node.props.color || '#c9d1e6',
    lineHeight: 1.5,
  };

  return (
    <div className="component" style={style} onDoubleClick={() => onProp('editing', true)}>
      {node.props.editing ? (
        <textarea
          className="text-editable"
          autoFocus
          defaultValue={node.content || defaultText}
          rows={3}
          onBlur={(e) => { onContent(e.target.value); onProp('editing', false); }}
        />
      ) : (
        node.content || defaultText
      )}
    </div>
  );
}
