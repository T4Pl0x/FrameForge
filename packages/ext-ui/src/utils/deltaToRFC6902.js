export function deltaMoveToPatches(selection, dx, dy) {
  if (!dx && !dy) return [];
  return (selection || []).map((s) => ([
    { op: 'replace', path: `${s.path}/x`, value: (s.x || 0) + dx },
    { op: 'replace', path: `${s.path}/y`, value: (s.y || 0) + dy },
  ])).flat();
}

export function deltaResizeToPatches(node, dw, dh, keepTopLeft = true) {
  const ps = [];
  if (dw) ps.push({ op: 'replace', path: `${node.path}/w`, value: Math.max(1, (node.w || 0) + dw) });
  if (dh) ps.push({ op: 'replace', path: `${node.path}/h`, value: Math.max(1, (node.h || 0) + dh) });
  return ps;
}

