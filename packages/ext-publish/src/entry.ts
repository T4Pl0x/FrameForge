// Publish extension: opens PR and posts statuses via GH proxy (dev)
import { broker } from "../../../frameforge/src/tools/broker.js";

type Ctx = { openWindow?: (opts: { title: string; render?: () => any }) => void };

export default async function entry(ctx?: Ctx){
  try { ctx?.openWindow?.({ title: 'Publish', render: () => 'Publish ext ready (dev)' }); } catch {}
}

export async function openPR({ owner, repo, workflow = 'frameforge_publish.yml', branch, inputs = {} }:{ owner:string; repo:string; workflow?:string; branch:string; inputs?: any }){
  // Use broker.ci to dispatch the publish workflow through the dev GH proxy (no browser tokens)
  await broker.ci.dispatchWorkflow({ owner, repo, workflow, branch, inputs, token: undefined });
  return { ok: true };
}

