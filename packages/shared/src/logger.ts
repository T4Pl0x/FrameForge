const isDev = (() => {
  try {
    // Vite-style env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!((import.meta as any)?.env?.DEV ?? (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'));
  } catch {
    return typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
  }
})();

type Args = unknown[];

export const logger = {
  debug: (...args: Args) => { if (isDev) console.debug('[FF]', ...args); },
  info: (...args: Args) => { if (isDev) console.info('[FF]', ...args); },
  warn: (...args: Args) => { console.warn('[FF]', ...args); },
  error: (...args: Args) => { console.error('[FF]', ...args); },
};

export default logger;

