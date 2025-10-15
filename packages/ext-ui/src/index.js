export function createUiExtension() {
  const manifest = {
    name: '@frameforge/ext-ui',
    version: '0.1.0',
    capabilities: ['componentPalette', 'inspectorPanels', 'canvasTools', 'tutorials', 'proposeSpecDiff'],
  };

  function register(host) {
    // host: { readSpec(), propose({target, patch, rationale}) }
    return {
      manifest,
      analyze() {
        const spec = host.readSpec();
        const notes = [];
        const frames = Array.isArray(spec?.ui?.frames) ? spec.ui.frames : [];
        if (frames.length === 0) {
          notes.push({ level: 'info', message: 'No frames yet' });
        } else {
          const untitled = frames.filter(f => !f.title || !String(f.title).trim()).map(f => (f.id || '').slice(0,6));
          const components = frames.reduce((acc, f) => acc + (Array.isArray(f.nodes) ? f.nodes.length : 0), 0);
          notes.push({ level: 'info', message: `Frames: ${frames.length}, Components: ${components}` });
          if (untitled.length) notes.push({ level: 'warn', message: `Untitled frames: ${untitled.join(', ')}` });
        }
        // propose to update analysis.json (proposal-only)
        const patch = [{ op: 'replace', path: '/analysis/notes', value: notes }];
        try { host.propose({ target: 'analysis.json', patch, rationale: 'Emit UI analysis' }); } catch {}
        return notes;
      },
    };
  }

  return { register, manifest };
}
