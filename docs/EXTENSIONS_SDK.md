# FrameForge Extensions SDK (v1)

## Manifest
Provide an `id`, declared permissions, and an `activate()` entry.

## Registration APIs
```ts
import { registerView } from "src/os/registry/viewRegistry";
import { registerExtension } from "src/os/registry/extensionRegistry";

export default function activate(kernel: any) {
  registerView("my-panel", <MyPanel />);
  registerExtension({
    id: "my-ext",
    activate: () => ({
      commands: [
        { title: "My Command", run: () => { /* ... */ } }
      ]
    })
  });
}
```

## Loading Extensions (Dev)
In development, you can load local extensions using the kernel host utilities:

```ts
// packages/kernel/src/host/extensions.ts
import { bootExtensions } from '@frameforge/kernel/src/host/extensions';

// Example: boot 2 local extensions using Vite /@fs URLs
const count = await bootExtensions([
  '/@fs/ABSOLUTE/PATH/packages/ext-ui',
  '/@fs/ABSOLUTE/PATH/packages/ext-mermaid'
], () => ({
  // Provide capabilities/context the extension receives
  propose: async (patches) => window.dispatchEvent(new CustomEvent('ff.proposal', { detail: { patches } })),
}));

console.log(`Booted ${count} extensions`);
```

## Proposal Path
All writes must funnel through proposal patches, e.g. `AppState.io.propose(RFC6902[])`.

## Do / Don’t
- Do: Contribute views/commands; keep modules small.
- Do: Use proposal patches; validate inputs.
- Don’t: Directly mutate specs or kernel state.
