export type ExtensionCtx = {
  bus: EventTarget;
  propose: (diffs: unknown[], opts?: { rationale?: string }) => Promise<void>;
  broker: (req: { type: string; payload?: unknown }) => Promise<unknown>;
  permissions: Set<string>;
  openWindow: (opts: { title: string; component: React.FC }) => void;
};
export type ExtensionEntry = {
  mount?: (ctx: ExtensionCtx) => void;
};

