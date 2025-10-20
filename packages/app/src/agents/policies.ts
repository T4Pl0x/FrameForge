import { kernel } from '../kernel';

type ToProposalArgs = {
  path: string; // JSON pointer under logic.json (e.g., /agents/agent-1/policies/askWhenUncertain)
  value: any;
  title?: string;
  labels?: string[];
};

export async function toProposal({ path, value, title, labels }: ToProposalArgs){
  const diffs = [{ op: 'replace', path, value }];
  const payload = {
    title: title || `Update policy ${path}`,
    diffs,
    scope: ['logic'],
    sourceExtension: '@frameforge/app/agents',
    idempotencyKey: `idem:policy:${path}:${JSON.stringify(value)}`.slice(0, 240)
  };
  try { return await kernel.host.proposals.submit(payload); }
  catch (e) { console.warn('proposal submit failed', e); return null; }
}

