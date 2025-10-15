export function createSandboxExtension() {
  const manifest = {
    name: '@frameforge/ext-sandbox',
    version: '0.1.0',
    capabilities: ['runSandbox'],
    reports: ['reports/tests-report.json', 'reports/a11y-report.json', 'reports/lint-build.json']
  };

  function register(/* host */) {
    return {
      manifest,
      async run(/* options */) {
        // Placeholder: CI should produce normalized reports via scripts/normalize-*.js
        return { ok: true, produced: manifest.reports };
      },
    };
  }

  return { register, manifest };
}

