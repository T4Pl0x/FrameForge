/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FF_WORKSPACE_SHELL?: string;
  readonly VITE_FF_APPROVALS_DRAWER?: string;
  readonly VITE_FF_DEV_AUTO_APPROVE?: string;
  readonly VITE_FF_BROKER?: string;
  readonly VITE_FF_GATES_BADGES?: string;
  readonly VITE_FF_AGENT_PANEL?: string;
  readonly VITE_FF_TOOL_HUB?: string;
  readonly VITE_FF_RAG?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

