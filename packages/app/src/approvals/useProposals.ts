export type ProposalArtifact = {
  ticketId: string;
  createdAt: string;
  appliedAt?: string;
  patches: Array<{ op:string; path:string; value?:unknown }>;
};

export function useProposals(_refreshKey?: number) {
  const base = (import.meta.env.VITE_REPO_ROOT as string) || "";
  // Dev-only glob; eager true to leverage HMR when files change
  const modules = import.meta.glob<ProposalArtifact>(`/@fs/${base}/frameforge/reports/proposals/*.json`, {
    eager: true, import: "default"
  });
  const items = Object.entries(modules).map(([path, data]) => {
    const file = path.split("/").pop() || "";
    const ticketId = (data as any).ticketId || file.replace(/\.json$/,"");
    return { path, ticketId, data: data as ProposalArtifact };
  }).sort((a,b) => (a.data.createdAt || "").localeCompare(b.data.createdAt || ""));
  return items;
}
