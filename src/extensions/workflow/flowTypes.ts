/**
 * Workflow Builder Types
 * 
 * Core types for the no-code, node-based workflow builder
 * that compiles to runnable flows and integrates with FrameForge systems.
 */

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  meta?: {
    version: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    author?: string;
  };
}

export interface Node {
  id: string;
  type: NodeType;
  label?: string;
  config?: Record<string, unknown>;
  pos: {
    x: number;
    y: number;
  };
  data?: {
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    status?: 'idle' | 'running' | 'success' | 'error';
    error?: string;
  };
}

export type NodeType = 
  | "Trigger"
  | "PromptLab" 
  | "UIAgent"
  | "Guardrail"
  | "Tool"
  | "Compiler"
  | "Sandbox"
  | "Publisher";

export interface Edge {
  id: string;
  from: string;
  to: string;
  condition?: Record<string, unknown>;
  label?: string;
}

export interface NodePort {
  id: string;
  type: 'input' | 'output';
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  label: string;
  required?: boolean;
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  description: string;
  category: 'trigger' | 'processing' | 'output' | 'utility';
  icon: string;
  color: string;
  inputs: NodePort[];
  outputs: NodePort[];
  configSchema?: Record<string, unknown>;
}

export interface FlowCanvasState {
  flow: Flow;
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  isDragging: boolean;
  isConnecting: boolean;
  connectionStart?: {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  grid: {
    size: number;
    visible: boolean;
    snap: boolean;
  };
}

export interface RefactorWarning {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  suggestion?: string;
}

export interface CompileResult {
  success: boolean;
  flowJson?: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  outputPath: string;
}

export interface DebugTrace {
  id: string;
  flowId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  steps: DebugStep[];
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    duration: number;
  };
}

export interface DebugStep {
  id: string;
  nodeId: string;
  nodeType: NodeType;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowCommand {
  id: string;
  title: string;
  description: string;
  icon: string;
  handler: () => void | Promise<void>;
  enabled?: boolean;
  shortcut?: string;
}

export interface WorkflowPanelProps {
  flow: Flow;
  onFlowChange: (flow: Flow) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
}

// Node-specific configuration types
export interface TriggerNodeConfig {
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event';
  webhookUrl?: string;
  schedule?: string;
  eventType?: string;
}

export interface PromptLabNodeConfig {
  promptType: 'analysis' | 'generation' | 'refinement';
  template?: string;
  variables?: Record<string, unknown>;
  maxLength?: number;
}

export interface UIAgentNodeConfig {
  agentType: 'artisan' | 'reviewer' | 'optimizer';
  targetScreen?: string;
  operation: 'create' | 'modify' | 'analyze';
}

export interface GuardrailNodeConfig {
  checks: Array<'pii' | 'jailbreak' | 'schema' | 'length' | 'content'>;
  piiPatterns?: string[];
  jailbreakPatterns?: string[];
  schema?: Record<string, unknown>;
  maxLength?: number;
}

export interface ToolNodeConfig {
  toolType: 'http' | 'database' | 'file' | 'custom';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface CompilerNodeConfig {
  targetLanguage: 'javascript' | 'typescript' | 'python' | 'json';
  optimizationLevel: 'none' | 'basic' | 'aggressive';
  outputFormat: 'bundle' | 'modules' | 'single';
}

export interface SandboxNodeConfig {
  environment: 'node' | 'browser' | 'python';
  timeout: number;
  memory: number;
  permissions: string[];
}

export interface PublisherNodeConfig {
  target: 'github' | 'filesystem' | 'api';
  repository?: string;
  branch?: string;
  path?: string;
  message?: string;
}