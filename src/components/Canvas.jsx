import React from 'react';
import PropTypes from 'prop-types';

/**
 * Canvas component - renders the main drawing area
 * Handles frame rendering and grid display
 */
const Canvas = ({ 
  canvasRef, 
  frames, 
  selectedFrameId, 
  selectedNodeId,
  showGrid,
  zoom,
  onCanvasClick,
  onFrameMouseDown,
  onResizeMouseDown,
  onComponentMouseDown,
  onShowMenu,
  onUpdateFrame,
  onUpdateNode,
  onShowComponentMenu,
  screens,
  onCreateScreen,
  onCreateModalFrame,
  componentMenus,
  getComponent,
  closeComponentMenu,
  addComponentComment,
  getComponentComments,
  frameTitleOptions,
  onSelectFrameTitle,
  onAddFrameTitleOption,
  onDeleteFrame,
  onDeleteComponent,
  uiHintsEnabled,
  onAskCopilot,
}) => {
  const canvasStyle = {
    position: 'relative',
    display: 'block',
    width: '100%',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: 0,
    margin: 0,
    background: showGrid ? 'var(--surface-strong)' : 'var(--surface)'
  };

  const gridOverlayStyle = showGrid ? {
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px)`,
    backgroundSize: `${20 * zoom / 100}px ${20 * zoom / 100}px`,
    backgroundPosition: '0 0',
    pointerEvents: 'none',
    zIndex: 0
  } : null;

  return (
    <div
      className="canvas"
      ref={canvasRef}
      style={canvasStyle}
      onClick={onCanvasClick}
    >
      {showGrid && <div style={gridOverlayStyle} aria-hidden="true" />}

      {/* Frames */}
      {frames.map(frame => (
        <Frame
          key={frame.id}
          frame={frame}
          rootEl={canvasRef?.current || null}
          isSelected={selectedFrameId === frame.id}
          selectedNodeId={selectedNodeId}
          onFrameMouseDown={onFrameMouseDown}
          onResizeMouseDown={onResizeMouseDown}
          onComponentMouseDown={onComponentMouseDown}
          onShowMenu={onShowMenu}
          onUpdateFrame={onUpdateFrame}
          onUpdateNode={onUpdateNode}
          onShowComponentMenu={onShowComponentMenu}
          screens={screens}
          onCreateScreen={onCreateScreen}
          onCreateModalFrame={onCreateModalFrame}
          componentMenus={componentMenus}
          getComponent={getComponent}
          closeComponentMenu={closeComponentMenu}
          addComponentComment={addComponentComment}
          getComponentComments={getComponentComments}
          frameTitleOptions={frameTitleOptions}
          onSelectFrameTitle={onSelectFrameTitle}
          onAddFrameTitleOption={onAddFrameTitleOption}
          onDeleteFrame={onDeleteFrame}
          onDeleteComponent={onDeleteComponent}
          uiHintsEnabled={uiHintsEnabled}
          onAskCopilot={onAskCopilot}
        />
      ))}
    </div>
  );
};

// Import Frame component
import Frame from './Frame.jsx';

Canvas.propTypes = {
  canvasRef: PropTypes.object.isRequired,
  frames: PropTypes.array.isRequired,
  selectedFrameId: PropTypes.string,
  selectedNodeId: PropTypes.string,
  showGrid: PropTypes.bool.isRequired,
  zoom: PropTypes.number.isRequired,
  onCanvasClick: PropTypes.func.isRequired,
  onFrameMouseDown: PropTypes.func.isRequired,
  onResizeMouseDown: PropTypes.func.isRequired,
  onComponentMouseDown: PropTypes.func.isRequired,
  onShowMenu: PropTypes.func.isRequired,
  onUpdateFrame: PropTypes.func,
  onUpdateNode: PropTypes.func.isRequired,
  onShowComponentMenu: PropTypes.func.isRequired,
  screens: PropTypes.array,
  onCreateScreen: PropTypes.func,
  onCreateModalFrame: PropTypes.func,
  componentMenus: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  closeComponentMenu: PropTypes.func.isRequired,
  addComponentComment: PropTypes.func.isRequired,
  getComponentComments: PropTypes.func.isRequired,
  frameTitleOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectFrameTitle: PropTypes.func.isRequired,
  onAddFrameTitleOption: PropTypes.func.isRequired,
  onDeleteFrame: PropTypes.func.isRequired,
  onDeleteComponent: PropTypes.func.isRequired,
  uiHintsEnabled: PropTypes.bool,
  onAskCopilot: PropTypes.func,
};

export default Canvas;
