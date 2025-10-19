import React, { , useCallback } from 'react';
import PropTypes from 'prop-types';
import { Components } from '../componentRegistry/index.js';
import ComponentMenu from './ComponentMenu.jsx';\nimport { FrameHeader, FrameInspector } from './frame';

/**
 * Frame component - renders individual frames with their components
 * Isolated component for better maintainability
 */
const Frame = ({
  frame,
  rootEl,
  isSelected,
  selectedNodeId,
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
  uiHintsEnabled = true,
  onAskCopilot,
}) => {
          const [showInspector, setShowInspector] = useState(false);

  const fallbackTitle = frame.title || 'Untitled Frame';

  const normalizedTitleOptions = useMemo(() => {
    const base = Array.isArray(frameTitleOptions) ? [...frameTitleOptions] : [];
    if (!base.includes(fallbackTitle)) {
      base.push(fallbackTitle);
    }
    return base;
  }, [frameTitleOptions, fallbackTitle]);

  useEffect(() => {
    if (isCustomTitle) {
      customTitleInputRef.current?.focus();
    }
  }, [isCustomTitle]);

  const isModal = frame.kind === 'modal';
  const isMinimized = Boolean(frame.minimized);
  const selection = useMemo(() => {
    const node = (selectedNodeId && (frame.nodes || []).find(n => n.id === selectedNodeId)) || null;
    const area = node && (node?.props?.width && node?.props?.height)
      ? { x: Math.max(0, (frame.x + (node.props.x || 0))), y: Math.max(0, (frame.y + (node.props.y || 0))), width: Math.max(1, node.props.width), height: Math.max(1, node.props.height) }
      : { x: Math.max(0, frame.x), y: Math.max(0, frame.y), width: Math.max(1, frame.width), height: Math.max(1, frame.height) };
    return { targetId: node?.id || frame.id, area };
  }, [selectedNodeId, frame.x, frame.y, frame.width, frame.height, frame.nodes]);


  const frameStyle = {
    position: 'absolute',
    left: frame.x,
    top: frame.y,
    width: isMinimized ? 180 : frame.width,
    height: isMinimized ? 32 : frame.height,
    background: frame.background || (isModal ? 'rgba(255,255,255,0.98)' : 'white'),
  borderRadius: 0,
    border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
    overflow: 'hidden',
    cursor: 'move',
    boxShadow: isModal ? '0 12px 28px rgba(15,23,42,0.25)' : (frame.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'),
    zIndex: isModal ? 20 : 1,
  };

  

    const handleAddComment = () => {
      if (!commentDraft.trim()) return;
      addComponentComment(frame.id, node.id, commentDraft.trim());
      setCommentDrafts((prev) => ({
        ...prev,
        [menuKey]: '',
      }));
    };

    return (
      <div className="component-menu">
        <div className="component-menu__header">
          <span>Component Tools</span>
          <button type="button" onClick={() => closeComponentMenu(frame.id, node.id)}>
            <div style={{ marginTop: 8 }}>
              <ContrastBadge
                rootEl={rootEl || null}
                selection={{ targetId: frame.id, area: { x: Math.max(0, frame.x), y: Math.max(0, frame.y), width: Math.max(1, frame.width), height: Math.max(1, frame.height) } }}
                fgColor={'#111111'}
                isLargeText={false}
                isIconOnly={false}
              />
            </div>
            Ã—
          </button>
        </div>
        <div className="component-menu__meta">
          <div><strong>Type:</strong> {componentData.type}</div>
          <div><strong>ID:</strong> {componentData.id?.slice(0, 8)}</div>
        </div>
        <div className="component-menu__actions" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="panel-secondary"
            onClick={() => onAskCopilot && onAskCopilot(frame.id, node.id)}
            title={uiHintsEnabled ? 'Ask Copilot about this' : undefined}
            aria-label={uiHintsEnabled ? 'Ask Copilot about this' : undefined}
          >
            Ask Copilot about this
          </button>
        </div>
        {/* Navigation link editor */}
        <div className="component-menu__comments" title="Configure navigation link from this component">
          <h5>Navigation</h5>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Type</span>
              <select
                value={(componentData?.props?.navigateTo?.type) || 'none'}
                onChange={(e) => {
                  const type = e.target.value;
                  const next = type === 'none' ? undefined : { type, targetId: '', label: '' };
                  onUpdateNode(frame.id, node.id, { props: { ...componentData.props, navigateTo: next } });
                }}
              >
                <option value="none">None</option>
                <option value="screen">Screen</option>
                <option value="modal">Modal</option>
              </select>
            </label>
            {componentData?.props?.navigateTo?.type === 'screen' && (
              <label style={{ display: 'grid', gap: 4 }}>
                <span>Target screen</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    style={{ flex: 1 }}
                    value={componentData.props.navigateTo.targetId || ''}
                    onChange={(e) => {
                      const next = { ...componentData.props.navigateTo, targetId: e.target.value };
                      onUpdateNode(frame.id, node.id, { props: { ...componentData.props, navigateTo: next } });
                    }}
                  >
                    <option value="">— Select —</option>
                    {(screens || []).sort((a,b)=>(a.order??0)-(b.order??0)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" className="panel-icon-button" title={uiHintsEnabled ? 'Create screen' : undefined}
                    onClick={() => {
                      if (!onCreateScreen) return;
                      const name = prompt('New screen name', 'New Screen');
                      const id = onCreateScreen(name && name.trim() ? name.trim() : undefined);
                      if (id) {
                        const next = { type: 'screen', targetId: id, label: (componentData.props.navigateTo?.label || name || 'Screen') };
                        onUpdateNode(frame.id, node.id, { props: { ...componentData.props, navigateTo: next } });
                      }
                    }}>+</button>
                </div>
              </label>
            )}
            {componentData?.props?.navigateTo?.type === 'modal' && (
              <label style={{ display: 'grid', gap: 4 }}>
                <span>Target modal</span>
                <button type="button" className="panel-icon-button" title={uiHintsEnabled ? 'Create modal on this screen' : undefined}
                  onClick={() => {
                    if (!onCreateModalFrame) return;
                    const title = prompt('Modal title', 'Modal');
                    const modalId = onCreateModalFrame(frame.screenId, title || 'Modal');
                    if (modalId) {
                      const next = { type: 'modal', targetId: modalId, label: title || 'Modal' };
                      onUpdateNode(frame.id, node.id, { props: { ...componentData.props, navigateTo: next } });
                    }
                  }}>Create modal</button>
              </label>
            )}
            {(componentData?.props?.navigateTo?.type === 'screen' || componentData?.props?.navigateTo?.type === 'modal') && (
              <label style={{ display: 'grid', gap: 4 }}>
                <span>Label</span>
                <input
                  type="text"
                  value={componentData.props.navigateTo.label || ''}
                  onChange={(e) => {
                    const next = { ...componentData.props.navigateTo, label: e.target.value };
                    onUpdateNode(frame.id, node.id, { props: { ...componentData.props, navigateTo: next } });
                  }}
                />
              </label>
            )}
          </div>
        </div>
        <div className="component-menu__comments">
          <h5>Comments</h5>
          {comments.length === 0 ? (
            <p className="component-menu__empty">No comments yet</p>
          ) : (
            <ul>
              {comments.map((comment, index) => (
                <li key={`${menuKey}-comment-${index}`}>{comment}</li>
              ))}
            </ul>
          )}
          <textarea
            placeholder="Leave a note"
            value={commentDraft}
            onChange={handleCommentChange}
          />
          <button type="button" onClick={handleAddComment} disabled={!commentDraft.trim()}>
            Add Comment
          </button>
        </div>
      </div>
    );
  };

  const commitCustomTitle = () => {
    const trimmed = customTitleValue.trim();
    if (trimmed) {
      onAddFrameTitleOption(trimmed);
      onSelectFrameTitle(frame.id, trimmed);
    }
    setIsCustomTitle(false);
    setCustomTitleValue('');
  };

  const handleCustomInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitCustomTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsCustomTitle(false);
      setCustomTitleValue('');
    }
  };

  const selectValue = isCustomTitle ? '__custom' : fallbackTitle;

  const handleTitleChange = (event) => {
    event.stopPropagation();
    const { value } = event.target;
    if (value === '__custom') {
      setIsCustomTitle(true);
      setCustomTitleValue('');
    } else {
      setIsCustomTitle(false);
      onSelectFrameTitle(frame.id, value);
    }
  };

  const handleFrameDeleteClick = (event) => {
    event.stopPropagation();
    onDeleteFrame(frame.id);
  };

  return (
    <div
      className={`frame ${isSelected ? 'selected' : ''} ${isModal ? 'frame--modal' : ''} ${isMinimized ? 'frame--minimized' : ''}`}
      style={frameStyle}
      onMouseDown={(event) => onFrameMouseDown(event, frame.id, frame)}
    >
      <FrameHeader
        frameId={frame.id}
        title={frame.title || 'Untitled Frame'}
        isLocked={!!frame.locked}
        onRename={(next) => { onAddFrameTitleOption(next); onSelectFrameTitle(frame.id, next); }}
        onDelete={() => onDeleteFrame(frame.id)}
        onToggleLock={(locked) => onUpdateFrame && onUpdateFrame(frame.id, { locked })}
      />
        <div className="frame-header-actions">
          <button
            type="button"
            className="frame-delete-button"
            onClick={(event) => { event.stopPropagation(); setShowInspector(v => !v); }}
            title={uiHintsEnabled ? 'Inspect frame' : undefined}
            aria-label={uiHintsEnabled ? 'Inspect frame' : undefined}
          >
            i
          </button>
          <button
            type="button"
            className="frame-delete-button"
            onClick={handleFrameDeleteClick}
            title={uiHintsEnabled ? 'Delete frame' : undefined}
            aria-label={uiHintsEnabled ? 'Delete frame' : undefined}
          >
            ðŸ—‘
          </button>
          <button
            type="button"
            className="plus"
            onClick={(event) => {
              event.stopPropagation();
              onShowMenu(event, frame.id);
            }}
            aria-label={uiHintsEnabled ? 'Add component' : undefined}
            title={uiHintsEnabled ? 'Add component' : undefined}
          >
            +
          </button>
        </div>
      </div>

      {/* Frame Content */}
      <div className="frame-content">
        {/* Components */}
        {frame.nodes.map((node) => {
          const Component = Components[node.type];
          const menuKey = `${frame.id}-${node.id}`;
          const menuState = componentMenus[menuKey];

          const currentProps = node.props || {};

          const handleProp = (propKey, value) => {
            onUpdateNode(frame.id, node.id, {
              props: {
                ...currentProps,
                [propKey]: value,
              },
            });
          };

          const handleProps = (propUpdates = {}) => {
            onUpdateNode(frame.id, node.id, {
              props: {
                ...currentProps,
                ...propUpdates,
              },
            });
          };

          const handleContent = (contentValue) => {
            onUpdateNode(frame.id, node.id, { content: contentValue });
          };

          const componentStyle = {
            position:
              node.props?.x !== undefined && node.props?.y !== undefined
                ? 'absolute'
                : 'relative',
            left: node.props?.x || 0,
            top: node.props?.y || 0,
            cursor: 'move',
            zIndex: selectedNodeId === node.id ? 10 : 1,
            transition: selectedNodeId === node.id ? 'none' : 'all 0.2s ease',
          };

          const nav = node?.props?.navigateTo;
          const navBadge = nav ? (nav.type === 'modal' ? `âŸ‚ ${nav.label || '—'}` : `â†ª ${nav.label || '—'}`) : null;

          return (
            <div key={node.id} className="frame-node">
              <button
                type="button"
                className="component-delete-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteComponent(frame.id, node.id);
                }}
                title={uiHintsEnabled ? 'Delete component' : undefined}
                aria-label={uiHintsEnabled ? 'Delete component' : undefined}
              >
                ðŸ—‘
              </button>
              <div
                onMouseDown={(event) => onComponentMouseDown(event, frame.id, node.id, frame, node)}
                onContextMenu={(event) => onShowComponentMenu(event, frame.id, node.id)}
                style={componentStyle}
                className={`component ${selectedNodeId === node.id ? 'dragging' : ''}`}
              >
                {Component ? (
                  <Component
                    node={node}
                    content={node.content}
                    props={node.props}
                    onProp={handleProp}
                    onProps={handleProps}
                    onContent={handleContent}
                    onContextMenu={(event) => onShowComponentMenu(event, frame.id, node.id)}
                  />
                ) : (
                  <div>Unknown component type: {node.type}</div>
                )}
                {navBadge && (
                  <span className="component-link-badge" aria-label={uiHintsEnabled ? 'Navigation link' : undefined} title={uiHintsEnabled ? navBadge : undefined}>{navBadge}</span>
                )}
              </div>
              {menuState?.isOpen && (
                <ComponentMenu
                  rootEl={rootEl}
                  frame={frame}
                  node={node}
                  uiHintsEnabled={uiHintsEnabled}
                  onAskCopilot={onAskCopilot}
                  screens={screens}
                  onCreateScreen={onCreateScreen}
                  onCreateModalFrame={onCreateModalFrame}
                  getComponent={getComponent}
                  getComponentComments={getComponentComments}
                  addComponentComment={addComponentComment}
                  onUpdateNode={onUpdateNode}
                  closeComponentMenu={closeComponentMenu}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="resize-handle"
        onMouseDown={(event) => onResizeMouseDown(event, frame.id, frame)}
      />
      {showInspector && (
        <FrameInspector
          frameId={frame.id}
          selection={selection}
          onChange={(patch) => onUpdateFrame && onUpdateFrame(frame.id, patch)}
          onClose={() => setShowInspector(false)}
        />
      )}
              </div>
            )}
            {frame.changeFlags && (
              <div>
                <strong>Changes:</strong> {Object.keys(frame.changeFlags).filter(k => frame.changeFlags[k]).join(', ') || '—'}
              </div>
            )}
            {(() => {
              const node = (selectedNodeId && frame.nodes.find(n => n.id === selectedNodeId)) || null;
              const cp = node ? { type: node.type || '', props: node.props || {}, themeTokens: undefined } : { type: 'FrameTitle', props: {}, themeTokens: undefined };
              const fgHex = '#111111' || '#111111';
              const large = false;
              const iconOnly = false;
              const area = node && (node.props?.width && node.props?.height)
                ? { x: Math.max(0, (frame.x + (node.props.x || 0))), y: Math.max(0, (frame.y + (node.props.y || 0))), width: Math.max(1, node.props.width), height: Math.max(1, node.props.height) }
                : { x: Math.max(0, frame.x), y: Math.max(0, frame.y), width: Math.max(1, frame.width), height: Math.max(1, frame.height) };
              return (
                <div style={{ marginTop: 8 }}>
                  <ContrastBadge
                    rootEl={rootEl || null}
                    selection={{ targetId: node?.id || frame.id, area }}
                    fgColor={fgHex}
                    isLargeText={large}
                    isIconOnly={iconOnly}
                  />
                </div>
              );
            })()}
            {(() => {
              const outbound = (frame.nodes || [])
                .map(n => n?.props?.navigateTo)
                .filter(Boolean)
                .map(n => `${n.type === 'modal' ? 'Modal' : 'Screen'}: ${n.label || n.targetId || '—'}`);
              return outbound.length ? (
                <div><strong>Outbound:</strong> {outbound.join(' · ')}</div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

Frame.propTypes = {
  frame: PropTypes.object.isRequired,
  rootEl: PropTypes.any,
  isSelected: PropTypes.bool.isRequired,
  selectedNodeId: PropTypes.string,
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

export default Frame;










