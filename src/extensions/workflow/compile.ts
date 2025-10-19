import { Flow, Node } from "./flowTypes";
import { compiledPlanSchema } from "./flowSchema";
import { AppState } from "../../state/appState";
import Ajv from "ajv";

const ajv = new Ajv();

export type CompileResult = 
  | { ok: true; plan: any } 
  | { ok: false; errors: string[] };

export function compileFlow(flow: Flow): CompileResult {
  // Create deterministic node order based on position
  const orderedNodes = [...flow.nodes].sort((a, b) => 
    a.pos.y - b.pos.y || a.pos.x - b.pos.x
  );

  const plan = {
    nodes: orderedNodes.map((node, index) => ({
      id: node.id,
      type: node.type,
      config: node.config || {},
      order: index
    })),
    edges: flow.edges.map(edge => ({
      from: edge.from,
      to: edge.to
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      version: flow.meta?.version || "1.0.0"
    }
  };

  // Validate against schema
  const validate = ajv.compile(compiledPlanSchema);
  const valid = validate(plan);

  if (!valid) {
    return {
      ok: false,
      errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || ["Unknown validation error"]
    };
  }

  return { ok: true, plan };
}

export async function saveCompiledPlan(appState: AppState, plan: any): Promise<void> {
  try {
    await appState.io.propose({
      op: "replace",
      path: "/spec/logic/flow.json",
      value: plan
    });
  } catch (error) {
    console.error("Failed to save compiled plan:", error);
    throw error;
  }
}