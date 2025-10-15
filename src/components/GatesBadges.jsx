import React, { useEffect, useMemo, useState } from 'react';
import GateBadge from './GateBadge.jsx';
import { getGatesInfo, subscribeGates, startGatesTap } from '../state/gates.js';

export default function GatesBadges() {
  const [st, setSt] = useState(() => getGatesInfo());
  useEffect(() => { startGatesTap(); const off = subscribeGates(setSt); return () => off?.(); }, []);

  const links = useMemo(() => {
    const arts = st?.info?.artifacts || {};
    const find = (candidates) => {
      const names = Object.keys(arts || {});
      for (const c of candidates) {
        const exact = names.find(n => n === c);
        if (exact) return arts[exact];
      }
      for (const c of candidates) {
        const like = names.find(n => n.toLowerCase().includes(c.toLowerCase()));
        if (like) return arts[like];
      }
      return undefined;
    };
    return {
      tests: find(['tests-report.json','tests.json','tests','junit','jest']),
      a11y: find(['a11y-report.json','a11y.json','a11y','axe']),
      lintBuild: find(['lint-build.json','lint.json','build.json','lint','build'])
    };
  }, [st]);

  const tips = useMemo(() => {
    const s = st?.info?.summary || {};
    const t = s.tests || {};
    const a = s.a11y || {};
    const l = s.lint || {};
    const b = s.build || {};
    return {
      tests: (t.total || t.passed || t.failed || t.skipped)
        ? `passed ${t.passed ?? 0} • failed ${t.failed ?? 0}${(t.skipped || t.total) ? ` • skipped ${t.skipped ?? 0}${t.total ? ` • total ${t.total}` : ''}` : ''}`
        : undefined,
      a11y: (a.violations || a.unwaived === 0 || a.unwaived)
        ? `violations ${a.violations ?? 0}${(a.unwaived !== undefined) ? ` • unwaived ${a.unwaived}` : ''}`
        : undefined,
      lintBuild: (l.errors || l.warnings || b.errors || b.warnings)
        ? `lint ${l.errors ?? 0}e/${l.warnings ?? 0}w • build ${b.errors ?? 0}e/${b.warnings ?? 0}w`
        : undefined,
    };
  }, [st]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <GateBadge label="Tests" state={st.gates.tests} tooltip={tips.tests} />
        {links.tests && <a href={links.tests} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Reports</a>}
        {st?.info?.prUrl && <a href={st.info.prUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'underline' }}>PR</a>}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <GateBadge label="A11y" state={st.gates.a11y} tooltip={tips.a11y} />
        {links.a11y && <a href={links.a11y} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Reports</a>}
        {st?.info?.prUrl && <a href={st.info.prUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'underline' }}>PR</a>}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <GateBadge label="Lint/Build" state={st.gates.lintBuild} tooltip={tips.lintBuild} />
        {links.lintBuild && <a href={links.lintBuild} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>Reports</a>}
        {st?.info?.prUrl && <a href={st.info.prUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'underline' }}>PR</a>}
      </div>
    </div>
  );
}
