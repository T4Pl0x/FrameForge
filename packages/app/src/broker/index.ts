export type BrokerRequest =
  | { type: 'sandbox.latestRun'; payload?: any }
  | { type: 'publish.openPR'; payload?: any }
  | { type: `mcp/${string}`; payload?: any }
  | { type: 'artifacts.getJson'; payload: { name: string } };

export type BrokerCall = (req: BrokerRequest) => Promise<any>;

type Permission = string; // e.g., 'broker:mcp', 'broker:sandbox', 'broker:publish'

function has(permissions: Set<Permission>, needed: Permission){
  return permissions.has(needed) || permissions.has('broker:*') || permissions.has('*');
}

export function createBrokerContext(permissions: Set<Permission>, opts?: { enforce?: boolean }): { call: BrokerCall } {
  const enforce = opts?.enforce ?? (String(import.meta.env?.VITE_FF_BROKER_ENFORCE || '1') !== '0');
  async function call(req: BrokerRequest){
    if (enforce) {
      if (req.type.startsWith('mcp/')) {
        if (!has(permissions, 'broker:mcp')) throw new Error('Permission denied: broker:mcp');
      } else if (req.type === 'sandbox.latestRun') {
        if (!has(permissions, 'broker:sandbox')) throw new Error('Permission denied: broker:sandbox');
      } else if (req.type === 'publish.openPR') {
        if (!has(permissions, 'broker:publish')) throw new Error('Permission denied: broker:publish');
      }
    }
    switch (req.type) {
      case 'sandbox.latestRun':
        return { id: 'run-123', workflow: req.payload?.workflow || 'frameforge_publish' };
      case 'artifacts.getJson':
        try {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const p = path.join(process.cwd(), 'reports', req.payload?.name);
          const raw = await fs.readFile(p, 'utf8');
          return JSON.parse(raw);
        } catch {
          throw new Error('artifact missing/unreadable');
        }
      case 'publish.openPR':
        return { ok: true, url: 'https://example.com/pr/1' };
      default:
        if (req.type.startsWith('mcp/')) return { ok: true, tool: req.type.slice(4), echo: req.payload };
        throw new Error(`Unknown broker call: ${req.type}`);
    }
  }
  return { call };
}

// System broker (no enforcement)
export function createSystemBroker(){
  return createBrokerContext(new Set(['*']), { enforce: false });
}
