// Minimal browser token store (session-scoped + expiry). For desktop, use OS keychain.
const KEY = 'ff.tokens.v1';

export type TokenName = 'openrouter' | 'github';

export function saveToken(name: TokenName, token: string, maxHours = 12) {
  const exp = Date.now() + maxHours * 60 * 60 * 1000;
  const payload = { [name]: { token, exp } };
  sessionStorage.setItem(KEY, btoa(JSON.stringify(payload)));
}

export function loadToken(name: TokenName): string | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const obj = JSON.parse(atob(raw));
    const entry = obj?.[name];
    if (!entry) return null;
    if (Date.now() > Number(entry.exp)) return null;
    return String(entry.token);
  } catch {
    return null;
  }
}

export function clearToken(name?: TokenName) {
  if (!name) return sessionStorage.removeItem(KEY);
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return;
  try {
    const obj = JSON.parse(atob(raw));
    if (obj[name]) delete obj[name];
    sessionStorage.setItem(KEY, btoa(JSON.stringify(obj)));
  } catch {
    sessionStorage.removeItem(KEY);
  }
}