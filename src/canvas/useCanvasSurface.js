import { Dom2dSurface } from './bridgeDom2d';

let cachedSurface = null;

export function useCanvasSurface() {
  if (cachedSurface) return cachedSurface;
  const canvas = document.querySelector('canvas');
  if (canvas instanceof HTMLCanvasElement) {
    cachedSurface = new Dom2dSurface(canvas);
  } else {
    cachedSurface = {
      async getRenderBitmap() {
        throw new Error('Canvas surface not wired (no <canvas> found).');
      },
    };
  }
  return cachedSurface;
}
