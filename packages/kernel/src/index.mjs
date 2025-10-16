import fs from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';

const SCOPES = new Set(['ui','logic','data','theme','tests','overlays']);
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function nowISO(){ return new Date().toISOString(); }
function cuid(){ return 't_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

async function readJson(p){
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw);
}
async function writeJson(p, obj){
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function decodeToken(tok){
  return tok.replaceAll('~1', '/').replaceAll('~0', '~');
}

function getByPointer(root, tokens){
  let cur = root;
  for (const tok of tokens) {
    if (tok === '') continue; // leading slash
    const key = decodeToken(tok);
    if (Array.isArray(cur)) {
      const idx = key === '-' ? cur.length : Number(key);
      cur = cur[idx];
    } else {
      cur = cur?.[key];
    }
  }
  return cur;
}

function setByPointer(root, tokens, value){
  if (tokens.length === 0) throw new Error('Cannot set document root directly');
  let cur = root;
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i-1];
    if (tok === '') continue; // skip leading
    const key = decodeToken(tok);
    cur = Array.isArray(cur) ? cur[(key === '-' ? cur.length : Number(key))] : cur[key];
  }
  const last = decodeToken(tokens[tokens.length-1]);
  if (Array.isArray(cur)) {
    if (last === '-') cur.push(value);
    else cur[Number(last)] = value;
  } else {
    cur[last] = value;
  }
}

function removeByPointer(root, tokens){
  if (tokens.length === 0) throw new Error('Cannot remove document root');
  let cur = root;
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i-1];
    if (tok === '') continue;
    const key = decodeToken(tok);
    cur = Array.isArray(cur) ? cur[(key === '-' ? cur.length : Number(key))] : cur[key];
  }
  const last = decodeToken(tokens[tokens.length-1]);
  if (Array.isArray(cur)) {
    if (last === '-') throw new Error('Cannot remove array - pointer');
    cur.splice(Number(last), 1);
  } else {
    delete cur[last];
  }
}

function applyPatch(doc, diffs){
  // Supports add, remove, replace. Others can be added as needed.
  for (const d of diffs) {
    if (!d || typeof d !== 'object') throw new Error('Invalid diff');
    const { op, path: p, value } = d;
    if (!op || typeof p !== 'string') throw new Error('Invalid diff fields');
    const tokens = p.split('/');
    switch (op) {
      case 'add':
      case 'replace':
        setByPointer(doc, tokens, value);
        break;
      case 'remove':
        removeByPointer(doc, tokens);
        break;
      default:
        throw new Error(`Unsupported op: ${op}`);
    }
  }
  return doc;
}

function hasGeometryPaths(diffs){
  // Treat paths that begin with /layout or /geometry as geometry
  return diffs.some(d => typeof d?.path === 'string' && (d.path === '/layout' || d.path.startsWith('/layout/') || d.path === '/geometry' || d.path.startsWith('/geometry/')));
}

export class Kernel {
  constructor(options = {}){
    const root = options.rootDir || process.cwd();
    this.rootDir = root;
    this.specDir = options.specDir || path.join(root, 'spec');
    this.events = new EventEmitter();
    this._tickets = new Map();
    this._idem = new Map();
    this._devAutoApprove = (process.env.FF_DEV_AUTO_APPROVE === 'true');
    // RBAC stub: map userId -> role; default open
    this._rbac = options.rbac || { roles: {} };
  }

  _scopeToPath(scope){
    if (!SCOPES.has(scope)) throw new Error(`Unknown scope: ${scope}`);
    return path.join(this.specDir, `${scope}.json`);
  }

  get host(){
    return {
      proposals: {
        submit: (payload) => this._submit(payload)
      }
    };
  }

  get kernel(){
    return {
      proposals: {
        approve: (ticketId, approver) => this._approve(ticketId, approver),
        apply: (ticketId) => this._apply(ticketId)
      },
      events: this.events
    };
  }

