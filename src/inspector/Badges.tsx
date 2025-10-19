import React, { useEffect, useState } from 'react';
import type { Rect } from '../a11y/types';
import { CanvasA11yClient } from '../a11y';
import { useCanvasSurface } from '../canvas/useCanvasSurface';

export function ContrastBadge({ selection, fgColor }: { selection: { targetId: string; area: Rect }, fgColor?: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [minRatio, setMinRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const surface: any = useCanvasSurface();
  const client: any = (ContrastBadge as any)._client || ((ContrastBadge as any)._client = new CanvasA11yClient());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dpr = (window.devicePixelRatio || 1);
        const bitmap = await surface.getRenderBitmap({ area: selection.area, dpr });
        const sample = await client.sampleBackground(bitmap, selection.targetId, selection.area, dpr, fgColor);
        if (!cancelled) {
          setRatio(sample.contrast ?? null);
          setMinRatio(sample.minContrast ?? null);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'sampling failed');
      }
    })();
    return () => { cancelled = true; };
  }, [selection.targetId, selection.area.x, selection.area.y, selection.area.width, selection.area.height, fgColor]);

  if (error) return <span className="badge" title={error}>Contrast error</span>;
  if (ratio == null) return <span className="badge">Contrast …</span>;
  const worst = minRatio ?? ratio;
  const pass = worst >= 4.5; // adjust for large text scenario separately
  const label = `${worst.toFixed(1)}:1`;
  return (
    <div className="badge" title={`Computed vs sampled bg; worst-case ${label}`}>
      Contrast {label} {pass ? 'OK' : 'Fail'}
    </div>
  );
}

(ContrastBadge as any)._client = undefined;

