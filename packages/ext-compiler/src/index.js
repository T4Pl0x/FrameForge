export function createCompilerExtension() {
  const manifest = {
    name: '@frameforge/ext-compiler',
    version: '0.1.0',
    capabilities: ['proposeSpecDiff'],
  };

  function register(host) {
    return {
      manifest,
      generate() {
        const spec = host.readSpec();
        const openQuestions = [];
        if (!spec?.data) openQuestions.push('No data.json present');
        const patch = [];
        if (!Array.isArray(spec?.logic?.agents)) {
          patch.push({ op: 'add', path: '/logic/agents', value: [] });
        }
        if (patch.length) {
          host.propose({ target: 'logic.json', patch, rationale: 'Initialize logic fields', metadata: { openQuestions } });
        }
        return { openQuestions, sample: patch };
      },
    };
  }

  return { register, manifest };
}

