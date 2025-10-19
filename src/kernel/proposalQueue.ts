let batching = false;
const queue: string[] = [];

export async function enqueueProposal(id: string, kernel: any) {
  queue.push(id);
  if (batching) return;
  batching = true;
  queueMicrotask(async () => {
    try {
      const ids = queue.splice(0, queue.length);
      for (const pid of ids) {
        await kernel.proposals.preflight(pid);
        // approval/apply should be user- or env-gated
      }
    } finally {
      batching = false;
    }
  });
}