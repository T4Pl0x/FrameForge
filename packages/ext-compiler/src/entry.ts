// Minimal dev entry: open a window and, in dev, trigger a proposal artifact via dev endpoint
type Ctx = { openWindow: (opts: { title: string; render: () => any }) => void };

export default async function entry(ctx: Ctx) {
  try { ctx.openWindow({ title: 'Compiler', render: () => 'Compiler ready (dev)' }); } catch {}
  // In dev only, ask the dev server to emit a proposal artifact from codegen
  // Approvals Drawer can then apply it to tools/registry.json
  try {
    await fetch("/__ff/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target: "web", spec: "builder-output.json", out: "packages/ext-demoapp-web", mode: "proposal" })
    });
  } catch {}
}
