import { Notifs } from "@frameforge/os";
import { createExtHost } from "./extHost";
import { kernel } from "../kernel";
import { DEV_EXTENSION_BASES } from "./dev-extensions.generated";
import { createBrokerContext } from "../broker/index";

// Dev boot: called on app start in OS mode to show a sample toast and simulate loading extensions
export async function osDevBoot(){
  Notifs.toast('OS desktop ready (dev boot).', 'info');
  // Auto-load generated web extensions in dev based on generated index
  if (DEV_EXTENSION_BASES.length) {
    try {
      const host = createExtHost();
      let count = 0;
      for (const base of DEV_EXTENSION_BASES) {
        // load manifest for permissions and name
        let permsArr: string[] = [];
        let extName = '@dev/extension';
        try {
          const man: any = await import(`${base}/manifest.json`);
          const m = man?.default || man;
          if (m?.name) extName = m.name as string;
          if (Array.isArray(m?.permissions)) permsArr = m.permissions as string[];
        } catch {}
        const mod: any = await import(`${base}/src/entry.tsx`);
        if (mod) {
          if (typeof mod.default === 'function') { mod.default(host); count++; continue; }
          if (mod.entry && typeof mod.entry.mount === 'function') {
            const ctx = {
              bus: document,
              propose: async (diffs: any[], opts?: { rationale?: string }) => {
                if (!(permsArr.includes('propose:spec') || permsArr.includes('*'))) {
                  Notifs.toast('Permission denied: propose:spec', 'error');
                  throw new Error('Permission denied: propose:spec');
                }
                kernel.host.proposals.submit({
                  title: opts?.rationale || 'Extension proposal',
                  rationale: opts?.rationale || '',
                  labels: ['extension','dev'],
                  scope: ['overlays'],
                  sourceExtension: extName,
                  diffs
                });
              },
              broker: async (req: any) => {
                const b = createBrokerContext(new Set(permsArr));
                try { return await b.call(req); }
                catch (e: any) { Notifs.toast(e?.message || 'broker error', 'error'); throw e; }
              },
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
