import { applyPatch, validatePatch } from './jsonPatch.js';

export function createSpecStore(options = {}) {
  const { initialSpec = {}, persist = 'localStorage', key = 'frameforge-spec-v1' } = options;
  let spec = load();
  let version = 1;

  function load() {
    if (persist === 'localStorage' && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : initialSpec;
      } catch { return initialSpec; }
    }
    return initialSpec;
  }

  function save(next) {
    if (persist === 'localStorage' && typeof window !== 'undefined') {
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch {}
    }
  }

  function snapshot() { return { spec, version }; }

  function get(path) {
    if (!path) return spec;
    return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), spec);
  }

  function set(next) {
    spec = next;
    version += 1;
    save(spec);
  }

  function diff(from, to) {
    // Minimal diff: caller should provide patches; this returns a replace-all if different
    if (JSON.stringify(from) === JSON.stringify(to)) return [];
    return [{ op: 'replace', path: '', value: to }];
  }

  function apply(patch) {
    const { ok, errors } = validatePatch(patch);
    if (!ok) return { ok, errors };
    const next = applyPatch(spec, patch);
    set(next);
    return { ok: true, errors: [] };
  }

  return { snapshot, get, set, diff, apply };
}

