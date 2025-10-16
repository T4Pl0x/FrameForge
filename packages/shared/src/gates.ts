export type GateStatus = "pass" | "warn" | "fail";
export interface TestsReport { status: GateStatus; summary: string; }
export interface A11yReport  { status: GateStatus; summary: string; }
export interface LintBuildReport { status: GateStatus; summary: string; }
export interface NormalizedGates { tests: TestsReport; a11y: A11yReport; lintBuild: LintBuildReport; }

