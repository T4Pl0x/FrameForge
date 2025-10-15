// Minimal RFC6902 JSON Patch applier (add, remove, replace)
function getParentAndKey(doc, pathTokens) {
  let parent = doc;
  for (let i = 0; i < pathTokens.length - 1; i++) {
    const t = pathTokens[i];
    parent = Array.isArray(parent) ? parent[Number(t)] : parent?.[t];
  }
  const key = pathTokens[pathTokens.length - 1];
  return [parent, key];
}

function parsePointer(path) {
  if (path === '' || path === '/') return [];
  return path
    .split('/')
    .slice(1)
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function applyPatch(doc, patch) {
  const out = structuredClone ? structuredClone(doc) : JSON.parse(JSON.stringify(doc));
  for (const op of patch || []) {
    const tokens = parsePointer(op.path);
    const [parent, key] = getParentAndKey(out, tokens);
    if (op.op === 'add' || op.op === 'replace') {
      if (Array.isArray(parent)) {
        const idx = key === '-' ? parent.length : Number(key);
        if (op.op === 'replace') parent[idx] = op.value; else parent.splice(idx, 0, op.value);
      } else if (parent && typeof parent === 'object') {
        parent[key] = op.value;
      }
    } else if (op.op === 'remove') {
      if (Array.isArray(parent)) {
        parent.splice(Number(key), 1);
      } else if (parent && typeof parent === 'object') {
        delete parent[key];
      }
    } else {
      throw new Error(`Unsupported op: ${op.op}`);
    }
  }
  return out;
}

export function validatePatch(patch) {
  const errors = [];
  if (!Array.isArray(patch)) return { ok: false, errors: ['Patch must be an array'] };
  patch.forEach((op, i) => {
    if (!op || typeof op !== 'object') errors.push(`op[${i}] not an object`);
    if (!op.op) errors.push(`op[${i}] missing op`);
    if (typeof op.path !== 'string') errors.push(`op[${i}] missing path`);
    if ((op.op === 'add' || op.op === 'replace') && op.value === undefined) errors.push(`op[${i}] missing value`);
  });
  return { ok: errors.length === 0, errors };
}

