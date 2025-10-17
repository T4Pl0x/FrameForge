import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// RFC6902 operation types for validation
type Rfc6902Op = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

interface Rfc6902Patch {
  op: Rfc6902Op;
  path: string;
  value?: any;
  from?: string; // for move/copy operations
}

interface ApplyOptions {
  dryRun?: boolean;
  trace_id?: string;
}

interface ApplyResult {
  nextJson: any;
  backup?: string; // only present when dryRun=false
}

/** Allowed patch operations for security */
const ALLOWED_OPS: Rfc6902Op[] = ['add', 'remove', 'replace'];

/** Maximum number of patches per apply operation */
const MAX_PATCHES = 20;

/** Whitelisted target files */
const ALLOWED_TARGETS = ['tools/registry.json'];

/** In-memory RFC6902 patch application */
function applyPatches(json: any, patches: Rfc6902Patch[]): any {
  let result = JSON.parse(JSON.stringify(json)); // deep clone

  for (const patch of patches) {
    const { op, path, value, from } = patch;

    // Parse JSON path (simplified impl - no advanced selectors)
    const segments = path.split('/').filter(s => s.length > 0);
    let current = result;
    let parent: any = null;
    let lastKey: string | number | null = null;

    // Navigate to the target location
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;

      // Handle array indices
      if (/^\d+$/.test(segment)) {
        const index = parseInt(segment, 10);
        if (!Array.isArray(current) || index >= current.length) {
          throw new Error(`Invalid path: ${path} - array index out of bounds`);
        }
        if (!isLast) {
          parent = current;
          lastKey = index;
          current = current[index];
        } else {
          parent = current;
          lastKey = index;
        }
      } else {
        // Handle object properties
        if (typeof current !== 'object' || current === null || Array.isArray(current)) {
          throw new Error(`Invalid path: ${path} - not an object at segment ${segment}`);
        }
        if (!current.hasOwnProperty(segment)) {
          if (op === 'add') {
            // Allow adding to non-existent paths
            if (!isLast) {
              throw new Error(`Invalid path: ${path} - cannot navigate through non-existent property`);
            }
          } else {
            throw new Error(`Invalid path: ${path} - property does not exist`);
          }
        }
        if (!isLast) {
          parent = current;
          lastKey = segment;
          current = current[segment];
        } else {
          parent = current;
          lastKey = segment;
        }
      }
    }

    // Apply the operation
    switch (op) {
      case 'add':
        if (lastKey !== null && parent !== null) {
          parent[lastKey] = value;
        } else {
          throw new Error('Cannot add to root');
        }
        break;
      case 'remove':
        if (lastKey !== null && parent !== null) {
          if (Array.isArray(parent)) {
            parent.splice(lastKey as number, 1);
          } else {
            delete parent[lastKey as string];
          }
        } else {
          throw new Error('Cannot remove root');
        }
        break;
      case 'replace':
        if (lastKey !== null && parent !== null) {
          parent[lastKey] = value;
        } else {
          result = value; // Replacing root
        }
        break;
      default:
        throw new Error(`Unsupported operation: ${op}`);
    }
  }

  return result;
}

/** Validate patch operations against security rules */
function validatePatches(patches: Rfc6902Patch[]): void {
  if (!Array.isArray(patches)) {
    throw new Error('Patches must be an array');
  }

  if (patches.length > MAX_PATCHES) {
    throw new Error(`Too many patches: ${patches.length} > ${MAX_PATCHES}`);
  }

  for (const patch of patches) {
    if (!patch || typeof patch !== 'object') {
      throw new Error('Each patch must be an object');
    }
    if (!ALLOWED_OPS.includes(patch.op)) {
      throw new Error(`Unsupported operation: ${patch.op}. Allowed: ${ALLOWED_OPS.join(', ')}`);
    }
    if (typeof patch.path !== 'string') {
      throw new Error('Patch path must be a string');
    }
    if (!patch.path.startsWith('/')) {
      throw new Error('Patch path must start with /');
    }
  }
}

/** Load and parse registry JSON */
async function loadRegistry(): Promise<any> {
  const registryPath = join(process.cwd(), 'tools/registry.json');
  const content = await readFile(registryPath, 'utf8');
  return JSON.parse(content);
}

/** Write registry JSON with backup */
async function writeRegistryWithBackup(json: any): Promise<string> {
  const registryPath = join(process.cwd(), 'tools/registry.json');
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupPath = `tools/registry.json.bak.${timestamp}`;

  // Create backup
  await writeFile(backupPath, JSON.stringify(json, null, 2));

  // Write new content
  await writeFile(registryPath, JSON.stringify(json, null, 2));

  return backupPath;
}

/**
 * Apply RFC6902 patches to registry with validation and audit trail
 * @param patches RFC6902 patches to apply
 * @param options Apply options
 * @returns Result with next JSON and optional backup path
 */
export async function apply(
  patches: Rfc6902Patch[],
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const { dryRun = false, trace_id = 'unknown' } = options;

  // Validate patches
  validatePatches(patches);

  // Load current registry
  const currentJson = await loadRegistry();

  // Apply patches in-memory
  const nextJson = applyPatches(currentJson, patches);

  if (dryRun) {
    // Dry run - just return the computed result
    return { nextJson };
  } else {
    // Real apply - write with backup
    const backup = await writeRegistryWithBackup(nextJson);

    // Audit logging
    try {
      const auditPath = join(process.cwd(), 'frameforge/reports/audit.log');
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'registry.apply',
        trace_id,
        patchCount: patches.length,
        backupPath: backup,
        patches: patches // log the patches for audit
      };
      await writeFile(auditPath, JSON.stringify(auditEntry) + '\n', { flag: 'a' });
    } catch (auditError) {
      // Log audit failure but don't fail the apply
      console.warn('Audit logging failed:', auditError);
    }

    return { nextJson, backup };
  }
}
