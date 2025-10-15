import registry from '../../tools/registry.json';

const toolMap = new Map();
for (const t of registry.tools) toolMap.set(t.name, t);

export async function call(toolName, action, payload) {
  const entry = toolMap.get(toolName);
  if (!entry) throw new Error(`Unknown tool: ${toolName}`);
  if (!entry.permissions.includes(action)) throw new Error(`Not permitted: ${toolName}.${action}`);
  // Placeholder: real MCP call would go here; return mocked status
  if (toolName === 'rag_indexer' && action === 'status') {
    return { ok: true, tool: toolName, action, status: 'green' };
  }
  return { ok: true, tool: toolName, action, payload, status: 'mocked' };
}
