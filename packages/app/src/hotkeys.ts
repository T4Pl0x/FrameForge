export interface HotkeysOptions {
  navigate: (path: string) => void;
  openShortcuts: () => void;
  os?: {
    nextWindow: () => void;
    snapActive: (pos: 'left'|'right'|'max') => void;
    openApp: (app: 'publish'|'agents'|'tools'|'settings') => void;
  }
}

export function installHotkeys(opts: HotkeysOptions){
  let awaitingTarget = false;
  function onKeyDown(e: KeyboardEvent){
    const key = e.key.toLowerCase();
    // '?' opens shortcuts
    if (key === '?' || (key === '/' && e.shiftKey)) {
      opts.openShortcuts();
      return;
    }
    if (!awaitingTarget) {
      // OS quick switch
      if ((e.ctrlKey || e.metaKey) && key === 'tab' && opts.os){ e.preventDefault(); opts.os.nextWindow(); return; }
      // OS snapping
      if (e.altKey && (key === 'arrowleft' || key === 'arrowright') && opts.os){ e.preventDefault(); opts.os.snapActive(key === 'arrowleft' ? 'left' : 'right'); return; }
      if (key === 'g' && !e.ctrlKey && !e.metaKey) {
        awaitingTarget = true;
        e.preventDefault();
      }
      return;
    }
    // awaiting target key after 'g'
    awaitingTarget = false;
    switch (key) {
      case 'p': opts.os ? opts.os.openApp('publish') : opts.navigate('/publish'); break;
      case 'a': opts.os ? opts.os.openApp('agents') : opts.navigate('/agents'); break;
      case 't': opts.os ? opts.os.openApp('tools') : opts.navigate('/tools'); break;
      case 's': opts.os ? opts.os.openApp('settings') : opts.navigate('/settings'); break;
      default: break;
    }
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
