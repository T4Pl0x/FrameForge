import { useCallback, useMemo } from 'react';

type Rect = { x: number; y: number; width: number; height: number };

export function useCanvasSurface(rootEl: HTMLElement | null) {
  const getRenderBitmap = useCallback(async (area: Rect) => {
    let html2canvas: any;
    try {
      const mod: any = await import(/* @vite-ignore */ 'html2canvas');
      html2canvas = mod?.default || mod;
    } catch (e) {
      console.warn('[FrameForge] html2canvas not available, falling back to null bitmap', e);
      return null as unknown as ImageBitmap;
    }
    if (!rootEl) return null as unknown as ImageBitmap;

    const dpr = window.devicePixelRatio || 1;
    const canvas: HTMLCanvasElement = await html2canvas(rootEl, {
      backgroundColor: null,
      scale: dpr,
      logging: false,
      useCORS: true,
      windowWidth: rootEl.scrollWidth,
      windowHeight: rootEl.scrollHeight,
    });

    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.floor(area.width * dpr));
    off.height = Math.max(1, Math.floor(area.height * dpr));
    const ctx = off.getContext('2d')!;
    ctx.drawImage(
      canvas,
      Math.floor(area.x * dpr),
      Math.floor(area.y * dpr),
      Math.floor(area.width * dpr),
      Math.floor(area.height * dpr),
      0,
      0,
      off.width,
      off.height,
    );

    try {
      // modern browsers can take canvas or OffscreenCanvas
      return await createImageBitmap(off);
    } catch {
      return null as unknown as ImageBitmap;
    }
  }, [rootEl]);

  return useMemo(() => ({ getRenderBitmap }), [getRenderBitmap]);
}

