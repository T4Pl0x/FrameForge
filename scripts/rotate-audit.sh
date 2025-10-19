#!/bin/bash
set -euo pipefail

# FrameForge Audit Rotation Script
# Rotates audit.log and backs up gate-summary.json for post-launch reliability

echo "🔄 FrameForge Audit Rotation"
echo "============================"

# Create timestamp for backup files
ts=$(date +%Y%m%d-%H%M%S)
echo "📅 Timestamp: $ts"

# Rotate audit.log if it exists
audit_log="frameforge/reports/audit.log"
if [ -f "$audit_log" ]; then
    echo "📋 Rotating audit.log..."
    backup_audit="frameforge/reports/audit.$ts.log"
    cp "$audit_log" "$backup_audit" && echo "  ✅ Backed up to: $backup_audit"
    # Truncate original log (don't delete - keeps inodes/logs happy)
    : > "$audit_log" && echo "  🗑️  Truncated: $audit_log"
else
    echo "⚠️  No audit.log found at $audit_log"
fi

# Backup gate-summary.json if it exists
gate_summary=".echo/gate-summary.json"
if [ -f "$gate_summary" ]; then
    echo "🎛️  Backing up gate-summary.json..."
    backup_gates=".echo/gate-summary.$ts.json"
    cp "$gate_summary" "$backup_gates" && echo "  ✅ Backed up to: $backup_gates"
else
    echo "ℹ️  No gate-summary.json found at $gate_summary"
fi

echo ""
echo "✅ Rotation complete - ready for recovery drills"
echo "💡 Test recovery: scripts/recover-audit.sh $ts"

# Verification
echo ""
echo "🔍 Verification:"
[ -f "$backup_audit" ] && echo "✅ Audit backup exists" || echo "❌ Audit backup missing"
[ -f "$backup_gates" ] && echo "✅ Gate summary backup exists" || echo "❌ Gate summary backup missing"
echo "📊 Current audit.log size: $(stat -f%z "$audit_log" 2>/dev/null || stat -c%s "$audit_log" 2>/dev/null || echo "unknown") bytes"

echo ""
echo "🎯 Recovery drill ready!"
