/**
 * Refactor Pass
 * 
 * Validates workflow flows and generates structured warnings.
 * Implements guardrail validation and cycle detection for Slice 2.
 */

import type { Flow, Node, Edge } from './flowTypes';
import { edgeStore } from './edges/edgeStore';

export interface RefactorWarning {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: 'block' | 'warn';
  suggestion?: string;
}

export interface RefactorOptions {
  toolBudget?: number;
  maxFanOut?: number;
  maxPromptLength?: number;
}

/**
 * Run refactor validation on a flow
 */
export function runRefactor(flow: Flow, options: RefactorOptions = {}): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];
  const {
    toolBudget = 6,
    maxFanOut = 4,
    maxPromptLength = 1200,
  } = options;

  // Initialize edge store with current edges for validation
  edgeStore.clear();
  flow.edges.forEach(edge => edgeStore.addEdge(edge));

  // Rule 1: Guardrail validation (before PromptLab and UIAgent)
  const guardrailWarnings = validateGuardrails(flow.nodes);
  warnings.push(...guardrailWarnings);

  // Rule 4: Cycle detection (moved to #4 for priority)
  const cycleWarnings = validateCycles(flow.nodes, flow.edges);
  warnings.push(...cycleWarnings);

  // Additional rules (can be added in future slices)
  // Rule 2: Fan-out validation
  const fanOutWarnings = validateFanOut(flow.nodes, flow.edges, maxFanOut);
  warnings.push(...fanOutWarnings);

  // Rule 3: Prompt length validation
  const promptLengthWarnings = validatePromptLength(flow.nodes, maxPromptLength);
  warnings.push(...promptLengthWarnings);

  // Rule 5: Tool budget validation
  const toolBudgetWarnings = validateToolBudget(flow.nodes, toolBudget);
  warnings.push(...toolBudgetWarnings);

  return warnings;
}

/**
 * Validate that Guardrail nodes exist before PromptLab and UIAgent nodes
 */
function validateGuardrails(nodes: Node[]): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];
  
  // Find all Guardrail, PromptLab, and UIAgent nodes
  const guardrailNodes = nodes.filter(node => node.type === 'Guardrail');
  const promptLabNodes = nodes.filter(node => node.type === 'PromptLab');
  const uiAgentNodes = nodes.filter(node => node.type === 'UIAgent');

  // If no Guardrail nodes exist, add blocking warning
  if (guardrailNodes.length === 0 && (promptLabNodes.length > 0 || uiAgentNodes.length > 0)) {
    warnings.push({
      code: 'MISSING_GUARDRAIL',
      message: 'At least one Guardrail node is required before PromptLab and UIAgent nodes',
      severity: 'block',
      suggestion: 'Add a Guardrail node to validate inputs before AI processing',
    });
    return warnings;
  }

  // Check if Guardrail nodes are properly positioned before target nodes
  if (!edgeStore.hasGuardrailBefore(nodes, ['PromptLab', 'UIAgent'])) {
    warnings.push({
      code: 'GUARDRAIL_POSITION',
      message: 'Guardrail nodes must be positioned before PromptLab and UIAgent nodes in the workflow',
      severity: 'block',
      suggestion: 'Ensure there is a path from a Guardrail node to each PromptLab and UIAgent node',
    });
  }

  return warnings;
}

/**
 * Validate that the workflow graph has no cycles
 */
function validateCycles(nodes: Node[], edges: Edge[]): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  nodes.forEach(node => adjacency.set(node.id, []));

  edges.forEach(edge => {
    const outgoing = adjacency.get(edge.from) || [];
    outgoing.push(edge.to);
    adjacency.set(edge.from, outgoing);
  });

  // Detect cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cyclePaths: string[][] = [];

  const detectCycle = (nodeId: string, path: string[]): boolean => {
    if (recursionStack.has(nodeId)) {
      // Found cycle - extract cycle path
      const cycleStartIndex = path.indexOf(nodeId);
      if (cycleStartIndex !== -1) {
        cyclePaths.push([...path.slice(cycleStartIndex), nodeId]);
      }
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (detectCycle(neighbor, [...path])) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  // Check each node for cycles
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      detectCycle(node.id, []);
    }
  }

  // Add warnings for detected cycles
  cyclePaths.forEach((cyclePath, index) => {
    const nodeLabels = cyclePath.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node?.label || node?.type || 'Unknown';
    });

    warnings.push({
      code: 'CYCLE_DETECTED',
      message: `Cycle detected in workflow: ${nodeLabels.join(' → ')} → ${nodeLabels[0]}`,
      severity: 'block',
      nodeId: cyclePath[0],
      suggestion: 'Remove at least one connection to break the cycle',
    });
  });

  return warnings;
}

