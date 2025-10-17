# Tool & Extension Registry

## registry.json Structure

The central registry at `tools/registry.json` defines available tools and extensions. It consists of three main arrays:

### tools[]

External APIs and integrations (left-pane Tool Hub):
- **Load via**: `/@fs` (dev) or built artifacts (prod)
- **Purpose**: Connect to external services like AI models, databases, etc.
- **Lifespan**: Hot-reloadable in dev, build artifacts in prod
- **Registration**: Register handlers with `register(host)` function

Example tool entry:
```json
{
  "name": "openai-gpt",
  "description": "OpenAI GPT completion API",
  "url": "https://cdn.jsdelivr.net/npm/@frameforge/tools-openai@1.0.0/dist/entry.js"
}
```

### extensions[]

OS extensions (OS Shell panel):
- **Load via**: Manifest-based loading (`manifest.module` vs `/@fs`)
- **Purpose**: Extend FrameForge OS UI and behavior
- **Lifespan**: Build-time resolution, modules persist across sessions
- **Registration**: Entry point returns extension component and mount handlers

Example extension entry:
```json
{
  "name": "ext-ui",
  "description": "Palette and Inspector UI tools",
  "url": "packages/ext-ui/src/entry.tsx"
}
```

### variants[]

Environment variants for testing:
- **Development**: Full hot-reload, dev tools enabled
- **Staging**: Production-like with debug logging
- **Production**: Optimized, extensions from built modules

## Development vs Production Loading

### Dev Mode (default)
- **Flag**: None (VITE_FF_EXT_PROD not set)
- **Extensions**: Load via `/@fs/packages/ext-*/src/entry.tsx`
- **Tools**: Hot-reload from source
- **Benefits**: Fast iteration, source maps, HMR

### Prod Mode (VITE_FF_EXT_PROD=1)
- **Flag**: `VITE_FF_EXT_PROD=1` in `.env.local`
- **Extensions**: Load via `manifest.module` path (built distribution)
- **Tools**: Load from CDN/npm artifacts
- **Benefits**: Realistic testing, module resolution, optimized bundles

### Switching Modes

```bash
# Dev mode
# Remove VITE_FF_EXT_PROD flag
pnpm dev

# Prod mode
echo 'VITE_FF_EXT_PROD=1' >> packages/app/.env.local
pnpm dev
```

## Extension Package Structure

Each extension at `packages/ext-$NAME/` must provide:

### manifest.json
```json
{
  "name": "ext-example",
  "version": "1.0.0",
  "entry": {
    "module": "./dist/entry.js",  // Prod path
    "worker": "./dist/worker.js"  // Optional background worker
  },
  "capabilities": ["read", "write"],
  "permissions": ["spec:read", "tools:call"]
}
```

### src/entry.tsx
```typescript
import React from 'react';
import MyExtension from './MyExtension';

export default MyExtension; // ← What kernel.loadExtension returns
```

### package.json
```json
{
  "name": "@frameforge/ext-example",
  "main": "dist/entry.js",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  }
}
```

## Tool Package Structure

Tools at `packages/tool-$NAME/` register capabilities:

### src/index.ts
```typescript
export function register(host: any) {
  host.registerTool('my-tool', {
    describe: { name: 'My Tool', description: '...' },
    call: async (req) => { /* tool logic */ }
  });
}
```

## Testing Extensions

### Unit Tests
```bash
pnpm -F @frameforge/ext-ui test
```

### Integration Tests
```bash
# Test extension loading
pnpm -F @frameforge/app test:integration
```

### OS Shell Tests
1. Ensure extension appears in OS Shell panel
2. Verify manifest.json validates (CI checks)
3. Test both dev and prod loading modes
4. Confirm UI integration doesn't break existing panels

## Deployment Considerations

- Extensions load at runtime - no app restart required
- Tool packages should use semantic versioning for reliability
- Registry updates require PR review and approvals
- Extension builds should be reproducible for prod loading
