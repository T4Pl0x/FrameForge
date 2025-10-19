export function Dock({ active, onNavigate }: { active?: string; onNavigate?: (path: string) => void }) {
  const items = [
    { id: 'publish', label: 'Publish', path: '/publish', icon: '📤' },
    { id: 'agents', label: 'Agents', path: '/agents', icon: '🧠' },
    { id: 'mermaid', label: 'Mermaid', path: '/app/mermaid', icon: '🜲' },
    { id: 'assistant', label: 'Assistant', path: '/app/assistant', icon: '🤖' },
    { id: 'tools', label: 'Tools', path: '/tools', icon: '🔧' },
    { id: 'settings', label: 'Settings', path: '/settings', icon: '⚙️' },
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
                  aria-label={it.label}
                  data-app={it.id}>
            <span className="dock-icon">{it.icon}</span>
            <span className="visually-hidden">{it.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
