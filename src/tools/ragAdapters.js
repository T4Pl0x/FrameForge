import { call } from './broker.js';

export async function getIndexStatus() {
  try {
    const res = await call('rag_indexer', 'status', {});
    return { ok: true, status: res.status || 'green' };
  } catch (e) {
    return { ok: false, status: 'red', error: String(e?.message || e) };
  }
}

export async function searchDocs(query) {
  return call('search_docs', 'search', { q: query });
}

