export type Role = "viewer" | "editor" | "approver" | "owner";

export interface JsonPatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: any;
  from?: string;
}

export interface ProposalTarget {
  file: `spec/${string}.json`;
  path?: string;
}

export interface Proposal {
  proposal_id?: string;
  idempotency_key: string;
  target: ProposalTarget;
  patch: JsonPatchOp[];
  provenance: {
    actor: { type: "extension" | "user"; name: string; version?: string };
    user?: { id: string; roles: Role[] };
    model?: { id: string; provider?: string; temp?: number; top_p?: number };
    inputs_sha256?: string;
    prompt_template_id?: string;
  };
  created_at?: string;
  status?: "pending" | "approved" | "applied" | "rejected" | "ready" | "invalid";
}

