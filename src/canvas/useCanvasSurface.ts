import { useCallback, useMemo } from 'react';

type Rect = { x: number; y: number; width: number; height: number };
type Input = Rect | { area: Rect; dpr?: number };

let _html2canvasPromise: Promise<any> | null = null;

function normalize(input: Input): { area: Rect; dpr: number } {
  if ((input as any)?.area) {
    const obj = input as { area: Rect; dpr?: number };
    return { area: obj.area, dpr: Number(obj.dpr) || (window.devicePixelRatio || 1) };
  }
  const area = input as Rect;
  return { area, dpr: (window.devicePixelRatio || 1) };
}

export function useCanvasSurface(rootEl?: HTMLElement | null) {
  const getRenderBitmap = useCallback(async (input: Input) => {
    const { area, dpr } = normalize(input);
    if (typeof createImageBitmap !== 'function') return null as unknown as ImageBitmap;

    // Case 1: snapshot arbitrary DOM subtree via html2canvas
    if (rootEl) {
      try {
        if (!_html2canvasPromise) {
          _html2canvasPromise = import(/* @vite-ignore */ 'html2canvas').then((mod: any) => mod?.default || mod);
        }
        const html2canvas: any = await _html2canvasPromise;
        const canvas: HTMLCanvasElement = await html2canvas(rootEl, {
          backgroundColor: null,
          scale: dpr,
          logging: false,
          useCORS: true,
          windowWidth: rootEl.scrollWidth,
          windowHeight: rootEl.scrollHeight,
        });

        const off = (typeof OffscreenCanvas !== 'undefined')
          ? new OffscreenCanvas(Math.max(1, Math.floor(area.width * dpr)), Math.max(1, Math.floor(area.height * dpr)))
          : (() => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.floor(area.width * dpr)); c.height = Math.max(1, Math.floor(area.height * dpr)); return c; })();
        const ctx = (off as any).getContext('2d');
        ctx.drawImage(
          canvas,
          Math.floor(area.x * dpr),
          Math.floor(area.y * dpr),
          Math.floor(area.width * dpr),
          Math.floor(area.height * dpr),
          0,
          0,
          (off as any).width,
          (off as any).height,
        );
        try { return await createImageBitmap(off as any); } catch { return null as unknown as ImageBitmap; }
      } catch {
        return null as unknown as ImageBitmap;
      }
    }

    // Case 2: find a canvas and crop directly
    const canvas = document.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return null as unknown as ImageBitmap;
    try {
      const off = (typeof OffscreenCanvas !== 'undefined')
        ? new OffscreenCanvas(Math.max(1, Math.floor(area.width * dpr)), Math.max(1, Math.floor(area.height * dpr)))
        : (() => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.floor(area.width * dpr)); c.height = Math.max(1, Math.floor(area.height * dpr)); return c; })();
      const ctx = (off as any).getContext('2d');
      ctx.drawImage(
        canvas,
        Math.floor(area.x * dpr),
        Math.floor(area.y * dpr),
        Math.floor(area.width * dpr),
        Math.floor(area.height * dpr),
        0,
        0,
        (off as any).width,
        (off as any).height,
      );
      return await createImageBitmap(off as any);
    } catch {
      return null as unknown as ImageBitmap;
    }
  }, [rootEl]);

  return useMemo(() => ({ getRenderBitmap }), [getRenderBitmap]);
}
