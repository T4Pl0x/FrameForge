export interface PromptParts {
  goal?: string;
  constraints?: string;
  style?: string;
  steps?: string;
  critique?: string;
  schema?: string; // JSON Schema text (optional)
}

export interface PromptVariables {
  slots: Record<string, string>; // name -> default/example
  context?: { rag?: boolean; tools?: boolean; memory?: boolean };
}

export interface PromptDraftV1 {
  id: string;
  version: 'v1';
  parts: PromptParts;
  variables: PromptVariables;
  tokens?: string[];
}

export type PromptDraft = PromptDraftV1; // future versions can union here