  _validateSubmit(payload){
    const err = (m) => { const e = new Error(m); e.code = 'E_SUBMIT'; return e; };
    if (!payload || typeof payload !== 'object') throw err('Submit payload required');
    const { title, diffs, scope, sourceExtension } = payload;
    if (!title) throw err('title required');
    if (!Array.isArray(diffs) || diffs.length === 0) throw err('diffs required');
    if (!Array.isArray(scope) || scope.length === 0) throw err('scope required');
    if (!sourceExtension) throw err('sourceExtension required');
    for (const s of scope) if (!SCOPES.has(s)) throw err(`invalid scope: ${s}`);
    if (scope.length > 1) throw err('multi-scope proposals are not yet supported');
    if (scope.includes('ui') && sourceExtension !== '@frameforge/ext-ui' && hasGeometryPaths(diffs)) {
      const e = err('Policy violation: Only @frameforge/ext-ui may modify ui geometry/layout');
      e.code = 'E_POLICY_GEOMETRY';
      throw e;
    }
  }

  _submit(payload){
    this._validateSubmit(payload);
    const { idempotencyKey } = payload;
    if (idempotencyKey) {
      const prev = this._idem.get(idempotencyKey);
      const now = Date.now();
      if (prev && (now - prev.ts) < IDEMPOTENCY_WINDOW_MS) {
        return this._tickets.get(prev.ticketId);
      }
    }
    const ticketId = cuid();
    const ticket = {
      id: ticketId,
      status: 'pending',
      createdAt: nowISO(),
      ...payload
    };
    this._tickets.set(ticketId, ticket);
    if (idempotencyKey) this._idem.set(idempotencyKey, { ts: Date.now(), ticketId });
    this.events.emit('proposal.created', { ticketId, source: payload.sourceExtension });
    if (this._devAutoApprove) {
      this._approve(ticketId, 'dev-auto-approve');
      this._apply(ticketId);
    }
    return ticket;
  }

  _approve(ticketId, approver){
    const t = this._tickets.get(ticketId);
    if (!t) throw new Error(`Unknown ticket ${ticketId}`);
    if (t.status === 'applied') return t;
    if (!this._can('approve', approver)) throw new Error(`RBAC: ${approver || 'unknown'} cannot approve`);
    t.status = 'approved';
    t.approver = approver || 'system';
    t.approvedAt = nowISO();
    this.events.emit('proposal.approved', { ticketId });
    return t;
  }

  async _apply(ticketId){
    const t = this._tickets.get(ticketId);
    if (!t) throw new Error(`Unknown ticket ${ticketId}`);
    if (t.status !== 'approved' && !this._devAutoApprove) throw new Error('Ticket must be approved before apply');
    const scope = t.scope[0];
    const specPath = this._scopeToPath(scope);
    const doc = await readJson(specPath);
    const updated = applyPatch(doc, t.diffs.map(d => ({...d}))); // shallow clone
    await writeJson(specPath, updated);

    // audit line
    const metaPath = path.join(this.specDir, 'meta.json');
    const meta = await readJson(metaPath).catch(() => ({ version: 'v1', audit: [] }));
    const entry = {
      ticketId,
      who: t.approver || 'unknown',
      when: nowISO(),
      diffs: t.diffs,
      labels: t.labels || [],
      sourceExtension: t.sourceExtension
    };
    meta.audit = Array.isArray(meta.audit) ? meta.audit : [];
    meta.audit.push(entry);
    await writeJson(metaPath, meta);

    t.status = 'applied';
    t.appliedAt = nowISO();

    const versionId = Date.now().toString(36);
    this.events.emit('spec.applied', { paths: [specPath], versionId, ticketId });
    return { ticket: t, specPath, versionId };
  }

  _can(action, who){
    // RBAC stub: allow all actions by default; extend as needed
    return true;
  }
}

export default Kernel;
