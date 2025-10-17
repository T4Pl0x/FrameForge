export async function proposePatch(patches: unknown[], provenance = "@frameforge/ext-assistant") {
  const body = { ticketId: `assistant-${Date.now()}`, createdAt: new Date().toISOString(), provenance, patches };
  try {
    const res = await fetch("/__ff/propose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`propose failed: ${res.status}`);
    return await res.json();
  } catch {
    console.warn("Dev propose endpoint not available; use Approvals to apply JSON patch manually.");
    return { ok: false };
  }
}
