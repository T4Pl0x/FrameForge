#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// FrameForge Ops Heartbeat - SLO monitoring for production health
// Measures: Mutation integrity, Proposal RTT, Extension load reliability

function loadJsonFile(filepath) {
  try {
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.warn(`Failed to load ${filepath}: ${e.message}`);
    return null;
  }
}

function collectHeartbeatData() {
  const now = new Date();
  const ts = now.toISOString();

  // Mutation Integrity: Count direct writes to spec/* outside kernel.apply
  // Read from audit.log and .echo/ gate summaries
  const auditLog = loadJsonFile('frameforge/reports/audit.log');
  const gateSummary = loadJsonFile('.echo/gate-summary.json');

  let directWriteCount = 0;
  if (auditLog) {
    // Count unauthorized spec writes
    const specWrites = auditLog.filter(entry =>
      entry.operation === 'write' &&
      entry.path?.startsWith('spec/') &&
      !entry.authorizedBy?.includes('kernel.apply')
    );
    directWriteCount = specWrites.length;
  }

  // Proposal RTT: 95th percentile from recent proposals
  let proposalRttMsP95 = null;
  let recentProposals = [];

  try {
    const proposalsDir = 'frameforge/reports/proposals';
    if (fs.existsSync(proposalsDir)) {
      const files = fs.readdirSync(proposalsDir)
        .filter(f => f.endsWith('.json'))
        .slice(-20); // Last 20 proposals

      recentProposals = files.map(f => {
        const proposal = loadJsonFile(path.join(proposalsDir, f));
        if (proposal && proposal.proposedAt && proposal.appliedAt) {
          const proposed = new Date(proposal.proposedAt);
          const applied = new Date(proposal.appliedAt);
          return applied.getTime() - proposed.getTime();
        }
        return null;
      }).filter(Boolean);

      if (recentProposals.length >= 5) {
        recentProposals.sort((a, b) => a - b);
        const p95Index = Math.floor(recentProposals.length * 0.95);
        proposalRttMsP95 = recentProposals[p95Index];
      }
    }
  } catch (e) {
    console.warn(`Error collecting proposal RTT: ${e.message}`);
  }

  // Extension Load Reliability: Success rate from gate badges
  let extLoadOkRate = null;
  if (gateSummary && gateSummary.sessions) {
    const sessions = gateSummary.sessions.slice(-10); // Last 10 sessions
    if (sessions.length > 0) {
      const successfulLoads = sessions.filter(s => s.extensionsLoaded).length;
      extLoadOkRate = successfulLoads / sessions.length;
    }
  }

  return {
    ts,
    proposalRttMsP95,
    extLoadOkRate,
    directWriteCount,
    recentProposals: recentProposals.length,
    metadata: {
      auditLogSize: auditLog ? auditLog.length : 0,
      gateSummarySessions: gateSummary?.sessions?.length || 0
    }
  };
}

function appendOpsHeartbeat(data) {
  const opsFile = 'frameforge/reports/ops.jsonl';
  try {
    const line = JSON.stringify(data) + '\n';
    fs.appendFileSync(opsFile, line);
    console.log(`✅ Ops heartbeat written: RTT ${data.proposalRttMsP95}ms, Load Rate ${(data.extLoadOkRate * 100).toFixed(1)}%, Writes ${data.directWriteCount}`);
  } catch (e) {
    console.error(`❌ Failed to write ops heartbeat: ${e.message}`);
    process.exit(1);
  }
}

function checkSLOS(data) {
  const issues = [];

  // SLO: 0 direct writes to spec/* outside kernel.apply
  if (data.directWriteCount > 0) {
    issues.push(`❌ MUTATION INTEGRITY: ${data.directWriteCount} unauthorized spec writes`);
  }

  // SLO: Proposal RTT < 5 minutes (300000ms)
  if (data.proposalRttMsP95 && data.proposalRttMsP95 > 300000) {
    issues.push(`⚠️ PROPOSAL RTT: 95th percentile ${(data.proposalRttMsP95 / 1000).toFixed(0)}s > 5min SLO`);
  }

  // SLO: Extension load > 99% reliability
  if (data.extLoadOkRate !== null && data.extLoadOkRate < 0.99) {
    issues.push(`⚠️ EXT LOAD RELIABILITY: ${(data.extLoadOkRate * 100).toFixed(1)}% < 99% SLO`);
  }

  return issues;
}

// Main execution
const heartbeatData = collectHeartbeatData();
const sloIssues = checkSLOS(heartbeatData);

appendOpsHeartbeat(heartbeatData);

// Report SLO status (exit 0 always as requested)
console.log('\n📊 SLO Status:');
if (sloIssues.length === 0) {
  console.log('✅ All SLOs within bounds');
} else {
  sloIssues.forEach(issue => console.log(issue));
}

// Always exit successfully for CI nightly runs
console.log('\n💚 Heartbeat complete');
process.exit(0);
