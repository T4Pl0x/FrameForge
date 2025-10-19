import React, { useEffect, useState } from 'react';
import { relLum, contrast, hexToRgb } from '../a11y/contrast';
import { useCanvasSurface } from '../canvas/useCanvasSurface';

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  rootEl: HTMLElement | null;
  selection: { targetId: string; area: Rect };
  fgColor?: string;
  isLargeText?: boolean;
  isIconOnly?: boolean;
};

export function ContrastBadge({ rootEl, selection, fgColor, isLargeText, isIconOnly }: Props) {
  const [value, setValue] = useState<number | null>(null);
  const [worst, setWorst] = useState<number | null>(null);
  const [resampleNonce, setResampleNonce] = useState(0);
  const surface = useCanvasSurface(rootEl);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bmp = await surface.getRenderBitmap(selection.area);
      if (!bmp || !fgColor) { if (!cancelled) { setValue(null); setWorst(null); } return; }
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(selection.area.width * dpr));
      const h = Math.max(1, Math.floor(selection.area.height * dpr));
      const off: any = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : (() => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; })();
      const ctx = off.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bmp as any, 0, 0);
      const steps = 5;
      const dx = Math.max(1, Math.floor(w / steps));
      const dy = Math.max(1, Math.floor(h / steps));
      let sumL = 0, cnt = 0, minL = 1, maxL = 0;
      for (let y = dy >> 1; y < h; y += dy) {
        for (let x = dx >> 1; x < w; x += dx) {
          const d = ctx.getImageData(x, y, 1, 1).data;
          const L = relLum(d[0] / 255, d[1] / 255, d[2] / 255);
          sumL += L; cnt++; if (L < minL) minL = L; if (L > maxL) maxL = L;
        }
      }
      const bgL = cnt ? sumL / cnt : 0;
      const rgb = hexToRgb(fgColor); if (!rgb) return;
      const fgL = relLum(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      const crAvg = contrast(fgL, bgL);
      const crWorst = Math.min(contrast(fgL, minL), contrast(fgL, maxL));
      if (!cancelled) { setValue(crAvg); setWorst(crWorst); }
    })();
    return () => { cancelled = true; };
  }, [rootEl, selection.targetId, selection.area.x, selection.area.y, selection.area.width, selection.area.height, fgColor, resampleNonce]);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail || {};
        const tgt = detail?.target || detail?.selection || {};
        if (!tgt || !selection) { setResampleNonce(n => n + 1); return; }
        // If the applied spec touches current selection, force resample
        if (!tgt.componentId || tgt.componentId === selection.targetId) {
          setResampleNonce(n => n + 1);
        }
      } catch { setResampleNonce(n => n + 1); }
    };
    window.addEventListener('ff.spec.applied', handler as EventListener);
    return () => { window.removeEventListener('ff.spec.applied', handler as EventListener); };
  }, [selection?.targetId]);

  if (value == null) return <span className="ff-badge ff-badge--muted" title="Sampling…">Contrast …</span>;

  const target = isIconOnly ? 3.0 : (isLargeText ? 3.0 : 4.5);
  const worstVal = (worst ?? value)!;
  const pass = worstVal >= target;
  const title = `WCAG AA target ${target}:1 — worst ${worstVal.toFixed(1)}:1`;

  const fixWithAI = async () => {
    try {
      const anyWin: any = window as any;
      const sel = { screenId: (selection as any).screenId, frameId: (selection as any).frameId, componentId: selection.targetId };
      if (anyWin?.mcp?.logic?.invoke) {
        const scan = await anyWin.mcp.logic.invoke('a11y_scan', { target: { selection: sel } });
        const proposal = scan?.quickFixProposals?.[0] || await anyWin.mcp.ui.invoke('apply_theme', { selection: sel, scope: 'component', themeId: '__auto__improve_contrast', overrides: {} });
        anyWin.dispatchEvent(new CustomEvent('ff.proposal', { detail: { proposal } }));
      } else {
        anyWin.dispatchEvent(new CustomEvent('ff.proposal', { detail: { hint: 'increase contrast', target: sel } }));
      }
    } catch (e) {
      console.warn('Fix with AI failed:', e);
    }
  };

  return (
    <div className={`ff-badge ${pass ? 'ff-badge--ok' : 'ff-badge--warn'}`} title={title}>
      Contrast {worstVal.toFixed(1)}:1 {pass ? 'OK' : 'Fail'}
      {!pass && (
        <button className="ff-link" style={{ marginLeft: 8 }} onClick={fixWithAI}>
          Fix with AI
        </button>
      )}
    </div>
  );
}

