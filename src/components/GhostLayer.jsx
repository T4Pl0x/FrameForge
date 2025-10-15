import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function GhostLayer({ doc }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);
  const [ghost, setGhost] = useState(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  if (!rootRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.setAttribute('data-ghost-root', 'true');
    Object.assign(el.style, { position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' });
    document.body.appendChild(el);
    rootRef.current = el;
  }

  useEffect(() => {
    const onStart = () => setActive(true);
    const onQueue = (ev) => {
      const d = ev?.detail || {};
      if (d.type === 'frame') {
        const frame = (doc?.frames || []).find((f) => f.id === d.frameId);
        if (!frame) return;
        setGhost({ x: frame.x, y: frame.y, w: frame.width, h: frame.height });
      } else if (d.type === 'node') {
        const frame = (doc?.frames || []).find((f) => f.id === d.frameId);
        const nd = (frame?.nodes || []).find((n) => n.id === d.nodeId);
        const x = (frame?.x || 0) + (nd?.props?.x || 0);
        const y = (frame?.y || 0) + (nd?.props?.y || 0);
        setGhost({ x, y, w: nd?.props?.width || 100, h: nd?.props?.height || 40 });
      }
      // crude delta estimate from updates
      const u = d.updates || {};
      setDx((u.x ?? 0) || (u.width ? 0 : dx));
      setDy((u.y ?? 0) || (u.height ? 0 : dy));
    };
    const onFlush = () => { setActive(false); setGhost(null); setDx(0); setDy(0); };
    window.addEventListener('ff:gesture:start', onStart);
    window.addEventListener('ff:gesture:queue', onQueue);
    window.addEventListener('ff:gesture:flush', onFlush);
    return () => {
      window.removeEventListener('ff:gesture:start', onStart);
      window.removeEventListener('ff:gesture:queue', onQueue);
      window.removeEventListener('ff:gesture:flush', onFlush);
    };
  }, [doc]);

  if (!rootRef.current) return null;
  if (!active || !ghost) return null;

  const style = {
    position: 'absolute',
    left: ghost.x,
    top: ghost.y,
    width: ghost.w,
    height: ghost.h,
    opacity: 0.6,
    transform: `translate3d(${dx}px, ${dy}px, 0)`,
    transition: 'opacity 160ms ease-out',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    borderRadius: 8,
    background: 'rgba(240,240,245,0.7)',
    backdropFilter: 'blur(2px)'
  };

  return createPortal(
    <div aria-hidden="true"><div style={style} /></div>,
    rootRef.current
  );
}

