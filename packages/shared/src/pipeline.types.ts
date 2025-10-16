export interface PipelineWidget {
  id: string;
  kind: 'panel'|'overlay'|'tool';
  source?: string; // optional ref to existing panel/tool
}

export interface PipelineExtensionSpec {
  name: string; // e.g., @frameforge/ext-<id>
  entry: string; // path to entry module
  widgets: PipelineWidget[];
}

export interface PipelineSpecV1 {
  version: 'v1';
  appId: string;
  extensions: PipelineExtensionSpec[];
}

export type PipelineSpec = PipelineSpecV1;

