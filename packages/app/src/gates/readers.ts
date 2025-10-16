export type Gate = "tests"|"a11y"|"lintBuild";
export type GateState = "passing"|"failing"|"warning"|"unknown";
export type GateSummary = { updatedAt?: string; gates?: Record<Gate,{state:GateState;details?:string}>; };

const DEFAULT_PATH = (import.meta as any).env?.VITE_GATES_SUMMARY_PATH || "/.echo/gate-summary.json";
const map = (v:any): GateState =>
  (v===true||v==="ok"||v==="pass")?"passing":
  (v===false||v==="fail"||v==="blocked")?"failing":
  (v==="warn"||v==="warning")?"warning":"unknown";

export async function readGateSummary(path=DEFAULT_PATH): Promise<GateSummary> {
  try {
    const res = await fetch(path as string, { cache:"no-store" });
    if (!res.ok) throw new Error("fetch fail");
    const raw = await res.json();
    return {
      updatedAt: raw.updatedAt || raw.ts || new Date().toISOString(),
      gates: {
        tests: { state: map(raw.tests?.state ?? raw.tests) },
        a11y: { state: map(raw.a11y?.state ?? raw.a11y) },
        lintBuild: { state: map(raw.lintBuild?.state ?? raw.lint ?? raw.build) }
      }
    };
  } catch {
    return { gates: { tests:{state:"unknown"}, a11y:{state:"unknown"}, lintBuild:{state:"unknown"} } };
  }
}

