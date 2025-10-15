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
        if (!spec?.ui || !Array.isArray(spec?.ui?.frames)) {
          notes.push({ level: 'info', message: 'No frames yet' });
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

