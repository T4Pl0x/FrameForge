// Stub extension host loader; later can resolve manifests and mount entries (workers/iframes)
export interface ExtensionManifest {
  name: string;
  version: string;
  entry?: { worker?: string };
  capabilities?: string[];
  permissions?: Record<string, unknown>;
}

export async function loadExtension(manifestPath: string): Promise<ExtensionManifest> {
  try {
    const { readFile } = await import('node:fs/promises');
    const { join, dirname } = await import('node:path');
    const raw = await readFile(manifestPath, 'utf8');
    const man = JSON.parse(raw);
    // Normalize
    return { name: man.name, version: man.version, entry: man.entry, capabilities: man.capabilities, permissions: man.permissions };
  } catch {
    return { name: 'unknown', version: '0.0.0' };
  }
}

