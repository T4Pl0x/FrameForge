import { createUiExtension } from '../packages/ext-ui/src/index.js';
import { createCompilerExtension } from '../packages/ext-compiler/src/index.js';
import { createSandboxExtension } from '../packages/ext-sandbox/src/index.js';
import { createPublishExtension } from '../packages/ext-publish/src/index.js';

export function registerExtensions(kernel) {
  const host = kernel.host;
  const extUi = createUiExtension();
  const extCompiler = createCompilerExtension();
  const ui = extUi.register(host);
  const compiler = extCompiler.register(host);
  const sandbox = createSandboxExtension().register(host);
  const publish = createPublishExtension().register(host);
  return { ui, compiler, sandbox, publish };
}
