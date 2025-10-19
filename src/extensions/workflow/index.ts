/**
 * Workflow Extension Entry Point
 * 
 * Registers the Workflow builder extension with FrameForge's extension system.
 * Provides dynamic registration of views, commands, and integration hooks.
 */

import React from 'react';
import type { ExtensionContext } from '../../kernel/KernelProvider';
import { WorkflowPanel } from './FlowCanvas';
import type { Flow, WorkflowCommand } from './flowTypes';

// Extension metadata
const EXTENSION_ID = 'workflow';
const EXTENSION_VERSION = '1.0.0';
const EXTENSION_NAME = 'Workflow Builder';

/**
 * Activate the Workflow extension
 */
export default async function activate(ctx: ExtensionContext) {
  const { viewRegistry, commandRegistry, eventBus, store } = ctx;

  // Register the Workflow panel view
  viewRegistry.registerView('workflow', {
    id: 'workflow',
    title: 'Workflow',
    icon: '🔄',
    description: 'No-code workflow and agent builder',
    component: WorkflowPanel,
    defaultRoute: '/workflow',
    permissions: ['read:workflow', 'write:workflow'],
  });

  // Register workflow commands
  const commands: WorkflowCommand[] = [
    {
      id: 'workflow:new',
      title: 'Workflow: New',
      description: 'Create a new workflow',
      icon: '➕',
      handler: () => createNewWorkflow(store),
      shortcut: 'ctrl+shift+n',
    },
    {
      id: 'workflow:compile',
      title: 'Workflow: Compile',
      description: 'Compile current workflow to runnable plan',
      icon: '🔨',
      handler: () => compileWorkflow(store),
      shortcut: 'ctrl+shift+b',
    },
    {
      id: 'workflow:debug',
      title: 'Workflow: Debug Trace',
      description: 'Run debug trace on current workflow',
      icon: '🐛',
      handler: () => debugWorkflow(store),
      shortcut: 'ctrl+shift+d',
    },
  ];

  commands.forEach(command => {
    commandRegistry.registerCommand(command.id, {
      title: command.title,
      description: command.description,
      icon: command.icon,
      handler: command.handler,
      shortcut: command.shortcut,
      category: 'workflow',
    });
  });

  // Register event handlers
  eventBus.on('workflow:node-added', handleNodeAdded);
  eventBus.on('workflow:node-removed', handleNodeRemoved);
  eventBus.on('workflow:edge-created', handleEdgeCreated);
  eventBus.on('workflow:edge-removed', handleEdgeRemoved);
  eventBus.on('workflow:flow-saved', handleFlowSaved);

  // Initialize default workflow if none exists
  await initializeDefaultWorkflow(store);

  return {
    id: EXTENSION_ID,
    version: EXTENSION_VERSION,
    name: EXTENSION_NAME,
    deactivate: () => {
      // Cleanup event listeners
      eventBus.off('workflow:node-added', handleNodeAdded);
      eventBus.off('workflow:node-removed', handleNodeRemoved);
      eventBus.off('workflow:edge-created', handleEdgeCreated);
      eventBus.off('workflow:edge-removed', handleEdgeRemoved);
      eventBus.off('workflow:flow-saved', handleFlowSaved);
    },
  };
}

/**
 * Create a new workflow
 */
async function createNewWorkflow(store: any): Promise<void> {
  const newFlow: Flow = {
    id: `flow-${Date.now()}`,
    name: 'New Workflow',
    description: 'Created from template',
    nodes: [],
    edges: [],
    meta: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['new'],
    },
  };

  // Save via proposal system
  await store.propose({
    target: '/spec/logic/flow.json',
    patch: [
      {
        op: 'add',
        path: '',
        value: newFlow,
      },
    ],
    rationale: 'Create new workflow',
  });
}

/**
 * Compile current workflow
 */
async function compileWorkflow(store: any): Promise<void> {
  try {
    const currentFlow = await store.get('/spec/logic/flow.json');
    if (!currentFlow) {
      throw new Error('No workflow found to compile');
    }

    // Emit compile event - will be handled by FlowCanvas
    store.eventBus.emit('workflow:compile-requested', { flow: currentFlow });
  } catch (error) {
    console.error('Failed to compile workflow:', error);
    store.eventBus.emit('workflow:error', {
      type: 'compile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Run debug trace on current workflow
 */
async function debugWorkflow(store: any): Promise<void> {
  try {
    const currentFlow = await store.get('/spec/logic/flow.json');
    if (!currentFlow) {
      throw new Error('No workflow found to debug');
    }

    // Emit debug event - will be handled by FlowCanvas
    store.eventBus.emit('workflow:debug-requested', { flow: currentFlow });
  } catch (error) {
    console.error('Failed to debug workflow:', error);
    store.eventBus.emit('workflow:error', {
      type: 'debug',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Initialize default workflow if none exists
 */
async function initializeDefaultWorkflow(store: any): Promise<void> {
  try {
    const existingFlow = await store.get('/spec/logic/flow.json');
    if (!existingFlow) {
      await createNewWorkflow(store);
    }
  } catch (error) {
    // File doesn't exist, create default
    await createNewWorkflow(store);
  }
}

// Event handlers
function handleNodeAdded(event: CustomEvent): void {
  const { nodeId, nodeType, position } = event.detail;
  console.log(`Node added: ${nodeId} (${nodeType}) at ${position.x},${position.y}`);
}

function handleNodeRemoved(event: CustomEvent): void {
  const { nodeId } = event.detail;
  console.log(`Node removed: ${nodeId}`);
}

function handleEdgeCreated(event: CustomEvent): void {
  const { edgeId, fromNode, toNode } = event.detail;
  console.log(`Edge created: ${edgeId} from ${fromNode} to ${toNode}`);
}

function handleEdgeRemoved(event: CustomEvent): void {
  const { edgeId } = event.detail;
  console.log(`Edge removed: ${edgeId}`);
}

function handleFlowSaved(event: CustomEvent): void {
  const { flowId, flowName } = event.detail;
  console.log(`Flow saved: ${flowId} (${flowName})`);
}

// Export extension metadata
export const extension = {
  id: EXTENSION_ID,
  version: EXTENSION_VERSION,
  name: EXTENSION_NAME,
  description: 'No-code workflow and agent builder for FrameForge',
  author: 'FrameForge Team',
  dependencies: ['kernel', 'ui-creator'],
};