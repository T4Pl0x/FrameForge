// Central feature flags (default false). Read from Vite env at build time.
export const FLAGS = {
  WORKSPACE_SHELL:  Boolean(import.meta.env.VITE_FF_WORKSPACE_SHELL ?? false),
  APPROVALS_DRAWER: Boolean(import.meta.env.VITE_FF_APPROVALS_DRAWER ?? false),
  DEV_AUTO_APPROVE: Boolean(import.meta.env.VITE_FF_DEV_AUTO_APPROVE ?? false),
  BROKER:           Boolean(import.meta.env.VITE_FF_BROKER ?? false),
  GATES_BADGES:     Boolean(import.meta.env.VITE_FF_GATES_BADGES ?? false),
  AGENT_PANEL:      Boolean(import.meta.env.VITE_FF_AGENT_PANEL ?? false),
  TOOL_HUB:         Boolean(import.meta.env.VITE_FF_TOOL_HUB ?? false),
  RAG:              Boolean(import.meta.env.VITE_FF_RAG ?? false),
} as const;

