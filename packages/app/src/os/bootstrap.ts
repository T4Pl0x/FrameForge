import { Notifs } from "@frameforge/os";
import { DEV_EXTENSION_BASES } from "./dev-extensions.generated";
import { bootExtensions } from "@kernel/host/extensions";
import { WM } from "@frameforge/os";
import { createExtHost } from "./extHost";

// Dev boot: called on app start in OS mode to show a sample toast and simulate loading extensions
export async function osDevBoot(){
  Notifs.toast('OS desktop ready (dev boot).', 'info');
  const ctxFactory = () => createExtHost();
  const count = await bootExtensions([...DEV_EXTENSION_BASES], ctxFactory);
  if (count > 0) Notifs.toast(`Loaded ${count} extension(s)`, 'info');
}
