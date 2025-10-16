type ToastLevel = 'info'|'warn'|'error';
export type Toast = { id: string; message: string; level: ToastLevel; createdAt: number };
type Sub = (t: Toast) => void;
const subs = new Set<Sub>();

export const Notifs = {
  sub(fn: Sub){ subs.add(fn); return () => subs.delete(fn); },
  toast(message: string, level: ToastLevel = 'info'){
    const t: Toast = { id: Math.random().toString(36).slice(2), message, level, createdAt: Date.now() };
    subs.forEach(fn => fn(t));
    return t.id;
  }
};

