// Stub extension host loader; later can resolve manifests and mount entries (workers/iframes)
export interface ExtensionManifest {
  name: string;
  version: string;
  entry?: { worker?: string; module?: string } | string;
  capabilities?: string[];
  permissions?: string[] | Record<string, unknown>;
}

// Node/FS helper (retained) for non-browser contexts
export async function loadManifestFromFs(manifestPath: string): Promise<ExtensionManifest> {
  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(manifestPath, 'utf8');
    const man = JSON.parse(raw);
    return { name: man.name, version: man.version, entry: man.entry, capabilities: man.capabilities, permissions: man.permissions };
  } catch {
    return { name: 'unknown', version: '0.0.0' };
  }
}

export type ExtensionEntry = { mount?: (ctx: any) => void } | ((ctx: any) => void);

// Browser/Vite-friendly loader from a base URL (e.g., /@fs/abs/path)
export async function loadExtension(baseUrl: string): Promise<{ manifest: ExtensionManifest; entry: ExtensionEntry }>{
  const manMod: any = await import(/* @vite-ignore */ `${baseUrl}/manifest.json`);
  const manifest: ExtensionManifest = (manMod?.default || manMod) as any;
  const entryPath = typeof manifest.entry === 'string' ? manifest.entry : (manifest.entry?.module || 'src/entry.tsx');
  const norm = entryPath.replace(/^\.\/?/, '');
  const entryMod: any = await import(/* @vite-ignore */ `${baseUrl}/${norm}`);
  const entry: ExtensionEntry = entryMod.entry ?? entryMod.default;
  return { manifest, entry };
}

/** Boot a list of extension base URLs with a fresh ctx per extension. */
export async function bootExtensions(bases: string[], ctxFactory: () => any): Promise<number> {
  let count = 0;
  for (const base of bases) {
    try {
      const { entry } = await loadExtension(base);
      if (typeof entry === 'function') (entry as Function)(ctxFactory());
      else entry.mount?.(ctxFactory());
      count++;
    } catch {
      // ignore broken entries in dev boot
    }
  }
  return count;
}
