type Suggestion = {
  kind: "agent.add" | "agent.update";
  title: string;
  description?: string;
  confidence: number; // 0..1
  openQuestions?: string[];
  patch: { op: string; path: string; value?: unknown };
};

// Minimal heuristic: adds a review agent if none exists
export async function buildSuggestions(spec: any): Promise<Suggestion[]> {
  const agents = spec?.logic?.agents ?? [];
  const hasReviewer = agents.some((a: any) => a.name?.toLowerCase().includes("review"));
  if (!hasReviewer) {
    const agent = { name: "ReviewAgent", role: "critic", policy: { maxTokens: 2048 } };
    return [{
      kind: "agent.add",
      title: "Add ReviewAgent",
      confidence: 0.72,
      openQuestions: ["Should ReviewAgent block publish on RED gates?"],
      patch: { op: "add", path: "/spec/logic.json#/agents/-", value: agent }
    }];
  }
  return [{
    kind: "agent.update",
    title: "Tighten ReviewAgent policy",
    confidence: 0.66,
    openQuestions: ["Increase reranker topK?"],
    patch: { op: "add", path: "/spec/logic.json#/policies/review", value: { requireGreenGates: true } }
  }];
}