/**
 * Validate fan-out constraints (maximum outgoing edges per node)
 */
function validateFanOut(nodes: Node[], edges: Edge[], maxFanOut: number): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];

  // Count outgoing edges for each node
  const outgoingCounts = new Map<string, number>();
  nodes.forEach(node => outgoingCounts.set(node.id, 0));

  edges.forEach(edge => {
    const count = outgoingCounts.get(edge.from) || 0;
    outgoingCounts.set(edge.from, count + 1);
  });

  // Check for violations
  for (const [nodeId, count] of outgoingCounts) {
    if (count > maxFanOut) {
      const node = nodes.find(n => n.id === nodeId);
      warnings.push({
        code: 'FAN_OUT_EXCEEDED',
        message: `Node "${node?.label || node?.type}" has ${count} outgoing connections (maximum allowed: ${maxFanOut})`,
        severity: 'warn',
        nodeId,
        suggestion: 'Consider reducing the number of outgoing connections or using a junction node',
      });
    }
  }

  return warnings;
}

/**
 * Validate prompt length constraints
 */
function validatePromptLength(nodes: Node[], maxLength: number): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];

  nodes.forEach(node => {
    if (node.type === 'PromptLab' && node.config) {
      const config = node.config as { template?: string };
      const template = config.template || '';

      if (template.length > maxLength) {
        warnings.push({
          code: 'PROMPT_TOO_LONG',
          message: `PromptLab node "${node.label}" has a template of ${template.length} characters (maximum allowed: ${maxLength})`,
          severity: 'warn',
          nodeId: node.id,
          suggestion: 'Shorten the prompt template or split into multiple nodes',
        });
      }
    }
  });

  return warnings;
}

/**
 * Validate tool budget constraints
 */
function validateToolBudget(nodes: Node[], maxTools: number): RefactorWarning[] {
  const warnings: RefactorWarning[] = [];

  const toolNodes = nodes.filter(node => node.type === 'Tool');
  
  if (toolNodes.length > maxTools) {
    warnings.push({
      code: 'TOOL_BUDGET_EXCEEDED',
      message: `Workflow has ${toolNodes.length} Tool nodes (maximum allowed: ${maxTools})`,
      severity: 'warn',
      suggestion: 'Reduce the number of Tool nodes or increase the tool budget',
    });
  }

  return warnings;
}

/**
 * Get refactor rule descriptions
 */
export function getRefactorRuleDescriptions(): Record<string, { description: string; severity: 'block' | 'warn' }> {
  return {
    MISSING_GUARDRAIL: {
      description: 'At least one Guardrail node must exist before PromptLab and UIAgent nodes',
      severity: 'block',
    },
    GUARDRAIL_POSITION: {
      description: 'Guardrail nodes must be positioned before PromptLab and UIAgent nodes in the workflow path',
      severity: 'block',
    },
    CYCLE_DETECTED: {
      description: 'Workflow cannot contain cycles (loops)',
      severity: 'block',
    },
    FAN_OUT_EXCEEDED: {
      description: 'Nodes cannot have more than the maximum allowed outgoing connections',
      severity: 'warn',
    },
    PROMPT_TOO_LONG: {
      description: 'PromptLab templates cannot exceed the maximum character limit',
      severity: 'warn',
    },
    TOOL_BUDGET_EXCEEDED: {
      description: 'Workflow cannot exceed the maximum number of Tool nodes',
      severity: 'warn',
    },
  };
}

/**
 * Check if a flow passes all refactor validations
 */
export function isFlowValid(flow: Flow, options?: RefactorOptions): boolean {
  const warnings = runRefactor(flow, options);
  const blockingWarnings = warnings.filter(w => w.severity === 'block');
  return blockingWarnings.length === 0;
}

/**
 * Get validation summary
 */
export function getValidationSummary(flow: Flow, options?: RefactorOptions): {
  isValid: boolean;
  totalWarnings: number;
  blockingWarnings: number;
  warningCount: number;
  warnings: RefactorWarning[];
} {
  const warnings = runRefactor(flow, options);
  const blockingWarnings = warnings.filter(w => w.severity === 'block');
  const warningCount = warnings.filter(w => w.severity === 'warn').length;

  return {
    isValid: blockingWarnings.length === 0,
    totalWarnings: warnings.length,
    blockingWarnings: blockingWarnings.length,
    warningCount,
    warnings,
  };
}