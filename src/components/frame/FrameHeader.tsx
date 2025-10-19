import React, { useEffect, useRef, useState } from 'react';

type Props = {
  frameId: string;
  title: string;
  isLocked?: boolean;
  onRename: (next: string) => void;
  onDelete: () => void;
  onToggleLock?: (locked: boolean) => void;
};

export default function FrameHeader({ frameId, title, isLocked, onRename, onDelete, onToggleLock }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title || '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setValue(title || ''); }, [title]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit(next?: string) {
    const trimmed = (next ?? value).trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="frame-header" role="region" aria-label={`Frame ${frameId} header`}>
      <div className="frame-header-left">
        {!editing ? (
          <div className="frame-title-select" onDoubleClick={() => setEditing(true)} title="Rename (double‑click)">
            {value || 'Untitled Frame'}
          </div>
        ) : (
          <input
            ref={inputRef}
            className="frame-title-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => commit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              else if (e.key === 'Escape') { e.preventDefault(); setValue(title || ''); setEditing(false); }
            }}
            placeholder="Name this frame"
          />
        )}
        <span className="frame-id-pill">#{frameId.slice(0, 4)}</span>
        {typeof isLocked !== 'undefined' && (
          <button
            type="button"
            className="frame-badge"
            onClick={() => onToggleLock?.(!isLocked)}
            aria-pressed={isLocked}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
        )}
      </div>
      <div className="frame-header-actions">
        <button
          type="button"
          className="frame-delete-button"
          onClick={() => onDelete()}
          title="Delete frame"
          aria-label="Delete frame"
        >
          ×
        </button>
      </div>
    </div>
  );
}

