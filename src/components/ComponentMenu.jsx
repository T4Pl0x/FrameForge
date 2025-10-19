import React, { useState } from 'react';
import { ContrastBadge } from '../inspector/ContrastBadge';

export default function ComponentMenu({
  rootEl,
  frame,
  node,
  uiHintsEnabled,
  onAskCopilot,
  screens,
  onCreateScreen,
  onCreateModalFrame,
  getComponent,
  getComponentComments,
  addComponentComment,
  onUpdateNode,
  closeComponentMenu,
}){
  const [commentDraft, setCommentDraft] = useState('');
  const comments = getComponentComments(frame.id, node.id);
  const componentData = getComponent(frame.id, node.id) || node;

  const handleAddComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    addComponentComment(frame.id, node.id, text);
    setCommentDraft('');
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
          A-
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
              <li key={`${node.id}-comment-${index}`}>{comment}</li>
            ))}
          </ul>
        )}
        <textarea
          placeholder="Leave a note"
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
        />
        <button type="button" onClick={handleAddComment} disabled={!commentDraft.trim()}>
          Add Comment
        </button>
      </div>
    </div>
  );
}

