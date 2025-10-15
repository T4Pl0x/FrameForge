import type { Rect, LuminanceSample } from './types';
// Vite-friendly worker URL
const WorkerURL = new URL('./canvasA11y.worker.ts', import.meta.url);

function hexToRGB(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return undefined;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export class CanvasA11yClient {
  private worker: Worker;
  constructor() {
    this.worker = new Worker(WorkerURL, { type: 'module' });
  }
  sampleBackground(bitmap: ImageBitmap, targetId: string, area: Rect, dpr: number, fg?: string) {
    return new Promise<LuminanceSample>((resolve) => {
      const fgColor = fg ? hexToRGB(fg) : undefined;
      const req = { cmd: 'sample', targetId, area, dpr, method: 'grid', bitmap, fgColor } as const;
      this.worker.onmessage = (e: MessageEvent) => resolve((e.data as any).sample as LuminanceSample);
      // Transfer ownership for zero-copy
      this.worker.postMessage(req, [bitmap as any]);
    });
  }
}
