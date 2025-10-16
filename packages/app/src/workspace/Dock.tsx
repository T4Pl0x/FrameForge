export function Dock({ active, onNavigate }: { active?: string; onNavigate?: (path: string) => void }) {
  const items = [
    { id: 'publish', label: 'Publish', path: '/publish' },
    { id: 'agents', label: 'Agents', path: '/agents' },
    { id: 'tools', label: 'Tools', path: '/tools' },
    { id: 'settings', label: 'Settings', path: '/settings' },
  ];
  return (
    <aside className="dock" aria-label="Dock Navigation">
      <div className="dock-header">FrameForge</div>
      <nav className="dock-nav" role="navigation">
        {items.map(it => (
          <button key={it.id}
                  className={"dock-btn" + (active === it.path ? " active" : "")}
                  onClick={() => onNavigate?.(it.path)}
                  aria-current={active === it.path ? 'page' : undefined}
                  title={it.label}>
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
