export type JsonPatch = { op: "add"|"remove"|"replace"; path: string; value?: unknown };
export type Proposal = {
  ticketId: string;
  target: "/spec/logic.json" | "/spec/tests.json";
  patches: JsonPatch[];
  openQuestions?: string[];
  provenance: { actor: string; model?: { id: string } };
};
