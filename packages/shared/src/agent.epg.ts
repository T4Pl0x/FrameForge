import type { PromptDraft } from './prompt.types';

export interface RunResult { output: string; tokensUsed?: number; }
export interface EvalResult { score: number; notes?: string }

export interface EPGAgent {
  usePrompt(draft: PromptDraft): Promise<PromptDraft>;
  runPrompt(draft: PromptDraft, vars?: Record<string,string>): Promise<RunResult>;
  evaluate(draft: PromptDraft, result: RunResult): Promise<EvalResult>;
}

// Dev stub
export const EPG: EPGAgent = {
  async usePrompt(draft){ return draft; },
  async runPrompt(draft){
    const merged = [draft.parts.goal, draft.parts.constraints, draft.parts.style, draft.parts.steps, draft.parts.critique]
      .filter(Boolean).join('\n\n');
    return { output: merged };
  },
  async evaluate(_draft,_res){ return { score: 0.5, notes: 'stub' }; }
};

