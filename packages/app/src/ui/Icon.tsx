export function Icon({ name, className }: { name: 'publish'|'agents'|'tools'|'settings'|'check'|'warn'|'fail'; className?: string }){
  const map: Record<string, string> = {
    publish: '⤴',
    agents: '🤖',
    tools: '🧰',
    settings: '⚙️',
    check: '●',
    warn: '●',
    fail: '●',
  };
  return <span aria-hidden className={className} title={name}>{map[name] ?? '•'}</span>;
}

