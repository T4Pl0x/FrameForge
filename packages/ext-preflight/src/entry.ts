import { runA11y } from "./checks/a11y";
import { runTests } from "./checks/tests";
import { runLintBuild } from "./checks/lintBuild";

// Provided by dev server only (path-locked writer)
declare const DevEndpoints: { post: (path: string, body: unknown)=>Promise<{ok:boolean}> };
declare const Notifs: { toast: (msg:string)=>void };

export default async function register(){
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
  Notifs.toast("Preflight: normalized reports emitted");
}
