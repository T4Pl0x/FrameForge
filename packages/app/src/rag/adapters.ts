export async function listIndices(){
  try {
    // In dev UI, read via Vite /@fs from repo root if available
    const base = (import.meta as any).env?.VITE_REPO_ROOT as string | undefined;
    if (base) {
      const mod: any = await import(`/@fs/${base}/spec/data.json`);
      const json = mod?.default || mod;
      const indices = json?.rag?.indices || [];
      return indices.map((i: any) => ({ ...i, health: '🟢' }));
    }
  } catch {}
  return [];
}

export async function search(q: string){
  // Mock search results
  if (!q) return [];
  return [
    { title: `Result for "${q}" #1` },
    { title: `Result for "${q}" #2` }
  ];
}
