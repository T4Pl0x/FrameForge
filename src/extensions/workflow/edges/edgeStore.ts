/**
 * Edge Store
 * 
 * In-memory state management for workflow edges.
 * Provides CRUD operations, validation, and graph traversal helpers.
 */

import type { Edge, Node, Flow } from '../flowTypes';

export interface EdgeValidationResult {
  isValid: boolean;
  error?: string;
}

export interface GraphTraversalResult {
  reachableNodes: Set<string>;
  hasCycle: boolean;
  path?: string[];
}

/**
 * Edge Store class for managing workflow edges
 */
export class EdgeStore {
  private edges: Map<string, Edge> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Add an edge to the store
   */
  addEdge(edge: Edge): EdgeValidationResult {
    // Validate edge before adding
    const validation = this.validateEdge(edge);
    if (!validation.isValid) {
      return validation;
    }

    this.edges.set(edge.id, edge);
    this.notifyListeners();
    return { isValid: true };
  }

  /**
   * Remove an edge from the store
   */
  removeEdge(edgeId: string): boolean {
    const removed = this.edges.delete(edgeId);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Get an edge by ID
   */
  getEdge(edgeId: string): Edge | undefined {
    return this.edges.get(edgeId);
  }

  /**
   * Get all edges
   */
  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get edges connected to a node
   */
  getEdgesForNode(nodeId: string): { incoming: Edge[]; outgoing: Edge[] } {
    const incoming: Edge[] = [];
    const outgoing: Edge[] = [];

    for (const edge of this.edges.values()) {
      if (edge.to === nodeId) {
        incoming.push(edge);
      }
      if (edge.from === nodeId) {
        outgoing.push(edge);
      }
    }

    return { incoming, outgoing };
  }

  /**
   * Check if an edge would create a cycle
   */
  wouldCreateCycle(from: string, to: string, nodes: Node[]): boolean {
    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    
    // Add existing edges
    for (const edge of this.edges.values()) {
      if (!adjacency.has(edge.from)) {
        adjacency.set(edge.from, []);
      }
      adjacency.get(edge.from)!.push(edge.to);
    }

    // Add potential new edge
    if (!adjacency.has(from)) {
      adjacency.set(from, []);
    }
    adjacency.get(from)!.push(to);

    // Check for cycle using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Cycle detected
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check from the target node (reverse direction for cycle detection)
    return hasCycle(to);
  }

  /**
   * Validate an edge before adding
   */
  private validateEdge(edge: Edge): EdgeValidationResult {
    // Check if edge already exists
    for (const existingEdge of this.edges.values()) {
      if (existingEdge.from === edge.from && existingEdge.to === edge.to) {
        return {
          isValid: false,
          error: 'Edge already exists between these nodes',
        };
      }
    }

    // Check for self-connection
    if (edge.from === edge.to) {
      return {
        isValid: false,
        error: 'Cannot connect node to itself',
      };
    }

    return { isValid: true };
  }

  /**
   * Perform graph traversal from a starting node
   */
  traverseGraph(startNodeId: string, nodes: Node[]): GraphTraversalResult {
    const visited = new Set<string>();
    const reachableNodes = new Set<string>();
    const path: string[] = [];
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, currentPath: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        // Cycle detected
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      reachableNodes.add(nodeId);
      recursionStack.add(nodeId);
      currentPath.push(nodeId);

      // Get outgoing edges
      const outgoing = this.getEdgesForNode(nodeId).outgoing;
      for (const edge of outgoing) {
        if (dfs(edge.to, [...currentPath])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    const hasCycle = dfs(startNodeId, path);

    return {
      reachableNodes,
      hasCycle,
      path: hasCycle ? path : undefined,
    };
  }

  /**
   * Check fan-out for a node
   */
  getFanOut(nodeId: string): number {
    return this.getEdgesForNode(nodeId).outgoing.length;
  }

  /**
   * Count nodes of specific type
   */
  countNodesByType(nodes: Node[], nodeType: string): number {
    return nodes.filter(node => node.type === nodeType).length;
  }

  /**
   * Check if Guardrail node exists before target nodes
   */
  hasGuardrailBefore(nodes: Node[], targetTypes: string[]): boolean {
    // Find all Guardrail nodes
    const guardrailNodes = nodes.filter(node => node.type === 'Guardrail');
    
    if (guardrailNodes.length === 0) {
      return false;
    }

    // For each target node, check if there's a path from a Guardrail
    for (const targetNode of nodes) {
      if (targetTypes.includes(targetNode.type)) {
        let hasGuardrailPath = false;
        
        for (const guardrailNode of guardrailNodes) {
          const traversal = this.traverseGraph(guardrailNode.id, nodes);
          if (traversal.reachableNodes.has(targetNode.id)) {
            hasGuardrailPath = true;
            break;
          }
        }

        if (!hasGuardrailPath) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Subscribe to edge changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Clear all edges
   */
  clear(): void {
    this.edges.clear();
    this.notifyListeners();
  }

  /**
   * Get store statistics
   */
  getStats(): {
    totalEdges: number;
    nodesWithIncoming: number;
    nodesWithOutgoing: number;
    isolatedNodes: number;
  } {
    const allEdges = this.getAllEdges();
    const nodesWithIncoming = new Set<string>();
    const nodesWithOutgoing = new Set<string>();

    for (const edge of allEdges) {
      nodesWithIncoming.add(edge.to);
      nodesWithOutgoing.add(edge.from);
    }

    return {
      totalEdges: allEdges.length,
      nodesWithIncoming: nodesWithIncoming.size,
      nodesWithOutgoing: nodesWithOutgoing.size,
      isolatedNodes: 0, // Would need node list to calculate accurately
    };
  }
}

// Singleton instance for the application
export const edgeStore = new EdgeStore();