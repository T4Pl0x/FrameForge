/**
 * Integrated Tests for Edge Store, Edge Layer, and Refactor Pass
 * 
 * Tests for Slice 2 functionality: edge creation, validation, and refactor warnings.
 * Target: ≥70% statements / ≥60% branches coverage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Flow, Node, Edge } from '../flowTypes';
import { EdgeStore } from '../edges/edgeStore';
import { runRefactor, isFlowValid, getValidationSummary, type RefactorOptions } from '../refactor';

// Mock DOM for EdgeLayer tests
const mockElement = {
  getBoundingClientRect: vi.fn(() => ({
    left: 100,
    top: 100,
    width: 20,
    height: 20,
    right: 120,
    bottom: 120,
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockDocument = {
  querySelectorAll: vi.fn(() => [mockElement]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock SVG element
const mockSVGElement = {
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  })),
};

// Global mocks
global.document = mockDocument as any;
global.SVGElement = mockSVGElement as any;

describe('Edge Store', () => {
  let edgeStore: EdgeStore;
  let mockNodes: Node[];

  beforeEach(() => {
    edgeStore = new EdgeStore();
    mockNodes = [
      {
        id: 'node-1',
        type: 'Trigger',
        label: 'Start Trigger',
        pos: { x: 100, y: 100 },
        config: { triggerType: 'manual' },
      },
      {
        id: 'node-2',
        type: 'Guardrail',
        label: 'Input Guardrail',
        pos: { x: 300, y: 100 },
        config: { ruleType: 'pii' },
      },
      {
        id: 'node-3',
        type: 'PromptLab',
        label: 'Content Generator',
        pos: { x: 500, y: 100 },
        config: { promptType: 'generation', maxLength: 1200 },
      },
    ];
  });

  describe('Edge CRUD Operations', () => {
    it('should add a valid edge', () => {
      const edge: Edge = {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-2',
      };

      const result = edgeStore.addEdge(edge);
      expect(result.isValid).toBe(true);
      expect(edgeStore.getEdge('edge-1')).toEqual(edge);
    });

    it('should reject duplicate edges', () => {
      const edge: Edge = {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-2',
      };

      edgeStore.addEdge(edge);
      const duplicateEdge: Edge = {
        id: 'edge-2',
        from: 'node-1',
        to: 'node-2',
      };

      const result = edgeStore.addEdge(duplicateEdge);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Edge already exists between these nodes');
    });

    it('should reject self-connections', () => {
      const edge: Edge = {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-1',
      };

      const result = edgeStore.addEdge(edge);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cannot connect node to itself');
    });

    it('should remove an edge', () => {
      const edge: Edge = {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-2',
      };

      edgeStore.addEdge(edge);
      const removed = edgeStore.removeEdge('edge-1');
      expect(removed).toBe(true);
      expect(edgeStore.getEdge('edge-1')).toBeUndefined();
    });

    it('should return false when removing non-existent edge', () => {
      const removed = edgeStore.removeEdge('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Graph Traversal', () => {
    beforeEach(() => {
      // Set up a simple chain: node-1 -> node-2 -> node-3
      edgeStore.addEdge({ id: 'edge-1', from: 'node-1', to: 'node-2' });
      edgeStore.addEdge({ id: 'edge-2', from: 'node-2', to: 'node-3' });
    });

    it('should traverse reachable nodes', () => {
      const result = edgeStore.traverseGraph('node-1', mockNodes);
      expect(result.reachableNodes.has('node-1')).toBe(true);
      expect(result.reachableNodes.has('node-2')).toBe(true);
      expect(result.reachableNodes.has('node-3')).toBe(true);
      expect(result.hasCycle).toBe(false);
    });

    it('should detect cycles', () => {
      // Add edge creating cycle: node-3 -> node-1
      edgeStore.addEdge({ id: 'edge-3', from: 'node-3', to: 'node-1' });
      
      const result = edgeStore.traverseGraph('node-1', mockNodes);
      expect(result.hasCycle).toBe(true);
      expect(result.path).toBeDefined();
    });

    it('should check fan-out correctly', () => {
      // Add another edge from node-1
      edgeStore.addEdge({ id: 'edge-4', from: 'node-1', to: 'node-2' });
      
      const fanOut = edgeStore.getFanOut('node-1');
      expect(fanOut).toBe(2);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect potential cycles before adding edges', () => {
      // Set up chain: node-1 -> node-2 -> node-3
      edgeStore.addEdge({ id: 'edge-1', from: 'node-1', to: 'node-2' });
      edgeStore.addEdge({ id: 'edge-2', from: 'node-2', to: 'node-3' });

      // Check if adding node-3 -> node-1 would create a cycle
      const wouldCreateCycle = edgeStore.wouldCreateCycle('node-3', 'node-1', mockNodes);
      expect(wouldCreateCycle).toBe(true);
    });

    it('should allow non-cyclic connections', () => {
      const wouldCreateCycle = edgeStore.wouldCreateCycle('node-1', 'node-2', mockNodes);
      expect(wouldCreateCycle).toBe(false);
    });
  });

  describe('Node Type Validation', () => {
    it('should count nodes by type correctly', () => {
      const toolNode: Node = {
        id: 'node-4',
        type: 'Tool',
        label: 'API Tool',
        pos: { x: 700, y: 100 },
        config: { toolType: 'http' },
      };

      const nodesWithTool = [...mockNodes, toolNode];
      const toolCount = edgeStore.countNodesByType(nodesWithTool, 'Tool');
      expect(toolCount).toBe(1);
    });

    it('should validate guardrail positioning', () => {
      // Set up valid flow: Trigger -> Guardrail -> PromptLab
      edgeStore.addEdge({ id: 'edge-1', from: 'node-1', to: 'node-2' });
      edgeStore.addEdge({ id: 'edge-2', from: 'node-2', to: 'node-3' });

      const hasGuardrail = edgeStore.hasGuardrailBefore(mockNodes, ['PromptLab']);
      expect(hasGuardrail).toBe(true);
    });

    it('should detect missing guardrails', () => {
      // Set up invalid flow: Trigger -> PromptLab (no Guardrail)
      edgeStore.addEdge({ id: 'edge-1', from: 'node-1', to: 'node-3' });

      const hasGuardrail = edgeStore.hasGuardrailBefore(mockNodes, ['PromptLab']);
      expect(hasGuardrail).toBe(false);
    });
  });
});

describe('Refactor Pass', () => {
  let mockFlow: Flow;
  let mockNodes: Node[];
  let mockEdges: Edge[];

  beforeEach(() => {
    mockNodes = [
      {
        id: 'node-1',
        type: 'Trigger',
        label: 'Start',
        pos: { x: 100, y: 100 },
        config: { triggerType: 'manual' },
      },
      {
        id: 'node-2',
        type: 'Guardrail',
        label: 'Guardrail',
        pos: { x: 300, y: 100 },
        config: { ruleType: 'pii' },
      },
      {
        id: 'node-3',
        type: 'PromptLab',
        label: 'Generator',
        pos: { x: 500, y: 100 },
        config: { 
          promptType: 'generation', 
          maxLength: 1200,
          template: 'Generate a short response',
        },
      },
      {
        id: 'node-4',
        type: 'UIAgent',
        label: 'UI Modifier',
        pos: { x: 700, y: 100 },
        config: { actionType: 'modify' },
      },
    ];

    mockEdges = [
      { id: 'edge-1', from: 'node-1', to: 'node-2' },
      { id: 'edge-2', from: 'node-2', to: 'node-3' },
      { id: 'edge-3', from: 'node-3', to: 'node-4' },
    ];

    mockFlow = {
      id: 'test-flow',
      name: 'Test Workflow',
      nodes: mockNodes,
      edges: mockEdges,
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  });

  describe('Guardrail Validation', () => {
    it('should pass when guardrails are properly positioned', () => {
      const warnings = runRefactor(mockFlow);
      const guardrailWarnings = warnings.filter(w => w.code.includes('GUARDRAIL'));
      expect(guardrailWarnings).toHaveLength(0);
    });

    it('should warn when no guardrails exist', () => {
      const flowWithoutGuardrail = {
        ...mockFlow,
        nodes: mockNodes.filter(n => n.type !== 'Guardrail'),
        edges: mockEdges.filter(e => e.to !== 'node-2' && e.from !== 'node-2'),
      };

      const warnings = runRefactor(flowWithoutGuardrail);
      const guardrailWarnings = warnings.filter(w => w.code.includes('GUARDRAIL'));
      expect(guardrailWarnings.length).toBeGreaterThan(0);
      expect(guardrailWarnings[0].severity).toBe('block');
    });

    it('should warn when guardrails are not in path', () => {
      const flowWithMisplacedGuardrail = {
        ...mockFlow,
        edges: [
          { id: 'edge-1', from: 'node-1', to: 'node-3' }, // Skip guardrail
          { id: 'edge-2', from: 'node-2', to: 'node-4' }, // Guardrail not in main path
        ],
      };

      const warnings = runRefactor(flowWithMisplacedGuardrail);
      const guardrailWarnings = warnings.filter(w => w.code.includes('GUARDRAIL'));
      expect(guardrailWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect cycles in workflow', () => {
      const flowWithCycle = {
        ...mockFlow,
        edges: [
          ...mockEdges,
          { id: 'edge-4', from: 'node-4', to: 'node-1' }, // Creates cycle
        ],
      };

      const warnings = runRefactor(flowWithCycle);
      const cycleWarnings = warnings.filter(w => w.code === 'CYCLE_DETECTED');
      expect(cycleWarnings.length).toBe(1);
      expect(cycleWarnings[0].severity).toBe('block');
    });

    it('should pass for acyclic workflows', () => {
      const warnings = runRefactor(mockFlow);
      const cycleWarnings = warnings.filter(w => w.code === 'CYCLE_DETECTED');
      expect(cycleWarnings).toHaveLength(0);
    });
  });

  describe('Fan-out Validation', () => {
    it('should warn when fan-out exceeds limit', () => {
      const flowWithHighFanOut = {
        ...mockFlow,
        edges: [
          { id: 'edge-1', from: 'node-2', to: 'node-3' },
          { id: 'edge-2', from: 'node-2', to: 'node-4' },
          { id: 'edge-3', from: 'node-2', to: 'node-1' },
          { id: 'edge-4', from: 'node-2', to: 'node-3' },
          { id: 'edge-5', from: 'node-2', to: 'node-4' }, // 5 edges from node-2
        ],
      };

      const options: RefactorOptions = { maxFanOut: 4 };
      const warnings = runRefactor(flowWithHighFanOut, options);
      const fanOutWarnings = warnings.filter(w => w.code === 'FAN_OUT_EXCEEDED');
      expect(fanOutWarnings.length).toBe(1);
      expect(fanOutWarnings[0].severity).toBe('warn');
    });
  });

  describe('Prompt Length Validation', () => {
    it('should warn when prompt exceeds limit', () => {
      const flowWithLongPrompt = {
        ...mockFlow,
        nodes: mockNodes.map(node => 
          node.type === 'PromptLab' 
            ? {
                ...node,
                config: {
                  ...node.config,
                  template: 'A'.repeat(1500), // Exceeds default 1200 limit
                },
              }
            : node
        ),
      };

      const warnings = runRefactor(flowWithLongPrompt);
      const promptWarnings = warnings.filter(w => w.code === 'PROMPT_TOO_LONG');
      expect(promptWarnings.length).toBe(1);
      expect(promptWarnings[0].severity).toBe('warn');
    });
  });

  describe('Tool Budget Validation', () => {
    it('should warn when tool budget is exceeded', () => {
      const toolNodes: Node[] = Array.from({ length: 8 }, (_, i) => ({
        id: `tool-${i}`,
        type: 'Tool',
        label: `Tool ${i}`,
        pos: { x: 100 + i * 50, y: 200 },
        config: { toolType: 'http' },
      }));

      const flowWithManyTools = {
        ...mockFlow,
        nodes: [...mockNodes, ...toolNodes],
      };

      const options: RefactorOptions = { toolBudget: 6 };
      const warnings = runRefactor(flowWithManyTools, options);
      const toolWarnings = warnings.filter(w => w.code === 'TOOL_BUDGET_EXCEEDED');
      expect(toolWarnings.length).toBe(1);
      expect(toolWarnings[0].severity).toBe('warn');
    });
  });

  describe('Validation Summary', () => {
    it('should provide correct validation summary', () => {
      const flowWithIssues = {
        ...mockFlow,
        edges: [
          ...mockEdges,
          { id: 'edge-4', from: 'node-4', to: 'node-1' }, // Creates cycle
        ],
        nodes: mockNodes.map(node => 
          node.type === 'PromptLab' 
            ? {
                ...node,
                config: {
                  ...node.config,
                  template: 'A'.repeat(1500), // Long prompt
                },
              }
            : node
        ),
      };

      const summary = getValidationSummary(flowWithIssues);
      expect(summary.isValid).toBe(false);
      expect(summary.blockingWarnings).toBe(1); // Cycle
      expect(summary.warningCount).toBe(1); // Long prompt
      expect(summary.totalWarnings).toBe(2);
    });

    it('should identify valid flows correctly', () => {
      const summary = getValidationSummary(mockFlow);
      expect(summary.isValid).toBe(true);
      expect(summary.blockingWarnings).toBe(0);
    });
  });

  describe('Flow Validation Helper', () => {
    it('should return false for flows with blocking issues', () => {
      const flowWithCycle = {
        ...mockFlow,
        edges: [
          ...mockEdges,
          { id: 'edge-4', from: 'node-4', to: 'node-1' },
        ],
      };

      const isValid = isFlowValid(flowWithCycle);
      expect(isValid).toBe(false);
    });

    it('should return true for valid flows', () => {
      const isValid = isFlowValid(mockFlow);
      expect(isValid).toBe(true);
    });
  });
});

describe('Integration Scenarios', () => {
  it('should handle complete edge creation and validation flow', () => {
    const edgeStore = new EdgeStore();
    const mockNodes = [
      {
        id: 'node-1',
        type: 'Trigger',
        label: 'Start',
        pos: { x: 100, y: 100 },
        config: { triggerType: 'manual' },
      },
      {
        id: 'node-2',
        type: 'PromptLab',
        label: 'Generator',
        pos: { x: 300, y: 100 },
        config: { promptType: 'generation', maxLength: 1200 },
      },
    ];

    // Add edge
    const edge: Edge = { id: 'edge-1', from: 'node-1', to: 'node-2' };
    const addResult = edgeStore.addEdge(edge);
    expect(addResult.isValid).toBe(true);

    // Create flow
    const flow: Flow = {
      id: 'test-flow',
      name: 'Test',
      nodes: mockNodes,
      edges: [edge],
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Validate flow (should fail due to missing guardrail)
    const warnings = runRefactor(flow);
    expect(warnings.some(w => w.code.includes('GUARDRAIL'))).toBe(true);
  });

  it('should handle complex workflow validation', () => {
    const complexFlow: Flow = {
      id: 'complex-flow',
      name: 'Complex Workflow',
      nodes: [
        {
          id: 'trigger',
          type: 'Trigger',
          label: 'Start',
          pos: { x: 100, y: 100 },
          config: { triggerType: 'manual' },
        },
        {
          id: 'guardrail',
          type: 'Guardrail',
          label: 'Security Check',
          pos: { x: 300, y: 100 },
          config: { ruleType: 'pii' },
        },
        {
          id: 'promptlab',
          type: 'PromptLab',
          label: 'Content Generator',
          pos: { x: 500, y: 100 },
          config: { 
            promptType: 'generation', 
            maxLength: 1200,
            template: 'Generate appropriate content',
          },
        },
        {
          id: 'uiagent',
          type: 'UIAgent',
          label: 'UI Modifier',
          pos: { x: 700, y: 100 },
          config: { actionType: 'modify' },
        },
      ],
      edges: [
        { id: 'edge-1', from: 'trigger', to: 'guardrail' },
        { id: 'edge-2', from: 'guardrail', to: 'promptlab' },
        { id: 'edge-3', from: 'promptlab', to: 'uiagent' },
      ],
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const summary = getValidationSummary(complexFlow);
    expect(summary.isValid).toBe(true);
    expect(summary.totalWarnings).toBe(0);
  });
});