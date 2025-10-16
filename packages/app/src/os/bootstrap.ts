import { Notifs } from "@frameforge/os";
import { createExtHost } from "./extHost";
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
        if (mod && typeof mod.default === 'function') { mod.default(host); count++; }
      }
      if (count) Notifs.toast(`Loaded ${count} extension(s)`, 'info');
    } catch (e) {
      console.warn('Codegen dev load failed:', e);
    }
  }
}
