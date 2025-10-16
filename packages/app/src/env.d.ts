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
  readonly VITE_FF_OS_DESKTOP?: string;
  readonly VITE_FF_OS_WINDOWS?: string;
  readonly VITE_FF_OS_LAUNCHER?: string;
  readonly VITE_FF_OS_TRAY?: string;
  readonly VITE_FF_OS_NOTIFS?: string;
  readonly VITE_FF_PROMPT_LAB?: string;
  readonly VITE_FF_BUILDER?: string;
  readonly VITE_FF_CODEGEN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
