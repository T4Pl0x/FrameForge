#!/usr/bin/env node
/*
 * Copilot Refactor Agent Stub
 * ---------------------------------
 * This script scaffolds the automated refactor assistant described in docs/copilot-refactor-agent.md.
 * It currently performs analysis, plans refactors, and writes reflection notes in dry-run mode.
 * Flesh out the TODO sections to enable actual code modifications and PR integration.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '..');
const copilotDir = path.join(workspaceRoot, '.copilot');
const plansDir = path.join(copilotDir, 'plans');
const reportsDir = path.join(copilotDir, 'reports');

const argv = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = true] = arg.split('=');
    return [key.replace(/^--/, ''), value];
  })
);

const isDryRun = argv.get('dry-run') !== 'false';
const shouldApply = argv.get('apply') === 'true';
const taskContext = {
  id: (() => {
    const raw = argv.get('task-id');
    if (!raw || raw === 'true') return '';
    return String(raw);
  })(),
  title: (() => {
    const raw = argv.get('task-title');
    if (!raw || raw === 'true') return '';
    return String(raw);
  })(),
};

const traceEntries = [];
const verificationEntries = [];

const recordThought = (phase, message, context = {}) => {
  traceEntries.push({
    phase,
    message,
    context,
    timestamp: new Date().toISOString(),
  });
};

const recordVerification = (name, status, evidence = {}) => {
  verificationEntries.push({
    name,
    status,
    evidence,
    timestamp: new Date().toISOString(),
  });
};

async function ensureCopilotDirs() {
  await fs.mkdir(plansDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
}

async function readPackageJson() {
  const pkgRaw = await fs.readFile(path.join(workspaceRoot, 'package.json'), 'utf8');
  return JSON.parse(pkgRaw);
}

async function walkDir(dir, ignore = new Set()) {
  const result = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (ignore.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const nested = await walkDir(fullPath, ignore);
      result.push(...nested);
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }

  return result;
}

async function calculateFileMetrics() {
  const srcDir = path.join(workspaceRoot, 'src');
  try {
    const files = await walkDir(srcDir, new Set(['assets']));
    const metrics = [];

    for (const file of files) {
      const contents = await fs.readFile(file, 'utf8');
      const lines = contents.split('\n').length;
      metrics.push({
        file: path.relative(workspaceRoot, file),
        lines,
      });
    }

    metrics.sort((a, b) => b.lines - a.lines);
    return metrics;
  } catch (error) {
    recordThought('analysis', 'Unable to calculate file metrics', { error: error.message });
    return [];
  }
}

function containsLikelyJsx(source) {
  const jsxComponentPattern = /<\s*[A-Z][\w-]*[\s>]/;
  const returnJsxPattern = /return\s*\(\s*<\s*[A-Za-z]/;
  const closingTagPattern = /<\s*([A-Za-z][\w-]*)[\s>][\s\S]*?<\s*\/\s*\1\s*>/;
  return jsxComponentPattern.test(source) || returnJsxPattern.test(source) || closingTagPattern.test(source);
}

async function detectJsxFilenameIssues() {
  const srcDir = path.join(workspaceRoot, 'src');
  const issues = [];

  try {
    const files = await walkDir(srcDir, new Set(['assets']));
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const contents = await fs.readFile(file, 'utf8');
      if (containsLikelyJsx(contents)) {
        issues.push(path.relative(workspaceRoot, file));
      }
    }
  } catch (error) {
    recordThought('analysis', 'Failed to scan for JSX filename issues', { error: error.message });
    recordVerification('jsx-extension-check', 'fail', { error: error.message });
    return { status: 'error', issues: [] };
  }

  if (issues.length) {
    recordThought('analysis', 'Detected JSX syntax in files with .js extensions', { files: issues.slice(0, 10) });
    recordVerification('jsx-extension-check', 'fail', { count: issues.length });
    return { status: 'fail', issues };
  }

  recordVerification('jsx-extension-check', 'pass', { count: 0 });
  return { status: 'pass', issues: [] };
}

function identifyHotspots(fileMetrics, threshold = 250) {
  const hotspots = fileMetrics.filter((metric) => metric.lines >= threshold);
  const top = hotspots.slice(0, 5);

  if (top.length) {
    recordThought('analysis', 'Detected potential monolithic files', {
      threshold,
      files: top,
    });
    recordVerification('hotspot-scan', 'pass', { totalHotspots: top.length });
  } else {
    recordThought('analysis', 'No files exceed hotspot threshold', { threshold });
    recordVerification('hotspot-scan', 'pass', { totalHotspots: 0 });
  }

  return top;
}

async function runCommand(command, args = []) {
  const subprocess = execa(command, args, {
    cwd: workspaceRoot,
    reject: false,
  });
  const { exitCode, stdout, stderr } = await subprocess;
  return { exitCode, stdout, stderr };
}

async function collectMetrics(pkgJson) {
  recordThought('metrics', 'Running lint checks', { command: 'npm run lint -- --max-warnings=0' });
  const lint = await runCommand('npm', ['run', 'lint', '--', '--max-warnings=0']);
  recordVerification('lint', lint.exitCode === 0 ? 'pass' : 'fail', {
    exitCode: lint.exitCode,
    stderr: lint.stderr,
  });

  let tests = { exitCode: 0, stdout: '', stderr: '' };
  let testStatus = 'skipped';

  if (pkgJson.scripts?.test) {
    recordThought('metrics', 'Running test suite', { command: 'npm run test -- --watch=false' });
    tests = await runCommand('npm', ['run', 'test', '--', '--watch=false']);
    testStatus = tests.exitCode === 0 ? 'pass' : 'fail';
    recordVerification('tests', testStatus, {
      exitCode: tests.exitCode,
      stderr: tests.stderr,
    });
  } else {
    recordThought('metrics', 'No test script detected; marking as skipped', {});
    recordVerification('tests', 'skipped', {});
  }

  recordThought('metrics', 'Running build check', { command: 'npm run build' });
  const build = await runCommand('npm', ['run', 'build']);
  const buildStatus = build.exitCode === 0 ? 'pass' : 'fail';
  recordVerification('build', buildStatus, {
    exitCode: build.exitCode,
    stderr: build.stderr,
  });

  const buildOutput = `${build.stdout || ''}\n${build.stderr || ''}`;
  const chunkWarningPattern = /Some chunks are larger than 500 kB/;
  const chunkWarningTriggered = chunkWarningPattern.test(buildOutput);
  let largeChunkLines = [];

  if (chunkWarningTriggered) {
    largeChunkLines = (build.stdout || '')
      .split('\n')
      .filter((line) => line.trim().startsWith('dist/') && /kB\b/.test(line))
      .map((line) => line.trim());

    recordThought('metrics', 'Detected oversized bundle output', {
      files: largeChunkLines.slice(0, 5),
    });
    recordVerification('chunk-size-warning', 'warn', {
      count: largeChunkLines.length,
      files: largeChunkLines.slice(0, 10),
    });
  } else {
    recordVerification('chunk-size-warning', 'pass', { count: 0 });
  }

  // TODO: integrate dependency-cruiser or custom heuristics.
  const metrics = {
    lintStatus: lint.exitCode === 0 ? 'pass' : 'fail',
    testStatus,
    buildStatus,
    chunkSizeStatus: chunkWarningTriggered ? 'warn' : 'pass',
    timestamp: new Date().toISOString(),
  };

  const chunkWarning = {
    triggered: chunkWarningTriggered,
    files: largeChunkLines,
  };

  return { metrics, lint, tests, build, chunkWarning };
}

async function analyzeDependencies() {
  recordThought('analysis', 'Running dependency analysis via dependency-cruiser', {
    command: 'npx dependency-cruiser --config depcruise.config.cjs --output-type json src',
  });

  const result = await runCommand('npx', ['dependency-cruiser', '--config', 'depcruise.config.cjs', '--output-type', 'json', 'src']);

  if (result.exitCode !== 0) {
    recordThought('analysis', 'dependency-cruiser exited with non-zero code', {
      exitCode: result.exitCode,
      stderr: result.stderr,
    });
    recordVerification('dependency-cruiser', 'fail', { exitCode: result.exitCode });
    return { status: 'failed', modules: [], cycles: [], violations: [] };
  }

  try {
    const payload = JSON.parse(result.stdout || '{}');
    const cycles = payload.summary?.circular || [];
    const violations = payload.summary?.violations || [];
    const modules = payload.modules || [];

    recordVerification('dependency-cruiser', 'pass', {
      cycleCount: cycles.length,
      violationCount: violations.length,
    });

    if (cycles.length) {
      recordThought('analysis', 'Detected circular dependencies', {
        samples: cycles.slice(0, 3),
      });
    }

    return {
      status: 'success',
      modules,
      cycles,
      violations,
    };
  } catch (error) {
    recordThought('analysis', 'Failed to parse dependency-cruiser output', { error: error.message });
    recordVerification('dependency-cruiser', 'fail', { parseError: error.message });
    return { status: 'failed', modules: [], cycles: [], violations: [] };
  }
}

function buildPlan(metrics, hotspots, task) {
  const steps = [];

  if (task?.title) {
    steps.push(`Verify code surrounding task "${task.title}" adheres to modularity guidelines.`);
  }
  if (hotspots.length) {
    const topFile = hotspots[0];
    steps.push(`Decompose ${topFile.file} (current size: ${topFile.lines} LOC) into focused modules.`);
  } else {
    steps.push('Review recently touched files for incremental refactors.');
  }

  steps.push('Apply refactor with automated lint/test guardrails.');
  steps.push('Capture CoT and CoVe summaries before requesting review.');

  const plan = {
    createdAt: new Date().toISOString(),
    steps: steps.slice(0, 5),
    metrics,
    hotspots,
    task,
  };

  recordThought('planning', 'Drafted refactor plan', plan);
  return plan;
}

async function determineBranchName() {
  const cliBranch = argv.get('branch');
  if (cliBranch) {
    return cliBranch;
  }

  const envBranch = process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME;
  if (envBranch) {
    return envBranch;
  }

  const branchResult = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branchResult.exitCode === 0) {
    const resolved = branchResult.stdout.trim();
    return resolved === 'HEAD' ? 'detached-head' : resolved;
  }

  const fallback = path.basename(workspaceRoot) || 'workspace';
  return fallback.replace(/[^a-zA-Z0-9-_]/g, '-');
}

async function writeReflection(plan, results) {
  const branchName = await determineBranchName();
  const planFile = path.join(plansDir, `${branchName}.md`);

  const cotSection = traceEntries
    .map((entry, index) => `${index + 1}. [${entry.phase}] ${entry.message} (${entry.timestamp})${Object.keys(entry.context || {}).length ? `\n   Evidence: ${JSON.stringify(entry.context)}` : ''}`)
    .join('\n');

  const coveSection = verificationEntries
    .map((entry, index) => `${index + 1}. ${entry.name}: ${entry.status} (${entry.timestamp})${Object.keys(entry.evidence || {}).length ? `\n   Evidence: ${JSON.stringify(entry.evidence)}` : ''}`)
    .join('\n');

  const hotspotLine = plan.hotspots?.length
    ? `\n- Hotspots: ${plan.hotspots.map((h) => `${h.file} (${h.lines} LOC)`).join(', ')}`
    : '\n- Hotspots: none';
  const dependencyCyclesLine = `\n- Dependency cycles: ${results.dependencies?.cycles?.length ?? 0}`;
  const dependencyViolationsLine = `\n- Rule violations: ${results.dependencies?.violations?.length ?? 0}`;
  const dependencySection =
    results.dependencies?.status === 'success'
      ? `\n\n## Dependency Insights\n- Circular samples: ${JSON.stringify(results.dependencies.cycles.slice(0, 3))}`
      : '\n\n## Dependency Insights\n- Analysis unavailable (see verification log).';

  const content = `# Copilot Refactor Reflection\n\n` +
    `**Branch:** ${branchName}\n\n` +
    `## Plan\n` +
    plan.steps.map((step, index) => `${index + 1}. ${step}`).join('\n') +
    `\n\n## Metrics\n` +
    `- Lint: ${plan.metrics.lintStatus}\n` +
    `- Tests: ${plan.metrics.testStatus}\n` +
    `- Build: ${plan.metrics.buildStatus}\n` +
    `- Chunk size: ${plan.metrics.chunkSizeStatus || 'pass'}\n` +
    `- Timestamp: ${plan.metrics.timestamp}\n` +
    hotspotLine +
    dependencyCyclesLine +
    dependencyViolationsLine +
    `\n\n## Chain of Thought\n` +
    (cotSection || '_No reasoning captured._') +
    `\n\n## Chain of Verification\n` +
    (coveSection || '_No verifications captured._') +
    dependencySection +
    (plan.metrics.chunkSizeStatus !== 'pass'
      ? `\n\n## Performance Notes\n- Chunk size warning: ${plan.metrics.chunkSizeStatus}\n` +
        (results.performance?.length
          ? results.performance.slice(0, 10).map((file, idx) => `${idx + 1}. ${file}`).join('\n')
          : '- Large chunk details not recorded.')
      : '') +
    `\n\n## Notes\n` +
    (results.notes?.length ? results.notes.join('\n') : '_No changes applied (dry-run)._') +
    `\n`;

  await fs.writeFile(planFile, content, 'utf8');
  return planFile;
}

async function writeReports(reportData) {
  if (!shouldApply) {
    recordVerification('report-write', 'skipped', {});
    recordThought('reports', 'Skipping report emission because --apply was not provided', {});
    return;
  }

  await fs.mkdir(reportsDir, { recursive: true });

  const hotspotReportPath = path.join(reportsDir, 'hotspots.json');
  const dependencyReportPath = path.join(reportsDir, 'dependency-insights.json');

  await fs.writeFile(hotspotReportPath, JSON.stringify(reportData.hotspots, null, 2), 'utf8');
  await fs.writeFile(dependencyReportPath, JSON.stringify(reportData.dependencies, null, 2), 'utf8');

  recordVerification('report-write', 'pass', {
    hotspots: hotspotReportPath,
    dependencies: dependencyReportPath,
  });
  recordThought('reports', 'Wrote analysis reports', {
    hotspots: hotspotReportPath,
    dependencies: dependencyReportPath,
  });
}

async function main() {
  recordThought('init', 'Starting Copilot refactor agent run', { dryRun: isDryRun, apply: shouldApply });
  await ensureCopilotDirs();
  const pkgJson = await readPackageJson();
  recordThought('context', 'Loaded package.json', {
    scripts: Object.keys(pkgJson.scripts || {}),
    dependencies: Object.keys(pkgJson.dependencies || {}),
  });

  const { metrics, lint, tests, build, chunkWarning } = await collectMetrics(pkgJson);

  const jsxCheck = await detectJsxFilenameIssues();
  if (jsxCheck.status === 'fail') {
    console.error('Detected JSX syntax inside files with .js extensions. Convert them to .jsx before proceeding:', jsxCheck.issues.slice(0, 10));
    recordThought('guardrail', 'Aborting run due to JSX filename violations', { count: jsxCheck.issues.length });
    recordVerification('preflight', 'fail', { reason: 'jsx-extension', files: jsxCheck.issues });
    process.exitCode = 1;
    return;
  }
  if (jsxCheck.status === 'error') {
    console.error('Unable to complete JSX filename validation. See logs for details.');
    recordThought('guardrail', 'Aborting run due to JSX filename scan error', {});
    recordVerification('preflight', 'fail', { reason: 'jsx-scan-error' });
    process.exitCode = 1;
    return;
  }

  const hasTests = pkgJson.scripts?.test;
  if (lint.exitCode !== 0 || (hasTests && tests.exitCode !== 0) || build.exitCode !== 0) {
    console.error('Pre-flight checks failed. Resolve lint/test/build issues before running refactors.');
    recordVerification('preflight', 'fail', { lintExit: lint.exitCode, testExit: tests.exitCode, buildExit: build.exitCode });
    process.exitCode = 1;
    return;
  }

  const fileMetrics = await calculateFileMetrics();
  const hotspotThreshold = Number(argv.get('hotspot-threshold') || 250);
  const hotspots = identifyHotspots(fileMetrics, hotspotThreshold);
  const dependencyInsights = await analyzeDependencies();

  const plan = buildPlan(metrics, hotspots, taskContext);

  const results = {
    notes: [
      'Dry-run mode is enabled. No code changes were made.',
      shouldApply
        ? 'Analysis reports written to .copilot/reports.'
        : 'Run with --apply to emit analysis reports and enable automated refactors.',
    ],
    hotspots,
    dependencies: dependencyInsights,
    task: taskContext,
    performance: chunkWarning?.triggered ? chunkWarning.files : [],
  };

  if (chunkWarning?.triggered) {
    results.notes.push('⚠️ Vite reported oversized build chunks. Review the performance notes below.');
  }

  if (!isDryRun) {
    // TODO: Add refactor execution logic here, capturing each commit diff for review.
    recordThought('execution', 'Refactor execution would occur here', {});
  }

  await writeReports({
    hotspots,
    dependencies: dependencyInsights,
  });
  recordVerification('preflight', 'pass', { lintExit: lint.exitCode, testExit: tests.exitCode, buildExit: build.exitCode });
  recordThought('summary', 'Completed dry-run', {
    planSteps: plan.steps.length,
    hotspots: hotspots.length,
    dependencyCycles: dependencyInsights.cycles?.length || 0,
  });

  const planFile = await writeReflection(plan, results);
  console.log(`Reflection written to ${path.relative(workspaceRoot, planFile)}`);
}

main().catch((error) => {
  console.error('Copilot refactor agent encountered an error:', error);
  process.exit(1);
});
