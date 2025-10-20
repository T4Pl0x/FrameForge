// Sandbox extension: run preflight checks and emit normalized reports (dev-only writer)
import { runA11y } from "../../ext-preflight/src/checks/a11y";
import { runTests } from "../../ext-preflight/src/checks/tests";
import { runLintBuild } from "../../ext-preflight/src/checks/lintBuild";

// Provided by dev server only (path-locked writer)
declare const DevEndpoints: { post: (path: string, body: unknown)=>Promise<{ok:boolean}> };
declare const Notifs: { toast: (msg:string)=>void };

export default async function entry(){
  try {
    const [a11y, tests, lintBuild] = await Promise.all([runA11y(), runTests(), runLintBuild()]);
    const summary = {
      updatedAt: new Date().toISOString(),
      tests: { status: tests.failed ? "failing" : "passing" },
      a11y:  { status: a11y.failed  ? "failing" : "passing" },
      lintBuild: { status: lintBuild.lint.errors ? "failing" : "passing" }
    };
    await DevEndpoints.post("/__ff/write-report", {
      files: [
        { path: "/.echo/gate-summary.json", json: summary },
        { path: "/frameforge/reports/tests-report.json", json: tests },
        { path: "/frameforge/reports/a11y-report.json", json: a11y },
        { path: "/frameforge/reports/lint-build.json", json: lintBuild }
      ]
    });
    Notifs.toast("Sandbox: normalized reports emitted");
  } catch (e:any) {
    Notifs.toast(`Sandbox failed: ${e?.message || e}`);
  }
}

