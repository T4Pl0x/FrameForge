export function Breadcrumb({ path }: { path: string }){
  const label = ({
    '/': 'Home',
    '/publish': 'Publish',
    '/agents': 'Agents',
    '/tools': 'Tools',
    '/settings': 'Settings'
  } as Record<string,string>)[path] || 'Home';
  return (
    <div className="surface-header">
      <span className="muted">FrameForge</span>
      <span className="sep">/</span>
      <span>{label}</span>
    </div>
  );
}

