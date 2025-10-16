import type { PipelineSpec, PipelineExtensionSpec } from "../src/pipeline.types";

export type CodegenTarget = "web"|"desktop";

export interface CodegenFileMap { [relativePath: string]: string }
export interface CodegenResult {
  outDir: string;
  files: CodegenFileMap;
  registryEntry: any;
}

export function generateExtension(spec: PipelineSpec, target: CodegenTarget, outDir: string): CodegenResult {
  if (spec.version !== 'v1') throw new Error('Unsupported PipelineSpec version');
  const ext: PipelineExtensionSpec = spec.extensions[0];
  const pkgName = ext.name;
  const entryPath = 'src/entry.tsx';
  const manifest = {
    name: pkgName,
    version: '0.1.0',
    entry: { module: entryPath },
    capabilities: ['windowApp'],
    permissions: { read: [], propose: [] }
  };
  const entry = `export default function mount(host){ host.openWindow({ title: '${spec.appId}', render: () => '${spec.appId} (${target})' }); }\n`;
  const pkg = { name: pkgName, version: '0.1.0', private: true, type: 'module', scripts: { build: target === 'desktop' ? "node -e \"console.log('desktop build ok')\"" : "node -e \"console.log('web build ok')\"" } };
  const files: CodegenFileMap = {
    'package.json': JSON.stringify(pkg, null, 2) + '\n',
    'manifest.json': JSON.stringify(manifest, null, 2) + '\n',
    [entryPath]: entry
  };
  const registryEntry = {
    id: spec.appId + (target === 'web' ? '_web' : '_desktop'),
    kind: target === 'web' ? 'extension' : 'desktop-wrapper',
    endpoint: null,
    status: 'offline',
    lastPingISO: null,
    permissions: { callableBy: ['@frameforge/app'] }
  };
  return { outDir, files, registryEntry };
}

export function toOverlayDiffs(res: CodegenResult){
  const diffs: any[] = [];
  for (const [rel, content] of Object.entries(res.files)) {
    diffs.push({ op: 'add', path: `/__file/${res.outDir}/${rel}`, value: content });
  }
  diffs.push({ op: 'add', path: `/__file/tools/registry.json`, value: { tools: [ res.registryEntry ] } });
  return diffs;
}
