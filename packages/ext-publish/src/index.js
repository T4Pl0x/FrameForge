export function createPublishExtension() {
  const manifest = {
    name: '@frameforge/ext-publish',
    version: '0.1.0',
    capabilities: ['openPR', 'postStatuses', 'ownerOverride'],
  };

  function register(/* host */) {
    return {
      manifest,
      async openPR(/* normalizedReports */) {
        // Placeholder: relies on GitHub Actions workflow to open PR with statuses.
        return { ok: true, prNumber: 0 };
      },
    };
  }

  return { register, manifest };
}

