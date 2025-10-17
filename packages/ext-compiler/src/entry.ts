import { buildLogicProposal, buildTestsProposal } from "./propose";

// Host APIs injected by the OS at runtime
declare const kernel: {
  proposals: { propose: (p: any) => Promise<{ ok: boolean; ticketId: string }> };
  spec: { read: (path: string) => Promise<unknown> };
};
declare const Notifs: { toast: (msg: string) => void };

export default async function register() {
  // minimal UI-less extension: autogenerate proposals on load behind a flag
  const ui = await kernel.spec.read("/spec/ui.json");
  const data = await kernel.spec.read("/spec/data.json");
  const p1 = buildLogicProposal(ui, data);
  const p2 = buildTestsProposal(ui);

  for (const p of [p1, p2]) {
    // cap patches for safety (UI already enforces, but double-guard)
    if (p.patches.length > 10) continue;
    const res = await kernel.proposals.propose({
      target: p.target,
      diffs: p.patches,
      openQuestions: p.openQuestions,
      provenance: p.provenance
    });
    if (res?.ok) Notifs.toast(`Compiler proposed: ${res.ticketId}`);
  }
}
