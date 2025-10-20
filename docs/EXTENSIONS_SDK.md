# FrameForge Extensions SDK (v1)

## Manifest
Provide a `name`, declared `capabilities` and `permissions`, and an `entry` module path. Example:

```json
{
  "name": "@frameforge/ext-ui",
  "version": "1.0.0",
  "entry": "src/entry.tsx",
  "capabilities": ["componentPalette","inspectorPanels","canvasTools","tutorials","proposeSpecDiff"],
  "permissions": ["propose:spec"]
}
```

## Entry Contract
Extensions export a default function `entry(ctx)` that can open windows or run tasks.

```ts
type Ctx = { openWindow: (opts: { title: string; component: React.ComponentType }) => void };
export default function entry(ctx: Ctx){
  ctx.openWindow({ title: 'My Panel', component: MyPanel });
}
```

## Loading Extensions (Dev)
Use the kernel host loader to boot local extensions via Vite `/@fs` URLs.

```ts
import { bootExtensions } from '@kernel/host/extensions';
const count = await bootExtensions([
  '/@fs/ABSOLUTE/PATH/packages/ext-ui',
  '/@fs/ABSOLUTE/PATH/packages/ext-mermaid'
], () => ({ openWindow: ({ title, component }) => WM.open({ title, component }) }));
```

## Proposal Path
All writes must funnel through proposal patches, e.g. kernel `proposals.propose({ target, patch, rationale })`. Geometry/layout patches are restricted to `@frameforge/ext-ui`.

## Security & Isolation
- Dev server exposes `__ff/*` endpoints gated by `VITE_EXPOSE_DEV=1`.
- GH operations are proxied via `/__ff/gh/*` (no browser tokens). Use `broker` helpers.
- For production, run extensions in workers/iframes with timeouts and memory caps; manifests declare minimal permissions.

## Do / Don’t
- Do: Contribute views/commands; keep modules small.
- Do: Use proposal patches; validate inputs.
- Don’t: Directly mutate specs or kernel state.
