import type { Proposal, JsonPatch } from "./types";

export function buildLogicProposal(ui: unknown, data: unknown): Proposal {
  const patches: JsonPatch[] = [
    { op: "add", path: "/workflows~1build", value: { steps: ["lint","test","build"] } }
  ];
  return {
    ticketId: `compiler-logic-${Date.now()}`,
    target: "/spec/logic.json",
    patches,
    openQuestions: ["Confirm build steps ordering?"],
    provenance: { actor: "@frameforge/ext-compiler" }
  };
}

export function buildTestsProposal(ui: unknown): Proposal {
  const patches: JsonPatch[] = [
    { op: "add", path: "/smoke~1app-mounts", value: { expect: "root mounted" } }
  ];
  return {
    ticketId: `compiler-tests-${Date.now()}`,
    target: "/spec/tests.json",
    patches,
    openQuestions: ["Add route coverage now or later?"],
    provenance: { actor: "@frameforge/ext-compiler" }
  };
}
