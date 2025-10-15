import React from 'react';

export function Button(props) {
  const { node, onProp, onContent, onButtonMenu, onButtonDrag } = props;
  const [showMenu, setShowMenu] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startWidth, setStartWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [position, setPosition] = React.useState({
    x: node.props?.x || 0,
    y: node.props?.y || 0
  });
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const isLoading = Boolean(node.props.loading);
  const buttonRef = React.useRef(null);

  const variants = {
    primary: {
      background: node.props.shade === 'dark' ? '#1e40af' : node.props.shade === 'light' ? '#93c5fd' : '#3b82f6',
      color: node.props.shade === 'light' ? '#1e40af' : 'white'
    },
    secondary: {
      background: node.props.shade === 'dark' ? '#374151' : node.props.shade === 'light' ? '#e5e7eb' : '#6b7280',
      color: node.props.shade === 'light' ? '#374151' : 'white'
    },
    success: {
      background: node.props.shade === 'dark' ? '#059669' : node.props.shade === 'light' ? '#a7f3d0' : '#10b981',
      color: node.props.shade === 'light' ? '#059669' : 'white'
    },
    warning: {
      background: node.props.shade === 'dark' ? '#d97706' : node.props.shade === 'light' ? '#fde68a' : '#f59e0b',
      color: node.props.shade === 'light' ? '#d97706' : 'white'
    },
    error: {
      background: node.props.shade === 'dark' ? '#dc2626' : node.props.shade === 'light' ? '#fca5a5' : '#ef4444',
      color: node.props.shade === 'light' ? '#dc2626' : 'white'
    },
    ghost: {
      background: 'transparent',
      color: node.props.color || '#6b7280',
      border: '1px solid #d1d5db'
    },
    outlined: {
      background: 'transparent',
      color: node.props.color || '#3b82f6',
      border: `2px solid ${node.props.color || '#3b82f6'}`
    },
    gradient: {
      background: node.props.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }
  };

  const currentVariant = variants[node.props.variant || 'primary'];
  const isDisabled = node.props.disabled || isLoading;

  const baseStyle = {
    padding: node.props.size === 'L' ? '12px 20px' : node.props.size === 'S' ? '6px 12px' : '8px 16px',
    background: isDisabled
      ? '#f3f4f6'
      : node.props.variant === 'gradient'
      ? (node.props.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      : currentVariant.background,
    border: currentVariant.border || 'none',
    color: isDisabled
      ? '#9ca3af'
      : node.props.variant === 'gradient'
      ? 'white'
      : (node.props.color && node.props.variant !== 'outlined' ? node.props.color : currentVariant.color),
    borderRadius: node.props.cornerStyle === 'round' ? '50px' : node.props.cornerStyle === 'sharp' ? '0px' : (node.props.radius ?? 8),
    boxShadow: isDisabled
      ? 'none'
      : node.props.elevated
      ? '0 4px 12px rgba(0,0,0,0.15)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: node.props.textAlign || 'center',
    fontWeight: node.props.fontWeight || 600,
    fontSize: node.props.fontSize || '14px',
    fontFamily: node.props.fontFamily || 'Inter',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: node.props.fullWidth ? '100%' : '80px',
    position: 'relative',
    width: node.props.width || 'auto',
    display: 'inline-block',
    letterSpacing: node.props.letterSpacing || 'normal',
    textTransform: node.props.textTransform || 'none',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    outline: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isFocused ? '#3b82f6' : 'transparent',
    opacity: isLoading ? 0.8 : 1,
  };

  const buttonStyle = {
    ...baseStyle,
    transform: isDisabled
      ? 'none'
      : isPressed
      ? 'translateY(1px) scale(0.98)'
      : isHovered
      ? 'translateY(-2px) scale(1.02)'
      : 'translateY(0px) scale(1)',
    boxShadow: isDisabled
      ? 'none'
      : isPressed
      ? '0 2px 8px rgba(0,0,0,0.2)'
      : isHovered
      ? '0 8px 25px rgba(0,0,0,0.15)'
      : node.props.elevated ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
    filter: isDisabled
      ? 'none'
      : isHovered
      ? 'brightness(1.05)'
      : 'brightness(1)'
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right + 10, y: rect.top });
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleDragMouseDown = (e) => {
    if (e.button !== 0 || isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    const handleMouseMove = (event) => {
      if (isDragging) {
        const newX = event.clientX - dragStart.x;
        const newY = event.clientY - dragStart.y;
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        onProp('x', newX);
        onProp('y', newY);
        if (onButtonDrag) {
          onButtonDrag(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPressed(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(parseInt(node.props.width || '120', 10));

    const handleMouseMove = (event) => {
      if (isResizing) {
        const deltaX = event.clientX - startX;
        const newWidth = Math.max(80, startWidth + deltaX);
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

  const handleKeyDown = (e) => {
    if (node.props.disabled || isLoading) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (node.props.onClick) {
        node.props.onClick();
      }
    } else if (e.key === 'Escape') {
      buttonRef.current?.blur();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleMouseDown = () => {
    if (!isDragging && !isResizing) {
      setIsPressed(true);
    }
  };
  const handleMouseUp = () => setIsPressed(false);

  const handlePlusMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right + 10, y: rect.top });
    setShowMenu(true);
    if (onButtonMenu) {
      onButtonMenu();
    }
  };

  return (
    <div className="component button" style={{ padding: 0, background: 'transparent', border: 'none', position: 'relative' }}>
      {node.props.editing ? (
        <input
          className="text-editable"
          autoFocus
          defaultValue={node.content || 'Button'}
          style={{
            ...buttonStyle,
            padding: buttonStyle.padding,
            border: '2px solid #6aa4ff',
            outline: 'none'
          }}
          onBlur={(e) => { onContent(e.target.value); onProp('editing', false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
        />
      ) : (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              zIndex: isDragging ? 1000 : 1
            }}
          >
            <button
              ref={buttonRef}
              style={{
                ...buttonStyle,
                cursor: isDragging ? 'grabbing' : 'pointer'
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onProp('editing', true);
              }}
              onContextMenu={handleContextMenu}
              onMouseDown={(e) => {
                handleMouseDown();
                handleDragMouseDown(e);
              }}
              onMouseUp={(event) => {
                handleMouseUp(event);
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={(event) => {
                handleMouseLeave(event);
                setIsPressed(false);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
            >
              {isLoading ? 'Loading…' : (node.content || 'Button')}
            </button>
            <button
              className="plus-menu-button"
              onClick={handlePlusMenuClick}
              style={{
                position: 'absolute',
                right: '-25px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#6aa4ff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 15,
                opacity: 0.8,
                transition: 'opacity 0.2s ease'
              }}
            >
              +
            </button>
            <div
              className="resize-handle-right"
              onMouseDown={handleResizeMouseDown}
              style={{
                position: 'absolute',
                right: '-5px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '10px',
                height: '16px',
                background: '#6aa4ff',
                borderRadius: '2px',
                cursor: 'ew-resize',
                opacity: 0.7,
                zIndex: 10
              }}
            />
          </div>
        </div>
      )}

      {showMenu && (
        <div
          className="button-menu"
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            background: '#1a1f2e',
            border: '1px solid #2a3441',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 1000,
            minWidth: '280px',
            maxHeight: '500px',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 #2d3748'
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#94a3b8' }}>Button Options</div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Text</label>
            <input
              type="text"
              value={node.content || 'Button'}
              onChange={(e) => onContent(e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Font</label>
            <select
              value={node.props.fontFamily || 'Inter'}
              onChange={(e) => onProp('fontFamily', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {/* Font options intentionally verbatim */}
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="system-ui">System UI</option>
              <option value="-apple-system">Apple System</option>
              <option value="BlinkMacSystemFont">BlinkMacSystemFont</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Roboto">Roboto</option>
              <option value="Oxygen">Oxygen</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Cantarell">Cantarell</option>
              <option value="Fira Sans">Fira Sans</option>
              <option value="Droid Sans">Droid Sans</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
              <option value="Nunito">Nunito</option>
              <option value="Work Sans">Work Sans</option>
              <option value="Noto Sans">Noto Sans</option>
              <option value="Barlow">Barlow</option>
              <option value="IBM Plex Sans">IBM Plex Sans</option>
              <option value="SF Pro Display">SF Pro Display</option>
              <option value="SF Pro Text">SF Pro Text</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Garamond">Garamond</option>
              <option value="Palatino">Palatino</option>
              <option value="Bookman">Bookman</option>
              <option value="New Century Schoolbook">New Century Schoolbook</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Lora">Lora</option>
              <option value="Crimson Text">Crimson Text</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Libre Baskerville">Libre Baskerville</option>
              <option value="Source Serif Pro">Source Serif Pro</option>
              <option value="PT Serif">PT Serif</option>
              <option value="Noto Serif">Noto Serif</option>
              <option value="Courier New">Courier New</option>
              <option value="Monaco">Monaco</option>
              <option value="Consolas">Consolas</option>
              <option value="Liberation Mono">Liberation Mono</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Source Code Pro">Source Code Pro</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="IBM Plex Mono">IBM Plex Mono</option>
              <option value="Space Mono">Space Mono</option>
              <option value="Roboto Mono">Roboto Mono</option>
              <option value="Ubuntu Mono">Ubuntu Mono</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Papyrus">Papyrus</option>
              <option value="Chiller">Chiller</option>
              <option value="Stencil">Stencil</option>
              <option value="Cooper Black">Cooper Black</option>
              <option value="Brush Script MT">Brush Script MT</option>
              <option value="Edwardian Script ITC">Edwardian Script ITC</option>
              <option value="Freestyle Script">Freestyle Script</option>
              <option value="Vivaldi">Vivaldi</option>
              <option value="French Script MT">French Script MT</option>
              <option value="Matura MT Script Capitals">Matura MT Script Capitals</option>
              <option value="Kunstler Script">Kunstler Script</option>
              <option value="Blackadder ITC">Blackadder ITC</option>
              <option value="Rage Italic">Rage Italic</option>
              <option value="Engravers MT">Engravers MT</option>
              <option value="Old English Text MT">Old English Text MT</option>
              <option value="Castellar">Castellar</option>
              <option value="Magneto">Magneto</option>
              <option value="Eras Bold ITC">Eras Bold ITC</option>
              <option value="Wide Latin">Wide Latin</option>
              <option value="Bauhaus 93">Bauhaus 93</option>
              <option value="Elephant">Elephant</option>
              <option value="Haettenschweiler">Haettenschweiler</option>
              <option value="Snap ITC">Snap ITC</option>
              <option value="Forte">Forte</option>
              <option value="Britannic Bold">Britannic Bold</option>
              <option value="Colonna MT">Colonna MT</option>
              <option value="Imprint MT Shadow">Imprint MT Shadow</option>
              <option value="Algerian">Algerian</option>
              <option value="Bodoni MT Black">Bodoni MT Black</option>
              <option value="Book Antiqua">Book Antiqua</option>
              <option value="Calisto MT">Calisto MT</option>
              <option value="Cambria">Cambria</option>
              <option value="Constantia">Constantia</option>
              <option value="Corbel">Corbel</option>
              <option value="Franklin Gothic Medium">Franklin Gothic Medium</option>
              <option value="Gill Sans MT">Gill Sans MT</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Size</label>
            <select
              value={node.props.fontSize || '14px'}
              onChange={(e) => onProp('fontSize', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Weight</label>
            <select
              value={node.props.fontWeight || '600'}
              onChange={(e) => onProp('fontWeight', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Shade</label>
            <select
              value={node.props.shade || 'medium'}
              onChange={(e) => onProp('shade', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Corners</label>
            <select
              value={node.props.cornerStyle || 'rounded'}
              onChange={(e) => onProp('cornerStyle', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="sharp">90° Sharp</option>
              <option value="rounded">Rounded</option>
              <option value="round">Fully Round</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Size</label>
            <select
              value={node.props.size || 'M'}
              onChange={(e) => onProp('size', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="S">Small</option>
              <option value="M">Medium</option>
              <option value="L">Large</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Variant</label>
            <select
              value={node.props.variant || 'primary'}
              onChange={(e) => onProp('variant', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="ghost">Ghost</option>
              <option value="outlined">Outlined</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={node.props.elevated || false}
                onChange={(e) => onProp('elevated', e.target.checked)}
                style={{ marginRight: '6px' }}
              />
              Elevated
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={node.props.fullWidth || false}
                onChange={(e) => onProp('fullWidth', e.target.checked)}
                style={{ marginRight: '6px' }}
              />
              Full Width
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Custom Color</label>
            <input
              type="color"
              value={node.props.color || '#3b82f6'}
              onChange={(e) => onProp('color', e.target.value)}
              style={{
                width: '100%',
                height: '30px',
                border: '1px solid #2a3441',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Border Radius</label>
            <input
              type="range"
              min="0"
              max="50"
              value={node.props.radius || 8}
              onChange={(e) => onProp('radius', parseInt(e.target.value))}
              style={{
                width: '100%'
              }}
            />
            <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
              {node.props.radius || 8}px
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Letter Spacing</label>
            <select
              value={node.props.letterSpacing || 'normal'}
              onChange={(e) => onProp('letterSpacing', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="normal">Normal</option>
              <option value="-0.02em">Tight</option>
              <option value="0.02em">Loose</option>
              <option value="0.05em">Very Loose</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Text Transform</label>
            <select
              value={node.props.textTransform || 'none'}
              onChange={(e) => onProp('textTransform', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="none">None</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Text Align</label>
            <select
              value={node.props.textAlign || 'center'}
              onChange={(e) => onProp('textAlign', e.target.value)}
              style={{
                width: '100%',
                background: '#0f1627',
                border: '1px solid #2a3441',
                color: '#e2e8f0',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <button
            onClick={handleMenuClose}
            style={{
              width: '100%',
              background: '#6aa4ff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      )}

      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={handleMenuClose}
        />
      )}
    </div>
  );
}
