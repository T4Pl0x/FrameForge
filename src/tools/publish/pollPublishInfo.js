export async function pollPublishInfo(ctx) {
  const base = ctx.buildBaseUrl || (`/artifacts/${ctx.buildId}/reports/`);
  try {
    const res = await fetch(`${base}index.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('no reports index');
    const idx = await res.json();
    return {
      prUrl: ctx.prUrl,
      reportsUrl: idx.reportsUrl || base,
      dashboardUrl: ctx.dashboardUrl,
    };
  } catch {
    return { prUrl: ctx.prUrl, reportsUrl: base, dashboardUrl: ctx.dashboardUrl };
  }
}

