export type BrokerCall =
  | { type: "sandbox.run"; payload?: unknown }
  | { type: "publish.openPR"; payload?: unknown }
  | { type: `mcp/${string}`; payload?: unknown };

export async function call(_req: BrokerCall) {
  // mock for now
  return { ok: true };
}

