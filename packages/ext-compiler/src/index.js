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
          const inputs = JSON.stringify({ ui: spec?.ui || {}, analysis: spec?.analysis || {} });
          let h = 5381; for (let i = 0; i < inputs.length; i++) h = ((h << 5) + h) + inputs.charCodeAt(i);
          const inputs_sha256 = (h >>> 0).toString(16);
          host.propose({
            target: 'logic.json',
            patch,
            rationale: 'Initialize logic fields',
            metadata: { openQuestions },
            idempotencyKey: `idem:compiler:${inputs_sha256}`,
            provenance: {
              actor: { type: 'extension', name: '@frameforge/ext-compiler', version: '0.1.0' },
              model: { id: 'compiler', provider: 'internal' },
              inputs_sha256,
            }
          });
        }
        return { openQuestions, sample: patch };
      },
    };
  }

  return { register, manifest };
}
