export type TokenKind = 'creative'|'critical'|'struct';
export interface Token { id: string; label: string; kind: TokenKind; text: string }

export const TOKENS: Token[] = [
  { id:'clarity', label:'Clarity', kind:'critical', text:'Be clear and unambiguous.' },
  { id:'coverage', label:'Coverage', kind:'critical', text:'Cover all key points.' },
  { id:'json', label:'JSON Output', kind:'struct', text:'Output valid JSON only.' },
  { id:'cot', label:'CoT', kind:'struct', text:'Think step-by-step before answering.' },
  { id:'tone-friendly', label:'Friendly Tone', kind:'creative', text:'Use a friendly, helpful tone.' },
];

export function expandTokens(ids: string[]): string{
  return ids.map(id => TOKENS.find(t => t.id === id)?.text).filter(Boolean).join('\n');
}

