import { ERR } from '../../packages/kernel/src/errors.js';

export const ERROR_MESSAGES = {
  [ERR.GEOMETRY_WRITE_FORBIDDEN]: 'Layout changes must come from the UI editor.',
  [ERR.PROVENANCE_INCOMPLETE]: 'AI proposal missing required provenance (model/inputs hash).',
  [ERR.RBAC_FORBIDDEN]: 'You don’t have permission for this action. Ask an approver/owner.',
  [ERR.IDEMPOTENCY_DUP]: 'Duplicate action ignored (already applied).',
  [ERR.OVERRIDE_EXPIRED]: 'Override has expired. Ask an owner or extend the expiry.',
  GATE_FAILED_HINT: 'Publish blocked by a failing gate.'
};
