import { Rect } from './bridge';

export class Dom2dSurface {
  constructor(canvas) { this.canvas = canvas; }
  async getRenderBitmap({ area: _area, dpr: _dpr = window.devicePixelRatio || 1 }) {
    // Fast-path: transfer the whole canvas; the worker can crop via area
    return await createImageBitmap(this.canvas);
  }
}
