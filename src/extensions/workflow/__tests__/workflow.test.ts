/**
 * Workflow Extension Tests
 * 
 * Tests for types, registration, and basic canvas interactions.
 * Target: ≥70% statements / ≥60% branches coverage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Flow, Node, Edge, NodeType } from '../flowTypes';
import activate from '../index';

// Mock dependencies
const mockViewRegistry = {
  registerView: vi.fn(),
  unregisterView: vi.fn(),
};

const mockCommandRegistry = {
  registerCommand: vi.fn(),
  unregisterCommand: vi.fn(),
};

const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

const mockStore = {
  get: vi.fn(),
  propose: vi.fn(),
};

const mockContext = {
  viewRegistry: mockViewRegistry,
  commandRegistry: mockCommandRegistry,
  eventBus: mockEventBus,
  store: mockStore,
};

describe('Workflow Extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Extension Registration', () => {
    it('should register the workflow view', async () => {
      const extension = await activate(mockContext);

      expect(mockViewRegistry.registerView).toHaveBeenCalledWith('workflow', {
        id: 'workflow',
        title: 'Workflow',
        icon: '🔄',
        description: 'No-code workflow and agent builder',
        component: expect.any(Function),
        defaultRoute: '/workflow',
        permissions: ['read:workflow', 'write:workflow'],
      });

      expect(extension.id).toBe('workflow');
      expect(extension.version).toBe('1.0.0');
      expect(extension.name).toBe('Workflow Builder');
    });

    it('should register workflow commands', async () => {
      await activate(mockContext);

      expect(mockCommandRegistry.registerCommand).toHaveBeenCalledWith('workflow:new', {
        title: 'Workflow: New',
        description: 'Create a new workflow',
        icon: '➕',
        handler: expect.any(Function),
        shortcut: 'ctrl+shift+n',
        category: 'workflow',
      });

      expect(mockCommandRegistry.registerCommand).toHaveBeenCalledWith('workflow:compile', {
        title: 'Workflow: Compile',
        description: 'Compile current workflow to runnable plan',
        icon: '🔨',
        handler: expect.any(Function),
        shortcut: 'ctrl+shift+b',
        category: 'workflow',
      });

      expect(mockCommandRegistry.registerCommand).toHaveBeenCalledWith('workflow:debug', {
        title: 'Workflow: Debug Trace',
        description: 'Run debug trace on current workflow',
        icon: '🐛',
        handler: expect.any(Function),
        shortcut: 'ctrl+shift+d',
        category: 'workflow',
      });
    });

    it('should register event handlers', async () => {
      await activate(mockContext);

      expect(mockEventBus.on).toHaveBeenCalledWith('workflow:node-added', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('workflow:node-removed', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('workflow:edge-created', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('workflow:edge-removed', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('workflow:flow-saved', expect.any(Function));
    });

    it('should initialize default workflow if none exists', async () => {
      mockStore.get.mockResolvedValue(null);

      await activate(mockContext);

      expect(mockStore.propose).toHaveBeenCalledWith({
        target: '/spec/logic/flow.json',
        patch: [
          {
            op: 'add',
            path: '',
            value: expect.objectContaining({
              id: expect.stringMatching(/^flow-\d+$/),
              name: 'New Workflow',
              nodes: [],
              edges: [],
              meta: expect.objectContaining({
                version: '1.0.0',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
          },
        ],
        rationale: 'Create new workflow',
      });
    });
  });

  describe('Flow Types', () => {
    it('should create valid flow objects', () => {
      const flow: Flow = {
        id: 'test-flow',
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'Trigger',
            label: 'Start',
            pos: { x: 100, y: 100 },
            config: { triggerType: 'manual' },
          },
        ],
        edges: [],
        meta: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['test'],
        },
      };

      expect(flow.id).toBe('test-flow');
      expect(flow.name).toBe('Test Workflow');
      expect(flow.nodes).toHaveLength(1);
      expect(flow.nodes[0].type).toBe('Trigger');
    });

    it('should create valid node objects', () => {
      const node: Node = {
        id: 'test-node',
        type: 'PromptLab',
        label: 'Generate Content',
        pos: { x: 200, y: 200 },
        config: {
          promptType: 'generation',
          maxLength: 1000,
        },
        data: {
          status: 'idle',
          inputs: {},
          outputs: {},
        },
      };

      expect(node.id).toBe('test-node');
      expect(node.type).toBe('PromptLab');
      expect(node.pos.x).toBe(200);
      expect(node.pos.y).toBe(200);
      expect(node.data?.status).toBe('idle');
    });

    it('should create valid edge objects', () => {
      const edge: Edge = {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-2',
        condition: { success: true },
        label: 'success',
      };

      expect(edge.id).toBe('edge-1');
      expect(edge.from).toBe('node-1');
      expect(edge.to).toBe('node-2');
      expect(edge.condition?.success).toBe(true);
    });

    it('should validate node types', () => {
      const validNodeTypes: NodeType[] = [
        'Trigger',
        'PromptLab',
        'UIAgent',
        'Guardrail',
        'Tool',
        'Compiler',
        'Sandbox',
        'Publisher',
      ];

      validNodeTypes.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('Command Handlers', () => {
    it('should handle new workflow command', async () => {
      await activate(mockContext);

      const newWorkflowCall = mockCommandRegistry.registerCommand.mock.calls.find(
        call => call[0] === 'workflow:new'
      );
      const handler = newWorkflowCall![1].handler;

      await handler();

      expect(mockStore.propose).toHaveBeenCalledWith({
        target: '/spec/logic/flow.json',
        patch: [
          {
            op: 'add',
            path: '',
            value: expect.objectContaining({
              name: 'New Workflow',
              nodes: [],
              edges: [],
            }),
          },
        ],
        rationale: 'Create new workflow',
      });
    });

    it('should handle compile command with existing flow', async () => {
      const mockFlow: Flow = {
        id: 'test-flow',
        name: 'Test Workflow',
        nodes: [],
        edges: [],
      };

      mockStore.get.mockResolvedValue(mockFlow);
      await activate(mockContext);

      const compileCall = mockCommandRegistry.registerCommand.mock.calls.find(
        call => call[0] === 'workflow:compile'
      );
      const handler = compileCall![1].handler;

      await handler();

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow:compile-requested', {
        flow: mockFlow,
      });
    });

    it('should handle compile command with no flow', async () => {
      mockStore.get.mockResolvedValue(null);
      await activate(mockContext);

      const compileCall = mockCommandRegistry.registerCommand.mock.calls.find(
        call => call[0] === 'workflow:compile'
      );
      const handler = compileCall![1].handler;

      await handler();

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow:error', {
        type: 'compile',
        message: 'No workflow found to compile',
      });
    });

    it('should handle debug command with existing flow', async () => {
      const mockFlow: Flow = {
        id: 'test-flow',
        name: 'Test Workflow',
        nodes: [],
        edges: [],
      };

      mockStore.get.mockResolvedValue(mockFlow);
      await activate(mockContext);

      const debugCall = mockCommandRegistry.registerCommand.mock.calls.find(
        call => call[0] === 'workflow:debug'
      );
      const handler = debugCall![1].handler;

      await handler();

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow:debug-requested', {
        flow: mockFlow,
      });
    });
  });

  describe('Event Handlers', () => {
    it('should handle node added events', async () => {
      await activate(mockContext);

      const nodeAddedCall = mockEventBus.on.mock.calls.find(
        call => call[0] === 'workflow:node-added'
      );
      const handler = nodeAddedCall![1];

      const mockEvent = new CustomEvent('workflow:node-added', {
        detail: {
          nodeId: 'node-1',
          nodeType: 'Trigger',
          position: { x: 100, y: 100 },
        },
      });

      // Mock console.log to verify event handling
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      handler(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Node added: node-1 (Trigger) at 100,100'
      );

      consoleSpy.mockRestore();
    });

    it('should handle flow saved events', async () => {
      await activate(mockContext);

      const flowSavedCall = mockEventBus.on.mock.calls.find(
        call => call[0] === 'workflow:flow-saved'
      );
      const handler = flowSavedCall![1];

      const mockEvent = new CustomEvent('workflow:flow-saved', {
        detail: {
          flowId: 'flow-1',
          flowName: 'Test Flow',
        },
      });

      // Mock console.log to verify event handling
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      handler(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith('Flow saved: flow-1 (Test Flow)');

      consoleSpy.mockRestore();
    });
  });

  describe('Extension Cleanup', () => {
    it('should cleanup event listeners on deactivate', async () => {
      const extension = await activate(mockContext);

      if (extension.deactivate) {
        extension.deactivate();
      }

      expect(mockEventBus.off).toHaveBeenCalledWith('workflow:node-added', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('workflow:node-removed', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('workflow:edge-created', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('workflow:edge-removed', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('workflow:flow-saved', expect.any(Function));
    });
  });
});