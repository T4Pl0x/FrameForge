export async function migrate({ root, files }) {
  // No-op migration example
  return files.map((f) => ({ file: f, patch: [] }));
}

