import { Flow, NodeType } from "./flowTypes";
import { compileFlow } from "./compile";

export type TraceStep = {
  nodeId: string;
  type: NodeType;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  inputSummary: string;
  outputSummary: string;
  flags?: string[];
};

const SIMULATED_DELAY_MS = 50;

export async function runDebugTrace(flowOrPlan: Flow | any): Promise<{ steps: TraceStep[] }> {
  // Compile if needed
  const plan = 'nodes' in flowOrPlan && 'edges' in flowOrPlan && 'metadata' in flowOrPlan 
    ? flowOrPlan 
    : compileFlow(flowOrPlan as Flow).ok ? compileFlow(flowOrPlan as Flow).plan : null;

  if (!plan) {
    throw new Error("Invalid flow or plan provided");
  }

  // Simulate execution path: Trigger → Guardrail → PromptLab → UIAgent → (Tool?) → Compiler → Sandbox → Publisher
  const executionOrder = [
    "Trigger",
    "Guardrail",
    "PromptLab",
    "UIAgent",
    "Tool",
    "Compiler",
    "Sandbox",
    "Publisher"
  ];

  const steps: TraceStep[] = [];
  let currentTime = Date.now();

  for (const nodeType of executionOrder) {
    const node = plan.nodes.find((n: any) => n.type === nodeType);
    if (!node) continue;

    const startTime = currentTime;
    const duration = SIMULATED_DELAY_MS + Math.random() * 100;
    const endTime = startTime + duration;

    const step: TraceStep = {
      nodeId: node.id,
      type: node.type as NodeType,
      startedAt: startTime,
      endedAt: endTime,
      durationMs: duration,
      inputSummary: `Simulated input for ${node.type}`,
      outputSummary: `Simulated output from ${node.type}`
    };

    // Simulate guardrail flags
    if (node.type === "Guardrail") {
      if (Math.random() > 0.7) {
        step.flags = ["pii_detected"];
      }
    }

    steps.push(step);
    currentTime = endTime;
  }

  return { steps };
}