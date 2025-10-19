import React from 'react';

type Rect = { x: number; y: number; width: number; height: number };
type SelectionState = { targetId: string; area: Rect };

type Props = {
  frameId: string;
  selection: SelectionState;
  onChange: (patch: Partial<Record<string, unknown>>) => void;
  onClose?: () => void;
};

export default function FrameInspector({ frameId, selection, onChange, onClose }: Props) {
  const minimize = () => onChange({ minimized: true });
  const restore = () => onChange({ minimized: false });

  return (
    <div className="frame-inspector" onMouseDown={(e) => e.stopPropagation()}>
      <div className="frame-inspector__header">
        <strong>Inspector</strong>
        <button className="frame-inspector__close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="frame-inspector__body">
        <div><strong>Frame:</strong> {frameId}</div>
        <div><strong>Target:</strong> {selection.targetId}</div>
        <div><strong>Area:</strong> {selection.area.x},{selection.area.y} · {selection.area.width}×{selection.area.height}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button className="panel-icon-button" onClick={minimize}>Minimize</button>
          <button className="panel-icon-button" onClick={restore}>Restore</button>
        </div>
      </div>
    </div>
  );
}

