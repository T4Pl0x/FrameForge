// Minimal stub for UI extension worker isolation
self.onmessage = (ev) => {
  const { type, payload } = ev.data || {};
  if (type === 'ping') {
    self.postMessage({ type: 'pong', payload: { ok: true } });
  }
};

