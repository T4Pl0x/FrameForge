import type { PromptDraft } from '@frameforge/shared/src/prompt.types';

export function usePublishedPrompts(){
  const base = (import.meta.env.VITE_REPO_ROOT as string) || "";
  const modules = import.meta.glob<PromptDraft>(`/@fs/${base}/spec/prompts/*.json`, { eager: true, import: 'default' });
  const items = Object.entries(modules).map(([path, data]) => {
    const id = (data as any)?.id || (path.split('/').pop() || '').replace(/\.json$/,'');
    return { id, draft: data as PromptDraft, path };
  }).sort((a,b) => a.id.localeCompare(b.id));
  return items;
}

