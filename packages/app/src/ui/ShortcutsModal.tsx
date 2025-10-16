export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }){
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="widget-title">Shortcuts</div>
        <ul className="shortcuts">
          <li><kbd>?</kbd> Open shortcuts</li>
          <li><kbd>g</kbd> <kbd>p</kbd> Publish</li>
          <li><kbd>g</kbd> <kbd>a</kbd> Agents</li>
          <li><kbd>g</kbd> <kbd>t</kbd> Tools</li>
          <li><kbd>g</kbd> <kbd>s</kbd> Settings</li>
        </ul>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

