export async function listIndices(){
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const raw = await fs.readFile(path.join(process.cwd(), 'spec', 'data.json'), 'utf8');
    const json = JSON.parse(raw);
    const indices = json?.rag?.indices || [];
    return indices.map((i: any) => ({ ...i, health: '🟢' }));
  } catch {
    return [];
  }
}

export async function search(q: string){
  // Mock search results
  if (!q) return [];
  return [
    { title: `Result for "${q}" #1` },
    { title: `Result for "${q}" #2` }
  ];
}

