import { Notifs } from "@frameforge/os";
import { createExtHost } from "./extHost";
import { kernel } from "../kernel";
import { DEV_EXTENSION_BASES } from "./dev-extensions.generated";

// Dev boot: called on app start in OS mode to show a sample toast and simulate loading extensions
export async function osDevBoot(){
  Notifs.toast('OS desktop ready (dev boot).', 'info');
  // Auto-load generated web extensions in dev based on generated index
  if (DEV_EXTENSION_BASES.length) {
    try {
      const host = createExtHost();
      let count = 0;
      for (const base of DEV_EXTENSION_BASES) {
        const mod: any = await import(`${base}/src/entry.tsx`);
        if (mod) {
          if (typeof mod.default === 'function') { mod.default(host); count++; continue; }
          if (mod.entry && typeof mod.entry.mount === 'function') {
            const ctx = {
              bus: document,
              propose: async (diffs: any[], opts?: { rationale?: string }) => {
                kernel.host.proposals.submit({
                  title: opts?.rationale || 'Extension proposal',
                  rationale: opts?.rationale || '',
                  labels: ['extension','dev'],
                  scope: ['overlays'],
                  sourceExtension: '@dev/extension',
                  diffs
                });
              },
              broker: async (_req: any) => ({ ok: true }),
              permissions: new Set(["propose:spec"]) as Set<string>,
              openWindow: ({ title, component }: { title: string; component: React.FC }) => {
                host.openWindow({ title, component });
              }
            };
            mod.entry.mount(ctx);
            count++;
            continue;
          }
        }
      }
      if (count) Notifs.toast(`Loaded ${count} extension(s)`, 'info');
    } catch (e) {
      console.warn('Codegen dev load failed:', e);
    }
  }
}
