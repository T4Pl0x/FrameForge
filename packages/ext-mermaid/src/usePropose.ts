// Dev: uses Vite dev endpoint; Prod: falls back to UI hint
export async function proposePatch(patches: unknown[], provenance = "@frameforge/ext-mermaid") {
  const body = { ticketId: `mermaid-${Date.now()}`, createdAt: new Date().toISOString(), provenance, patches };
  try {
    const res = await fetch("/__ff/propose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`propose failed: ${res.status}`);
    return await res.json(); // { ok, ticketId }
  } catch {
    console.warn("Dev propose endpoint not available; use Approvals to apply JSON patch manually.");
    return { ok: false };
  }
}
